'use server';

import { ownedBy, requireAdmin, requireUser } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { events, photos } from '@/lib/db/schemas';
import {
  collectionIdForEvent,
  createEventCollection,
  deleteEventCollection,
} from '@/lib/rekognition/faces';
import { createId } from '@paralleldrive/cuid2';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Lista de eventos pro /admin — fotógrafo e atendimento veem todos os
// eventos (só a galeria de fotos é escopada por dono).
export async function listEvents() {
  await requireUser();
  return db.select().from(events).orderBy(events.createdAt);
}

// Cards de estatística do painel principal — porta o padrão de dashboard do
// ticketeria-techstage (contagens agregadas + destaque em número grande).
export async function getDashboardStats() {
  await requireAdmin();
  const [eventStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where ${events.isPublished})::int`,
    })
    .from(events);
  const [photoStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      indexed: sql<number>`count(*) filter (where ${photos.status} = 'indexed')::int`,
    })
    .from(photos);
  return { events: eventStats, photos: photoStats };
}

export async function getEvent(id: string) {
  await requireUser();
  const [event] = await db.select().from(events).where(eq(events.id, id));
  return event ?? null;
}

// Sem sessão de propósito: é o ponto de entrada da página pública /e/[slug].
export async function getPublishedEventBySlug(slug: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isPublished, true)));
  return event ?? null;
}

// Retorna {ok, error} em vez de lançar pro caso esperado (slug duplicado):
// o Next redige a mensagem de erros lançados em Server Actions no build de
// produção (substitui por um texto genérico + digest, de propósito, pra não
// vazar detalhe de servidor) — só falhas verdadeiramente inesperadas (AWS,
// banco) devem continuar lançando e caindo nesse comportamento redigido.
export async function createEvent(input: { name: string; slug: string; eventDate?: string }) {
  await requireAdmin();

  // Checa o slug ANTES de criar a Collection: o insert é a última coisa que
  // acontece, então um slug repetido deixaria uma Collection órfã na AWS.
  // Ainda racy sob submits concorrentes — quem garante de verdade é o índice
  // único do slug; isto só evita o caso comum (admin reenvia um nome já usado).
  const [taken] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.slug, input.slug));
  if (taken) return { ok: false as const, error: 'Já existe um evento com esse slug.' };

  // Cria a Collection na AWS antes do INSERT: se a AWS falhar, não sobra
  // linha órfã no Postgres.
  const id = createId();
  const collectionId = collectionIdForEvent(id);
  await createEventCollection(collectionId);

  const [event] = await db
    .insert(events)
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
  return { ok: true as const, event };
}

export async function setPublished(eventId: string, isPublished: boolean) {
  await requireAdmin();
  await db.update(events).set({ isPublished }).where(eq(events.id, eventId));
  revalidatePath(`/admin/events/${eventId}`);
}

// Customização da página pública /e/[slug] — template editorial portado do
// Réveillon Carneiros. Todos os campos são opcionais: sem eles, a página cai
// nos defaults do template (gradiente com a cor primária no lugar da foto de
// capa, sem logo, texto de boas-vindas genérico).
export async function updateEventBranding(
  eventId: string,
  input: {
    heroImageKey: string | null;
    logoImageKey: string | null;
    primaryColor: string;
    fontId: string;
    bodyColor: string;
    welcomeMessage: string | null;
  },
) {
  await requireAdmin();
  await db
    .update(events)
    .set({
      heroImageKey: input.heroImageKey,
      logoImageKey: input.logoImageKey,
      primaryColor: input.primaryColor,
      fontId: input.fontId,
      bodyColor: input.bodyColor,
      welcomeMessage: input.welcomeMessage || null,
    })
    .where(eq(events.id, eventId));
  revalidatePath(`/admin/events/${eventId}`);
}

// Descarte de biometria (LGPD): apaga a Collection inteira na AWS numa única
// chamada, depois o DELETE com cascade limpa photos e photo_faces.
export async function deleteEvent(eventId: string) {
  await requireAdmin();
  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event) throw new Error('Event not found');

  await deleteEventCollection(event.rekognitionCollectionId);
  await db.delete(events).where(eq(events.id, eventId));
  revalidatePath('/admin');
}

export async function getEventProgress(eventId: string) {
  const { role, userId } = await requireUser();
  const rows = await db
    .select({
      status: photos.status,
      count: sql<number>`count(*)::int`,
      unindexed: sql<number>`coalesce(sum(${photos.unindexedFaceCount}), 0)::int`,
    })
    .from(photos)
    .where(and(eq(photos.eventId, eventId), ownedBy(role, userId, photos.uploadedBy)))
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
