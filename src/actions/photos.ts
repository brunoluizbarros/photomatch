'use server';

import { ownedBy, requireUser } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { eventAllowsAllPhotos } from '@/lib/db/event-scope';
import { reindexFailedPhotos as reindexFailedPhotosInDb } from '@/lib/db/queue';
import { events, photos } from '@/lib/db/schemas';
import { resolveShareLink } from '@/lib/import/share-link';
import { getPresignedDownloadUrl, getPresignedUploadUrl, headObject } from '@/lib/storage/presign';
import { randomFilename } from '@/lib/utils/random-filename';
import { and, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const MAX_IMPORT = 1000;

export async function requestPhotoUpload(input: {
  eventId: string;
  albumId?: string | null;
  filename: string;
  contentType: string;
}) {
  const { userId } = await requireUser('admin', 'photographer');

  const [event] = await db.select().from(events).where(eq(events.id, input.eventId));
  if (!event) throw new Error('Event not found');

  // ponytail: prefixo "albums/" mantido de propósito — é o mesmo usado pelas
  // chaves já existentes no bucket (de quando "álbum" era o nome do evento no
  // código); a chave é opaca, trocar o prefixo não traz ganho.
  const storageKey = `albums/${event.id}/${randomFilename(input.filename)}`;
  const uploadUrl = await getPresignedUploadUrl(storageKey, input.contentType);

  const [photo] = await db
    .insert(photos)
    .values({
      eventId: event.id,
      albumId: input.albumId || null,
      uploadedBy: userId,
      storageKey,
      status: 'awaiting_upload',
    })
    .returning();

  return { photoId: photo.id, uploadUrl };
}

// Confirma que o PUT presignado realmente chegou ao bucket (HeadObject) antes
// de liberar a foto para a fila — evita fotos "pending" fantasma se o
// navegador falhar silenciosamente entre o presign e o upload.
export async function confirmPhotoUploaded(photoId: string) {
  const { role, userId } = await requireUser('admin', 'photographer');

  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.id, photoId), ownedBy(role, userId, photos.uploadedBy)));
  if (!photo) throw new Error('Photo not found');

  const head = await headObject(photo.storageKey);

  await db
    .update(photos)
    .set({ status: 'pending', bytes: head.ContentLength ?? null })
    .where(eq(photos.id, photoId));

  revalidatePath(`/admin/events/${photo.eventId}`);
  revalidatePath(`/admin/events/${photo.eventId}/photos`);
}

// Importa fotos de um link público (Google Drive ou Dropbox) — só resolve o
// link (1 request HTTP, sem baixar as imagens) e enfileira: baixar centenas
// de fotos aqui dentro estouraria o timeout da Server Action. O worker
// (pnpm worker:face-indexer) baixa cada uma via `photos.sourceUrl`.
//
// Retorna {ok, error} em vez de lançar: as falhas daqui (link não suportado,
// pasta privada, pasta do Dropbox) são todas mensagens que o admin precisa
// ler pra corrigir o link — e o Next redige a mensagem de erros lançados em
// Server Actions no build de produção, trocando por um texto genérico + digest.
export async function importFromShareLink(input: {
  eventId: string;
  albumId?: string | null;
  url: string;
}) {
  const { userId } = await requireUser('admin', 'photographer');

  const [event] = await db.select().from(events).where(eq(events.id, input.eventId));
  if (!event) return { ok: false as const, error: 'Evento não encontrado.' };

  let images: Awaited<ReturnType<typeof resolveShareLink>>;
  try {
    images = await resolveShareLink(input.url);
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Não foi possível resolver esse link.',
    };
  }
  if (images.length > MAX_IMPORT) {
    return { ok: false as const, error: `Limite de ${MAX_IMPORT} fotos por importação.` };
  }

  await db.insert(photos).values(
    images.map((img) => ({
      eventId: event.id,
      albumId: input.albumId || null,
      uploadedBy: userId,
      storageKey: `albums/${event.id}/${randomFilename(img.filename)}`,
      sourceUrl: img.url,
      status: 'pending' as const,
    })),
  );

  revalidatePath(`/admin/events/${event.id}`);
  revalidatePath(`/admin/events/${event.id}/photos`);
  return { ok: true as const, count: images.length };
}

