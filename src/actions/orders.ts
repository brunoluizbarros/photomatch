'use server';

import { randomBytes } from 'node:crypto';
import { canAccessEvent } from '@/actions/access-requests';
import { db } from '@/lib/db/client';
import { events, event_plans, order_items, orders, photos } from '@/lib/db/schemas';
import { quoteCart } from '@/lib/pricing';
import { isRateLimited } from '@/lib/rate-limit';
import { getPresignedDownloadUrl } from '@/lib/storage/presign';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

// Superfície pública, sem sessão — mesmo espírito de public-search.ts: quem
// revisa segurança lê este arquivo inteiro, não precisa caçar em vários.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ITEMS = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;

async function getClientIp() {
  const headerList = await headers();
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

// Só evento publicado E com venda ligada — a flag desligada bloqueia a
// CRIAÇÃO de pedidos novos (não revoga o acesso de quem já comprou, ver
// getOrderPhotoDownloadUrl).
async function getSellableEventBySlug(slug: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isPublished, true), eq(events.salesEnabled, true)));
  return event ?? null;
}

// Planos de um evento com venda ligada — usado por /e/[slug] pra montar a
// barra de carrinho. Sem dado sensível (nome/quota/preço já são públicos por
// natureza, o convidado vai vê-los na hora de montar o carrinho de qualquer
// jeito), então sem rate limit próprio.
export async function listPublicPlans(eventId: string) {
  const rows = await db.select().from(event_plans).where(eq(event_plans.eventId, eventId));
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    digitalQuota: p.digitalQuota,
    printQuota: p.printQuota,
    priceCents: p.priceCents,
    extraDigitalPriceCents: p.extraDigitalPriceCents,
    extraPrintPriceCents: p.extraPrintPriceCents,
  }));
}

export type CartItemInput = { photoId: string; digital: boolean; print: boolean };

// Cria o pedido. Preço nunca vem do cliente: só {photoId, digital, print}
// atravessam a rede — o total é recalculado aqui com quoteCart a partir dos
// planos e preços avulsos lidos do evento.
//
// accessToken: obrigatório quando o evento é privado (ver
// src/actions/access-requests.ts:canAccessEvent) — sem isso, quem soubesse o
// slug de um evento privado com venda ligada poderia comprar fotos que nunca
// teve acesso aprovado pra ver.
export async function createOrder(
  slug: string,
  items: CartItemInput[],
  buyer: { name: string; email: string; phone: string; marketingOptIn: boolean },
  accessToken: string | null = null,
) {
  const ip = await getClientIp();
  if (isRateLimited(`public-order:${ip}`, 5, RATE_LIMIT_WINDOW_MS)) {
    return { ok: false as const, error: 'Muitas tentativas em pouco tempo. Espere um minuto.' };
  }

  if (items.length === 0 || items.length > MAX_ITEMS) {
    return { ok: false as const, error: 'Selecione ao menos uma foto.' };
  }
  for (const item of items) {
    if (!item.photoId || (!item.digital && !item.print)) {
      return { ok: false as const, error: 'Seleção inválida.' };
    }
  }

  const name = buyer.name.trim();
  const email = buyer.email.trim();
  const phone = buyer.phone.trim();
  if (!name) return { ok: false as const, error: 'Nome é obrigatório.' };
  if (!EMAIL_RE.test(email)) return { ok: false as const, error: 'E-mail inválido.' };
  if (!phone) return { ok: false as const, error: 'Telefone inválido.' };
  if (name.length > 200 || email.length > 200 || phone.length > 40) {
    return { ok: false as const, error: 'Dados inválidos.' };
  }

  const event = await getSellableEventBySlug(slug);
  if (!event) return { ok: false as const, error: 'Evento não encontrado.' };
  if (!(await canAccessEvent(event, accessToken))) {
    return { ok: false as const, error: 'Evento não encontrado.' };
  }

  // Toda foto tem que pertencer a ESTE evento e já ter preview (mesma guarda
  // da busca pública) — sem isso alguém posta ids de outro evento e compra
  // fotos que nunca viu.
  const photoIds = [...new Set(items.map((i) => i.photoId))];
  const validRows = await db
    .select({ id: photos.id })
    .from(photos)
    .where(
      and(eq(photos.eventId, event.id), inArray(photos.id, photoIds), isNotNull(photos.previewKey)),
    );
  if (validRows.length !== photoIds.length) {
    return { ok: false as const, error: 'Uma ou mais fotos não pertencem a este evento.' };
  }

  const digitalCount = items.filter((i) => i.digital).length;
  const printCount = items.filter((i) => i.print).length;
  const plans = await db.select().from(event_plans).where(eq(event_plans.eventId, event.id));
  const quote = quoteCart({ digitalCount, printCount, plans });
  if (quote.unavailable) {
    return {
      ok: false as const,
      error: 'Não foi possível calcular o preço deste carrinho. Fale com a organização do evento.',
    };
  }

  const token = randomBytes(32).toString('base64url');

  const order = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(orders)
      .values({
        eventId: event.id,
        token,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        marketingOptIn: buyer.marketingOptIn,
        planId: quote.plan?.id ?? null,
        planName: quote.plan?.name ?? null,
        planPriceCents: quote.planPriceCents,
        extraDigitalCount: quote.extraDigital,
        extraPrintCount: quote.extraPrint,
        extraDigitalPriceCents: quote.plan?.extraDigitalPriceCents ?? 0,
        extraPrintPriceCents: quote.plan?.extraPrintPriceCents ?? 0,
        totalCents: quote.totalCents,
      })
      .returning();

    const itemRows = items.flatMap((item) => {
      const rows: { orderId: string; photoId: string; kind: 'digital' | 'print' }[] = [];
      if (item.digital) rows.push({ orderId: inserted.id, photoId: item.photoId, kind: 'digital' });
      if (item.print) rows.push({ orderId: inserted.id, photoId: item.photoId, kind: 'print' });
      return rows;
    });
    await tx.insert(order_items).values(itemRows);
    return inserted;
  });

  revalidatePath(`/admin/events/${event.id}/orders`);
  return { ok: true as const, token: order.token };
}

