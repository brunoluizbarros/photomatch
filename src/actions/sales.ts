'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { events, event_plans, order_items, orders, photos } from '@/lib/db/schemas';
import { markOrderPaid as markOrderPaidWrite } from '@/lib/orders/mark-paid';
import { getPresignedDownloadUrl } from '@/lib/storage/presign';
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Tudo neste arquivo é admin-only — é a metade "config e operação" da venda
// de fotos. A metade pública (sem sessão) fica em src/actions/orders.ts.

export async function setSalesEnabled(eventId: string, enabled: boolean) {
  await requireAdmin();
  await db.update(events).set({ salesEnabled: enabled }).where(eq(events.id, eventId));
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/plans`);
}

export async function listPlans(eventId: string) {
  await requireAdmin();
  return db
    .select()
    .from(event_plans)
    .where(eq(event_plans.eventId, eventId))
    .orderBy(event_plans.priceCents);
}

type PlanInput = {
  name: string;
  digitalQuota: number;
  printQuota: number;
  priceCents: number;
  extraDigitalPriceCents: number;
  extraPrintPriceCents: number;
};

function validatePlanInput(input: PlanInput) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: 'Nome é obrigatório.' };
  if (
    input.digitalQuota < 0 ||
    input.printQuota < 0 ||
    input.priceCents < 0 ||
    input.extraDigitalPriceCents < 0 ||
    input.extraPrintPriceCents < 0
  ) {
    return { ok: false as const, error: 'Valores não podem ser negativos.' };
  }
  return {
    ok: true as const,
    values: {
      name,
      digitalQuota: Math.trunc(input.digitalQuota),
      printQuota: Math.trunc(input.printQuota),
      priceCents: Math.trunc(input.priceCents),
      extraDigitalPriceCents: Math.trunc(input.extraDigitalPriceCents),
      extraPrintPriceCents: Math.trunc(input.extraPrintPriceCents),
    },
  };
}

export async function createPlan(eventId: string, input: PlanInput) {
  await requireAdmin();
  const validated = validatePlanInput(input);
  if (!validated.ok) return validated;
  const [plan] = await db
    .insert(event_plans)
    .values({ eventId, ...validated.values })
    .returning();
  revalidatePath(`/admin/events/${eventId}/plans`);
  return { ok: true as const, plan };
}

export async function updatePlan(planId: string, input: PlanInput) {
  await requireAdmin();
  const validated = validatePlanInput(input);
  if (!validated.ok) return validated;
  const [plan] = await db
    .update(event_plans)
    .set(validated.values)
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

// extraDigitalCount/extraPrintCount no pedido são só os itens avulsos (além
// da cota do plano) — um pedido inteiro dentro da cota mostra 0/0 ali, o que
// parece "carrinho vazio" pro admin. Aqui contamos os order_items de verdade
// (por kind) pra mostrar quantas fotos o pedido realmente tem.
export async function listOrders(eventId: string) {
  await requireAdmin();
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.eventId, eventId))
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) return [];

  const itemCounts = await db
    .select({ orderId: order_items.orderId, kind: order_items.kind, total: count() })
    .from(order_items)
    .where(
      inArray(
        order_items.orderId,
        orderRows.map((o) => o.id),
      ),
    )
    .groupBy(order_items.orderId, order_items.kind);

  const countsByOrder = new Map<string, { digitalCount: number; printCount: number }>();
  for (const row of itemCounts) {
    const entry = countsByOrder.get(row.orderId) ?? { digitalCount: 0, printCount: 0 };
    if (row.kind === 'digital') entry.digitalCount = row.total;
    else entry.printCount = row.total;
    countsByOrder.set(row.orderId, entry);
  }

  return orderRows.map((order) => ({
    ...order,
    ...(countsByOrder.get(order.id) ?? { digitalCount: 0, printCount: 0 }),
  }));
}

// Fotos de um pedido (qualquer status) pro admin conferir o que foi
// comprado antes de marcar como pago — mesmo padrão de assinatura do
// listPrintQueue, mas aqui é o preview com marca d'água (o mesmo que o
// convidado viu no carrinho), não o original.
export async function listOrderPhotos(orderId: string) {
  await requireAdmin();
  const rows = await db
    .select({
      itemId: order_items.id,
      kind: order_items.kind,
      previewKey: photos.previewKey,
      storageKey: photos.storageKey,
    })
    .from(order_items)
    .innerJoin(photos, eq(order_items.photoId, photos.id))
    .where(eq(order_items.orderId, orderId))
    .orderBy(order_items.createdAt);

  return Promise.all(
    rows.map(async (row) => ({
      itemId: row.itemId,
      kind: row.kind,
      url: await getPresignedDownloadUrl(row.previewKey ?? row.storageKey),
    })),
  );
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
