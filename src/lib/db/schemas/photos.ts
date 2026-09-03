import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { albums } from './albums';
import { user } from './auth';
import { events } from './events';
import { photo_faces } from './photo_faces';

// awaiting_upload -> pending -> processing -> indexed | failed
// awaiting_upload existe para que uma aba fechada entre o presign e o PUT
// não deixe uma foto "pending" fantasma na fila (o worker só pega "pending").
export const photoIndexStatusEnum = pgEnum('photo_index_status', [
  'awaiting_upload',
  'pending',
  'processing',
  'indexed',
  'failed',
]);

// Esta tabela É a fila: o worker reivindica linhas por status via
// FOR UPDATE SKIP LOCKED (src/lib/db/queue.ts), sem broker externo.
export const photos = pgTable(
  'photos',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    // Pasta dentro do evento — opcional. Apagar o álbum não pode apagar a
    // foto (onDelete: 'set null'); a foto cai em "Sem álbum".
    albumId: text('album_id').references(() => albums.id, { onDelete: 'set null' }),
    // Quem subiu a foto (fotógrafo ou admin) — usado para escopar a galeria
    // do fotógrafo às fotos dele. Nulo para fotos antigas (pré-existentes ao
    // conceito de fotógrafo) e para import por link/CLI.
    uploadedBy: text('uploaded_by').references(() => user.id, { onDelete: 'set null' }),
    storageKey: text('storage_key').notNull().unique(),
    // Origem quando a foto veio de um link público (Drive/Dropbox) em vez do
    // upload pelo navegador: o worker baixa daqui, grava no bucket e zera o
    // campo. Sem status novo — a linha já nasce 'pending' e a fila existente
    // (claimPhotoBatch) pega do mesmo jeito.
    sourceUrl: text('source_url'),
    width: integer('width'),
    height: integer('height'),
    bytes: integer('bytes'),
    status: photoIndexStatusEnum('status').notNull().default('awaiting_upload'),
    faceCount: integer('face_count').notNull().default(0),
    unindexedFaceCount: integer('unindexed_face_count').notNull().default(0),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    // Lease do worker que reivindicou a linha. Usado pelo reaper: uma foto
    // "processing" com lease velha (worker morto no meio) volta a ser elegível.
    leasedAt: timestamp('leased_at', { withTimezone: true }),
    indexedAt: timestamp('indexed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('photos_event_id_status_idx').on(table.eventId, table.status)],
);

export const photosRelations = relations(photos, ({ one, many }) => ({
  event: one(events, {
    fields: [photos.eventId],
    references: [events.id],
  }),
  album: one(albums, {
    fields: [photos.albumId],
    references: [albums.id],
  }),
  faces: many(photo_faces),
}));
