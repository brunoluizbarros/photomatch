import { createId } from '@paralleldrive/cuid2';
import { index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { events } from './events';

export const analyticsEventTypeEnum = pgEnum('analytics_event_type', ['visit', 'search']);

// Funil visita -> busca -> resultado. "Resultado" não é um tipo próprio: é o
// photoCount da própria busca (>0 = encontrou fotos) — evita uma segunda
// linha por busca. Nada aqui identifica pessoa: deviceId é um UUID aleatório
// gerado no navegador (localStorage), sem IP, sem user agent, sem selfie.
export const analytics_events = pgTable(
  'analytics_events',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    // Não é FK — "pessoa" não tem tabela e não vai ter.
    deviceId: text('device_id').notNull(),
    type: analyticsEventTypeEnum('type').notNull(),
    // Só para type='search': quantas fotos a busca devolveu (0 = não encontrou).
    photoCount: integer('photo_count'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('analytics_events_event_id_created_at_idx').on(table.eventId, table.createdAt),
    index('analytics_events_created_at_idx').on(table.createdAt),
  ],
);
