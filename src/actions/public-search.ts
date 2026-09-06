'use server';

import { db } from '@/lib/db/client';
import { events, analytics_events, photos } from '@/lib/db/schemas';
import { NoFaceDetectedError, searchPhotosByFace } from '@/lib/photo-search';
import { isRateLimited } from '@/lib/rate-limit';
import { getPresignedDownloadUrl } from '@/lib/storage/presign';
import { and, eq, isNotNull } from 'drizzle-orm';
import { headers } from 'next/headers';

const MAX_SEARCHES_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_SEARCH_RESULTS = 200;
// Teto de selfies por busca (grupo/família numa mesma busca). Validado aqui,
// não confiado ao cliente — sem isso, uma "busca" com 50 selfies faria 50
// chamadas ao Rekognition consumindo 1 único slot do rate limit por IP.
const MAX_SELFIES_PER_SEARCH = 3;

async function getClientIp() {
  const headerList = await headers();
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function getPublishedEventBySlug(slug: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isPublished, true)));
  return event;
}

// Endpoint público, sem login: convidado tira selfie em /e/[slug] e recebe as
// fotos dele. A selfie nunca é persistida — trafega só como base64 no corpo
// desta Server Action e morre com a request.
//
// {ok, error} em vez de lançar: o Next redige mensagens de erros lançados em
// Server Actions no build de produção, trocando por texto genérico + digest.
// O convidado precisa ler a mensagem exata (rate limit / rosto não detectado).
//
// selfiesBase64: 1+ selfies da mesma busca (grupo/família) — os resultados
// são a união deduplicada dos matches de todas elas (ver searchPhotosByFace).
// O rate limit por IP conta 1 busca, não 1 por selfie.
export async function searchPhotosBySelfiePublic(
  slug: string,
  selfiesBase64: string[],
  deviceId: string,
) {
  const ip = await getClientIp();
  if (isRateLimited(`public-search:${ip}`, MAX_SEARCHES_PER_WINDOW, RATE_LIMIT_WINDOW_MS)) {
    return {
      ok: false as const,
      error: 'Muitas buscas em pouco tempo. Espere um minuto e tente de novo.',
    };
  }

  const selfies = selfiesBase64.slice(0, MAX_SELFIES_PER_SEARCH);
  if (selfies.length === 0) {
    return { ok: false as const, error: 'Tire pelo menos uma selfie.' };
  }

  const event = await getPublishedEventBySlug(slug);
  if (!event) return { ok: false as const, error: 'Evento não encontrado.' };

  let results: Awaited<ReturnType<typeof searchPhotosByFace>>;
  try {
    results = await searchPhotosByFace({
      collectionId: event.rekognitionCollectionId,
      selfiesBase64: selfies,
      limit: MAX_SEARCH_RESULTS,
    });
  } catch (err) {
    if (err instanceof NoFaceDetectedError) return { ok: false as const, error: err.message };
    throw err;
  }

  // Analytics nunca pode derrubar a busca do convidado.
  try {
    await db.insert(analytics_events).values({
      eventId: event.id,
      deviceId: deviceId.slice(0, 64),
      type: 'search',
      photoCount: results.length,
    });
  } catch (err) {
    console.error('search event insert failed', err);
  }

  return { ok: true as const, photos: results };
}

// Assina o download só quando o convidado clica — 1 assinatura por clique em
// vez de gerar (e descartar) uma "de download" pra cada foto do grid.
//
// Com venda ligada este download grátis do preview é desativado — senão
// ninguém compra. Nesse caso a entrega passa a ser via pedido pago (ver
// src/actions/orders.ts:getOrderPhotoDownloadUrl, que assina o original).
export async function getPhotoDownloadUrl(slug: string, photoId: string) {
  const ip = await getClientIp();
  if (isRateLimited(`public-search:${ip}`, MAX_SEARCHES_PER_WINDOW, RATE_LIMIT_WINDOW_MS)) {
    return { ok: false as const, error: 'Muitas tentativas. Espere um minuto e tente de novo.' };
  }

  const event = await getPublishedEventBySlug(slug);
  if (!event) return { ok: false as const, error: 'Evento não encontrado.' };
  if (event.salesEnabled) {
    return { ok: false as const, error: 'O download avulso está desativado. Monte seu pedido.' };
  }

  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, photoId), eq(photos.eventId, event.id), isNotNull(photos.previewKey)));
  if (!photo) return { ok: false as const, error: 'Foto não encontrada.' };

  const url = await getPresignedDownloadUrl(photo.previewKey as string, `${slug}-${photoId}.jpg`);
  return { ok: true as const, url };
}
