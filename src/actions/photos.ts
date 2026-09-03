'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { reindexFailedPhotos as reindexFailedPhotosInDb } from '@/lib/db/queue';
import { albums, photos } from '@/lib/db/schemas';
import { resolveShareLink } from '@/lib/import/share-link';
import { getPresignedDownloadUrl, getPresignedUploadUrl, headObject } from '@/lib/storage/presign';
import { randomFilename } from '@/lib/utils/random-filename';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const MAX_IMPORT = 1000;

export async function requestPhotoUpload(input: {
  albumId: string;
  filename: string;
  contentType: string;
}) {
  await requireAdmin();

  const [album] = await db.select().from(albums).where(eq(albums.id, input.albumId));
  if (!album) throw new Error('Album not found');

  const storageKey = `albums/${album.id}/${randomFilename(input.filename)}`;
  const uploadUrl = await getPresignedUploadUrl(storageKey, input.contentType);

  const [photo] = await db
    .insert(photos)
    .values({ albumId: album.id, storageKey, status: 'awaiting_upload' })
    .returning();

  return { photoId: photo.id, uploadUrl };
}

// Confirma que o PUT presignado realmente chegou ao bucket (HeadObject) antes
// de liberar a foto para a fila — evita fotos "pending" fantasma se o
// navegador falhar silenciosamente entre o presign e o upload.
export async function confirmPhotoUploaded(photoId: string) {
  await requireAdmin();

  const [photo] = await db.select().from(photos).where(eq(photos.id, photoId));
  if (!photo) throw new Error('Photo not found');

  const head = await headObject(photo.storageKey);

  await db
    .update(photos)
    .set({ status: 'pending', bytes: head.ContentLength ?? null })
    .where(eq(photos.id, photoId));

  revalidatePath(`/admin/albums/${photo.albumId}`);
  revalidatePath(`/admin/albums/${photo.albumId}/photos`);
}

// Importa fotos de um link público (Google Drive ou Dropbox) — só resolve o
// link (1 request HTTP, sem baixar as imagens) e enfileira: baixar centenas
// de fotos aqui dentro estouraria o timeout da Server Action. O worker
// (pnpm worker:face-indexer) baixa cada uma via `photos.sourceUrl`.
export async function importFromShareLink(input: { albumId: string; url: string }) {
  await requireAdmin();

  const [album] = await db.select().from(albums).where(eq(albums.id, input.albumId));
  if (!album) throw new Error('Album not found');

  const images = await resolveShareLink(input.url);
  if (images.length > MAX_IMPORT) throw new Error(`Limite de ${MAX_IMPORT} fotos por importação.`);

  await db.insert(photos).values(
    images.map((img) => ({
      albumId: album.id,
      storageKey: `albums/${album.id}/${randomFilename(img.filename)}`,
      sourceUrl: img.url,
      status: 'pending' as const,
    })),
  );

  revalidatePath(`/admin/albums/${album.id}`);
  revalidatePath(`/admin/albums/${album.id}/photos`);
  return { count: images.length };
}

export async function reindexFailedPhotos(albumId: string) {
  await requireAdmin();
  await reindexFailedPhotosInDb(albumId);
  revalidatePath(`/admin/albums/${albumId}`);
  revalidatePath(`/admin/albums/${albumId}/photos`);
}

export async function getPhotosByAlbum(albumId: string, limit = 50, offset = 0) {
  await requireAdmin();
  return db
    .select()
    .from(photos)
    .where(eq(photos.albumId, albumId))
    .orderBy(photos.createdAt)
    .limit(limit)
    .offset(offset);
}

// Galeria paginada do admin (/admin/albums/[id]/photos) — mostra as fotos
// já enviadas com URL assinada de download, pra conferência visual.
export async function getAlbumPhotosPage(albumId: string, page: number, pageSize = 12) {
  await requireAdmin();

  const offset = (Math.max(1, page) - 1) * pageSize;
  const [rows, [{ count }]] = await Promise.all([
    getPhotosByAlbum(albumId, pageSize, offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(photos)
      .where(eq(photos.albumId, albumId)),
  ]);

  const withUrls = await Promise.all(
    rows.map(async (photo) => ({ ...photo, url: await getPresignedDownloadUrl(photo.storageKey) })),
  );

  return { photos: withUrls, total: count, page, pageSize };
}
