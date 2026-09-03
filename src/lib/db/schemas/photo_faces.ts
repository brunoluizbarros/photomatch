import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { doublePrecision, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { events } from './events';
import { photos } from './photos';

// Mapeamento FaceId (Rekognition) -> foto. Não guarda o vetor facial: ele vive
// dentro da Rekognition Collection do evento. Esta tabela existe para
// (a) reconstituir a galeria a partir dos FaceIds que a busca devolve,
// (b) apagar os FaceIds antigos via DeleteFaces antes de reindexar uma foto
//     (sem isso, vetores órfãos acumulam na Collection a cada reprocessamento).
export const photo_faces = pgTable(
  'photo_faces',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    photoId: text('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    // Desnormalizado de propósito: permite filtrar por evento sem join.
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    rekognitionFaceId: text('rekognition_face_id').notNull().unique(),
    boundingBox: jsonb('bounding_box').notNull(),
    confidence: doublePrecision('confidence').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('photo_faces_photo_id_idx').on(table.photoId)],
);

export const photoFacesRelations = relations(photo_faces, ({ one }) => ({
  photo: one(photos, {
    fields: [photo_faces.photoId],
    references: [photos.id],
  }),
  event: one(events, {
    fields: [photo_faces.eventId],
    references: [events.id],
  }),
}));
