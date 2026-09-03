import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { events } from './events';
import { photos } from './photos';

// Álbum = pasta de fotos dentro de um evento (agrupamento visual, criado pelo
// organizador). Não tem Rekognition Collection própria — a busca por selfie
// continua escopada ao evento inteiro, álbum é só organização para humanos.
export const albums = pgTable(
  'albums',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('albums_event_id_idx').on(table.eventId)],
);

export const albumsRelations = relations(albums, ({ one, many }) => ({
  event: one(events, {
    fields: [albums.eventId],
    references: [events.id],
  }),
  photos: many(photos),
}));
