import { createId } from '@paralleldrive/cuid2';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { events } from './events';

// Pacote de fotos vendido num evento (ex: "5 digitais + 2 impressas por
// R$90"). Cadastrado pelo admin em src/actions/sales.ts. Apagar um plano é
// seguro mesmo com pedidos antigos: orders.planName/planPriceCents são
// snapshot, nunca um join com esta tabela.
export const event_plans = pgTable(
  'event_plans',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    digitalQuota: integer('digital_quota').notNull().default(0),
    printQuota: integer('print_quota').notNull().default(0),
    priceCents: integer('price_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('event_plans_event_id_idx').on(table.eventId)],
);
