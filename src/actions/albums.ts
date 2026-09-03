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

// Cards de estatística do painel principal — porta o padrão de dashboard do
// ticketeria-techstage (contagens agregadas + destaque em número grande).
export async function getDashboardStats() {
  await requireAdmin();
  const [albumStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where ${albums.isPublished})::int`,
    })
    .from(albums);
  const [photoStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      indexed: sql<number>`count(*) filter (where ${photos.status} = 'indexed')::int`,
    })
    .from(photos);
  return { albums: albumStats, photos: photoStats };
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

// Retorna {ok, error} em vez de lançar pro caso esperado (slug duplicado):
// o Next redige a mensagem de erros lançados em Server Actions no build de
// produção (substitui por um texto genérico + digest, de propósito, pra não
// vazar detalhe de servidor) — só falhas verdadeiramente inesperadas (AWS,
// banco) devem continuar lançando e caindo nesse comportamento redigido.
export async function createAlbum(input: { name: string; slug: string; eventDate?: string }) {
  await requireAdmin();

  // Checa o slug ANTES de criar a Collection: o insert é a última coisa que
  // acontece, então um slug repetido deixaria uma Collection órfã na AWS.
  // Ainda racy sob submits concorrentes — quem garante de verdade é o índice
  // único do slug; isto só evita o caso comum (admin reenvia um nome já usado).
  const [taken] = await db
    .select({ id: albums.id })
    .from(albums)
    .where(eq(albums.slug, input.slug));
  if (taken) return { ok: false as const, error: 'Já existe um álbum com esse slug.' };

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
      // T12:00 local: <input type="date"> manda 'YYYY-MM-DD', que new Date()
      // interpreta como meia-noite UTC — em UTC-3 a data exibida voltaria um dia.
      eventDate: input.eventDate ? new Date(`${input.eventDate}T12:00:00`) : undefined,
      rekognitionCollectionId: collectionId,
    })
    .returning();

  revalidatePath('/admin');
  return { ok: true as const, album };
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
    fontId: string;
    bodyColor: string;
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
      fontId: input.fontId,
      bodyColor: input.bodyColor,
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