export async function getOrderByToken(token: string) {
  const ip = await getClientIp();
  if (isRateLimited(`public-order:${ip}`, 30, RATE_LIMIT_WINDOW_MS)) {
    return { ok: false as const, error: 'Muitas tentativas. Espere um minuto e tente de novo.' };
  }

  const [order] = await db.select().from(orders).where(eq(orders.token, token));
  if (!order) return { ok: false as const, error: 'Pedido não encontrado.' };

  // Thumb é o preview com marca d'água (mesmo que o convidado viu no
  // carrinho) — nunca o original, o pedido pode ainda nem estar pago.
  const rows = await db
    .select({
      id: order_items.id,
      photoId: order_items.photoId,
      kind: order_items.kind,
      printedAt: order_items.printedAt,
      deliveredAt: order_items.deliveredAt,
      previewKey: photos.previewKey,
      storageKey: photos.storageKey,
    })
    .from(order_items)
    .innerJoin(photos, eq(order_items.photoId, photos.id))
    .where(eq(order_items.orderId, order.id));

  const items = await Promise.all(
    rows.map(async ({ previewKey, storageKey, ...item }) => ({
      ...item,
      url: await getPresignedDownloadUrl(previewKey ?? storageKey),
    })),
  );

  return { ok: true as const, order, items };
}

// Verificação inteira numa query só: token válido + pedido pago + item
// digital + a foto pedida — tudo no where, nada em passos separados. Se não
// retornar linha, {ok:false} genérico (não distingue token errado de item de
// impressão de pedido não pago — não conta ao cliente qual falhou).
export async function getOrderPhotoDownloadUrl(token: string, photoId: string) {
  const ip = await getClientIp();
  if (isRateLimited(`public-order:${ip}`, 30, RATE_LIMIT_WINDOW_MS)) {
    return { ok: false as const, error: 'Muitas tentativas. Espere um minuto e tente de novo.' };
  }

  const [row] = await db
    .select({ storageKey: photos.storageKey })
    .from(order_items)
    .innerJoin(orders, eq(order_items.orderId, orders.id))
    .innerJoin(photos, eq(order_items.photoId, photos.id))
    .where(
      and(
        eq(orders.token, token),
        eq(orders.status, 'paid'),
        eq(order_items.kind, 'digital'),
        eq(order_items.photoId, photoId),
      ),
    );
  if (!row) return { ok: false as const, error: 'Foto indisponível.' };

  const url = await getPresignedDownloadUrl(row.storageKey, `${photoId}.jpg`);
  return { ok: true as const, url };
}
