import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { photos } from './photos';

export const events = pgTable('events', {
  id: text('id')
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  eventDate: timestamp('event_date', { withTimezone: true }),
  isPublished: boolean('is_published').notNull().default(false),
  // ID da Rekognition Collection dedicada a este evento (uma coleção por evento).
  rekognitionCollectionId: text('rekognition_collection_id').notNull().unique(),

  // Customização visual da página pública /e/[slug] — template "editorial"
  // portado do design do Réveillon Carneiros (hero full-bleed + tipografia
  // serifada + superfícies dia/noite), com estes campos por evento.
  //
  // heroImageUrl/logoUrl são o formato legado (URL externa colada à mão —
  // ex. um arquivo em public/images/, ou um CDN de terceiro). heroImageKey/
  // logoImageKey são a chave no bucket privado (upload feito pelo admin);
  // quando setadas, têm prioridade — resolvidas por presigned URL fresca a
  // cada request, nunca guardadas prontas (URL assinada expira em 1h).
  heroImageUrl: text('hero_image_url'),
  logoUrl: text('logo_url'),
  heroImageKey: text('hero_image_key'),
  logoImageKey: text('logo_image_key'),
  primaryColor: text('primary_color').notNull().default('#c0714a'),
  // Preset de fonte de exibição (título/eyebrow) — ver src/lib/theme/font-presets.ts.
  fontId: text('font_id').notNull().default('fraunces'),
  // Preset de fundo do corpo (tudo abaixo do hero) — ver src/lib/theme/body-presets.ts.
  // 'auto' preserva o dia/noite por horário; os demais fixam um fundo.
  bodyColor: text('body_color').notNull().default('auto'),
  welcomeMessage: text('welcome_message'),

  // Permissões de fotógrafo, por evento — default restritivo (false): cada
  // fotógrafo só vê/mexe no que é dele (ver ownedBy em
  // src/lib/auth/require-admin.ts). Admin liga por evento quando quiser.
  photographersSeeAllPhotos: boolean('photographers_see_all_photos').notNull().default(false),
  photographersCanCreateAlbums: boolean('photographers_can_create_albums').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  photos: many(photos),
}));
