'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { albums, photos } from '@/lib/db/schemas';
import {
  collectionIdForAlbum,
  createAlbumCollection,
  deleteAlbumCollection,
} from '@/lib/rekognition/faces';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function listAlbums() {
  await requireAdmin();
  return db.select().from(albums).orderBy(albums.createdAt);
}

export async function getAlbum(id: string) {
  await requireAdmin();
  const [album] = await db.select().from(albums).where(eq(albums.id, id));
  return album ?? null;
}

// Sem sessão de propósito: é o ponto de entrada da página pública /e/[slug].
export async function getPublishedAlbumBySlug(slug: string) {
  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.slug, slug), eq(albums.isPublished, true)));
  return album ?? null;
}

export async function createAlbum(input: { name: string; slug: string; eventDate?: string }) {
  await requireAdmin();

  // Cria a Collection na AWS antes do INSERT: se a AWS falhar, não sobra
  // linha órfã no Postgres.
  const id = createId();
  const collectionId = collectionIdForAlbum(id);
  await createAlbumCollection(collectionId);

  const [album] = await db
    .insert(albums)
    .values({
      id,
      name: input.name,
      slug: input.slug,
      eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
      rekognitionCollectionId: collectionId,
    })
    .returning();

  revalidatePath('/admin');
  return album;
}

export async function setPublished(albumId: string, isPublished: boolean) {
  await requireAdmin();
  await db.update(albums).set({ isPublished }).where(eq(albums.id, albumId));
  revalidatePath(`/admin/albums/${albumId}`);
}

// Customização da página pública /e/[slug] — template editorial portado do
// Réveillon Carneiros. Todos os campos são opcionais: sem eles, a página cai
// nos defaults do template (gradiente com a cor primária no lugar da foto de
// capa, sem logo, texto de boas-vindas genérico).
export async function updateAlbumBranding(
  albumId: string,
  input: {
    heroImageUrl: string | null;
    logoUrl: string | null;
    primaryColor: string;
    welcomeMessage: string | null;
  },
) {
  await requireAdmin();
  await db
    .update(albums)
    .set({
      heroImageUrl: input.heroImageUrl || null,
      logoUrl: input.logoUrl || null,
      primaryColor: input.primaryColor,
      welcomeMessage: input.welcomeMessage || null,
    })
    .where(eq(albums.id, albumId));
  revalidatePath(`/admin/albums/${albumId}`);
}

// Descarte de biometria (LGPD): apaga a Collection inteira na AWS numa única
// chamada, depois o DELETE com cascade limpa photos e photo_faces.
export async function deleteAlbum(albumId: string) {
  await requireAdmin();
  const [album] = await db.select().from(albums).where(eq(albums.id, albumId));
  if (!album) throw new Error('Album not found');

  await deleteAlbumCollection(album.rekognitionCollectionId);
  await db.delete(albums).where(eq(albums.id, albumId));
  revalidatePath('/admin');
}

export async function getAlbumProgress(albumId: string) {
  await requireAdmin();
  const rows = await db
    .select({
      status: photos.status,
      count: sql<number>`count(*)::int`,
      unindexed: sql<number>`coalesce(sum(${photos.unindexedFaceCount}), 0)::int`,
    })
    .from(photos)
    .where(eq(photos.albumId, albumId))
    .groupBy(photos.status);

  const progress = { awaiting_upload: 0, pending: 0, processing: 0, indexed: 0, failed: 0 };
  let unindexedFaceCount = 0;
  for (const row of rows) {
    progress[row.status] = row.count;
    unindexedFaceCount += row.unindexed;
  }

  return {
    ...progress,
    total: Object.values(progress).reduce((a, b) => a + b, 0),
    unindexedFaceCount,
  };
}
