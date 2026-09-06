'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { events, event_plans, order_items, orders, photos } from '@/lib/db/schemas';
import { markOrderPaid as markOrderPaidWrite } from '@/lib/orders/mark-paid';
import { getPresignedDownloadUrl } from '@/lib/storage/presign';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Tudo neste arquivo é admin-only — é a metade "config e operação" da venda
// de fotos. A metade pública (sem sessão) fica em src/actions/orders.ts.

export async function setSalesEnabled(eventId: string, enabled: boolean) {
  await requireAdmin();
  await db.update(events).set({ salesEnabled: enabled }).where(eq(events.id, eventId));
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/plans`);
}

export async function setUnitPrices(
  eventId: string,
  input: { digitalUnitPriceCents: number; printUnitPriceCents: number },
) {
  await requireAdmin();
  if (input.digitalUnitPriceCents < 0 || input.printUnitPriceCents < 0) {
    return { ok: false as const, error: 'Preço não pode ser negativo.' };
  }
  await db
    .update(events)
    .set({
      digitalUnitPriceCents: Math.trunc(input.digitalUnitPriceCents),
      printUnitPriceCents: Math.trunc(input.printUnitPriceCents),
    })
    .where(eq(events.id, eventId));
  revalidatePath(`/admin/events/${eventId}/plans`);
  return { ok: true as const };
}

export async function listPlans(eventId: string) {
  await requireAdmin();
  return db
    .select()
    .from(event_plans)
    .where(eq(event_plans.eventId, eventId))
    .orderBy(event_plans.priceCents);
}

export async function createPlan(
  eventId: string,
  input: { name: string; digitalQuota: number; printQuota: number; priceCents: number },
) {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: 'Nome é obrigatório.' };
  if (input.digitalQuota < 0 || input.printQuota < 0 || input.priceCents < 0) {
    return { ok: false as const, error: 'Valores não podem ser negativos.' };
  }
  const [plan] = await db
    .insert(event_plans)
    .values({
      eventId,
      name,
      digitalQuota: Math.trunc(input.digitalQuota),
      printQuota: Math.trunc(input.printQuota),
      priceCents: Math.trunc(input.priceCents),
    })
    .returning();
  revalidatePath(`/admin/events/${eventId}/plans`);
  return { ok: true as const, plan };
}

export async function updatePlan(
  planId: string,
  input: { name: string; digitalQuota: number; printQuota: number; priceCents: number },
) {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: 'Nome é obrigatório.' };
  if (input.digitalQuota < 0 || input.printQuota < 0 || input.priceCents < 0) {
    return { ok: false as const, error: 'Valores não podem ser negativos.' };
  }
  const [plan] = await db
    .update(event_plans)
    .set({
      name,
      digitalQuota: Math.trunc(input.digitalQuota),
      printQuota: Math.trunc(input.printQuota),
      priceCents: Math.trunc(input.priceCents),
    })
    .where(eq(event_plans.id, planId))
    .returning();
  if (!plan) return { ok: false as const, error: 'Plano não encontrado.' };
  revalidatePath(`/admin/events/${plan.eventId}/plans`);
  return { ok: true as const, plan };
}

// Apagar um plano é seguro mesmo com pedidos antigos: orders.planName /
// planPriceCents são snapshot, nunca um join com event_plans (ver
// src/lib/db/schemas/orders.ts). planId do pedido antigo vira null.
export async function deletePlan(planId: string) {
  await requireAdmin();
  const [plan] = await db.delete(event_plans).where(eq(event_plans.id, planId)).returning();
  if (plan) revalidatePath(`/admin/events/${plan.eventId}/plans`);
  return { ok: true as const };
}

export async function listOrders(eventId: string) {
  await requireAdmin();
  return db
    .select()
    .from(orders)
    .where(eq(orders.eventId, eventId))
    .orderBy(desc(orders.createdAt));
}

export async function markOrderPaid(orderId: string) {
  const { userId } = await requireAdmin();
  const order = await markOrderPaidWrite(orderId, userId);
  if (!order) return { ok: false as const, error: 'Pedido não encontrado.' };
  revalidatePath(`/admin/events/${order.eventId}/orders`);
  revalidatePath(`/admin/events/${order.eventId}/print-queue`);
  return { ok: true as const };
}

export async function cancelOrder(orderId: string) {
  await requireAdmin();
  const [order] = await db
    .update(orders)
    .set({ status: 'canceled' })
    .where(eq(orders.id, orderId))
    .returning();
  if (!order) return { ok: false as const, error: 'Pedido não encontrado.' };
  revalidatePath(`/admin/events/${order.eventId}/orders`);
  return { ok: true as const };
}

// Itens de impressão de pedidos já pagos, ainda não impressos — a fila em si.
// Assina o ORIGINAL (storageKey), o mesmo que a folha /print usa, pra deixar
// o operador conferir a foto antes de mandar pra impressão.
export async function listPrintQueue(eventId: string) {
  await requireAdmin();
  const rows = await db
    .select({
      itemId: order_items.id,
      orderId: orders.id,
      customerName: orders.customerName,
      photoId: photos.id,
      storageKey: photos.storageKey,
      createdAt: order_items.createdAt,
    })
    .from(order_items)
    .innerJoin(orders, eq(order_items.orderId, orders.id))
    .innerJoin(photos, eq(order_items.photoId, photos.id))
    .where(
      and(
        eq(orders.eventId, eventId),
        eq(orders.status, 'paid'),
        eq(order_items.kind, 'print'),
        isNull(order_items.printedAt),
      ),
    )
    .orderBy(order_items.createdAt);

  return Promise.all(
    rows.map(async (row) => ({ ...row, url: await getPresignedDownloadUrl(row.storageKey) })),
  );
}

// eventId vem do cliente só para revalidar o caminho certo — a query em si
// não usa (a fila já filtra por evento na leitura, isto só marca).
export async function markItemsPrinted(eventId: string, itemIds: string[]) {
  await requireAdmin();
  if (itemIds.length === 0) return { ok: true as const };
  for (const itemId of itemIds) {
    await db.update(order_items).set({ printedAt: new Date() }).where(eq(order_items.id, itemId));
  }
  revalidatePath(`/admin/events/${eventId}/print-queue`);
  return { ok: true as const };
}

export async function markItemDelivered(eventId: string, itemId: string) {
  await requireAdmin();
  await db.update(order_items).set({ deliveredAt: new Date() }).where(eq(order_items.id, itemId));
  revalidatePath(`/admin/events/${eventId}/orders`);
  return { ok: true as const };
}
