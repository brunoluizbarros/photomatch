import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { photos } from './photos';

export const albums = pgTable('albums', {
  id: text('id')
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  eventDate: timestamp('event_date', { withTimezone: true }),
  isPublished: boolean('is_published').notNull().default(false),
  // ID da Rekognition Collection dedicada a este álbum (uma coleção por evento).
  rekognitionCollectionId: text('rekognition_collection_id').notNull().unique(),

  // Customização visual da página pública /e/[slug] — template "editorial"
  // portado do design do Réveillon Carneiros (hero full-bleed + tipografia
  // serifada + superfícies dia/noite), com estes 4 campos por evento.
  heroImageUrl: text('hero_image_url'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').notNull().default('#c0714a'),
  // Preset de fonte de exibição (título/eyebrow) — ver src/lib/theme/font-presets.ts.
  fontId: text('font_id').notNull().default('fraunces'),
  // Preset de fundo do corpo (tudo abaixo do hero) — ver src/lib/theme/body-presets.ts.
  // 'auto' preserva o dia/noite por horário; os demais fixam um fundo.
  bodyColor: text('body_color').notNull().default('auto'),
  welcomeMessage: text('welcome_message'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const albumsRelations = relations(albums, ({ many }) => ({
  photos: many(photos),
}));