export async function reindexFailedPhotos(eventId: string) {
  const { role, userId } = await requireUser('admin', 'photographer');
  const allowAll = role === 'photographer' && (await eventAllowsAllPhotos(eventId));
  const ownerId = role === 'photographer' && !allowAll ? userId : undefined;
  await reindexFailedPhotosInDb(eventId, ownerId);
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/photos`);
}

// Galeria paginada do admin (/admin/events/[id]/photos) — mostra as fotos já
// enviadas com URL assinada de download, pra conferência visual. Fotógrafo só
// vê as fotos que ele mesmo subiu; opcionalmente filtra por álbum (pasta) —
// albumId === null explicitamente busca só "sem álbum".
export async function getEventPhotosPage(
  eventId: string,
  page: number,
  pageSize = 12,
  albumFilter?: { albumId: string | null },
) {
  const { role, userId } = await requireUser();
  const allowAll = await eventAllowsAllPhotos(eventId);

  const conditions = [
    eq(photos.eventId, eventId),
    ownedBy(role, userId, photos.uploadedBy, allowAll),
  ];
  if (albumFilter) {
    conditions.push(
      albumFilter.albumId === null
        ? sql`${photos.albumId} is null`
        : eq(photos.albumId, albumFilter.albumId),
    );
  }
  const where = and(...conditions);

  const offset = (Math.max(1, page) - 1) * pageSize;
  const [rows, [{ count }]] = await Promise.all([
    db.select().from(photos).where(where).orderBy(photos.createdAt).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(photos).where(where),
  ]);

  const withUrls = await Promise.all(
    rows.map(async (photo) => ({ ...photo, url: await getPresignedDownloadUrl(photo.storageKey) })),
  );

  return { photos: withUrls, total: count, page, pageSize };
}

// Página de impressão (/admin/events/[id]/print) — recebe só os IDs e assina
// as URLs aqui, no servidor, com o mesmo escopo de dono da galeria. Nunca
// aceitar uma URL assinada vinda do cliente: um fotógrafo colando IDs alheios
// na querystring não deve conseguir ver/imprimir foto de outro.
export async function getPhotosForPrint(eventId: string, photoIds: string[]) {
  const { role, userId } = await requireUser();
  const allowAll = await eventAllowsAllPhotos(eventId);
  const rows = await db
    .select()
    .from(photos)
    .where(
      and(
        eq(photos.eventId, eventId),
        inArray(photos.id, photoIds),
        ownedBy(role, userId, photos.uploadedBy, allowAll),
      ),
    );
  return Promise.all(
    rows.map(async (photo) => ({ ...photo, url: await getPresignedDownloadUrl(photo.storageKey) })),
  );
}

// Fotos com pelo menos um rosto que o Rekognition não conseguiu indexar
// (qualidade baixa demais) — é o "quais fotos" por trás do aviso agregado no
// painel de progresso (src/components/admin/event-progress.tsx).
export async function getPhotosWithUnindexedFaces(eventId: string) {
  const { role, userId } = await requireUser();
  const allowAll = await eventAllowsAllPhotos(eventId);
  const rows = await db
    .select()
    .from(photos)
    .where(
      and(
        eq(photos.eventId, eventId),
        gt(photos.unindexedFaceCount, 0),
        ownedBy(role, userId, photos.uploadedBy, allowAll),
      ),
    )
    .orderBy(desc(photos.unindexedFaceCount));
  return Promise.all(
    rows.map(async (photo) => ({ ...photo, url: await getPresignedDownloadUrl(photo.storageKey) })),
  );
}
