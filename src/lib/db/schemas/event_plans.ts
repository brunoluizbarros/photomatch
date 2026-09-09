import { createId } from '@paralleldrive/cuid2';
import { boolean, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
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
    // Modalidade existe ou não neste plano — default true preserva o
    // comportamento de todo plano já cadastrado (sempre ofereciam as duas).
    // Diferente de quota=0: quota zerada ainda vende avulso (se configurado);
    // aqui false bloqueia a modalidade de vez, em qualquer preço (ver
    // src/lib/pricing.ts:quoteFor) — é assim que um pacote "só impressa" ou
    // "só digital" existe.
    includesDigital: boolean('includes_digital').notNull().default(true),
    includesPrint: boolean('includes_print').notNull().default(true),
    priceCents: integer('price_cents').notNull(),
    // Preço avulso — cobrado por unidade quando o carrinho passa da quota
    // DESTE plano. Por plano, não por evento: planos mais caros costumam ter
    // avulso mais barato (ver src/lib/pricing.ts:quoteCart).
    extraDigitalPriceCents: integer('extra_digital_price_cents').notNull().default(0),
    extraPrintPriceCents: integer('extra_print_price_cents').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('event_plans_event_id_idx').on(table.eventId)],
);
