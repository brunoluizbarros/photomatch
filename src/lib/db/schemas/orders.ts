import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { event_plans } from './event_plans';
import { events } from './events';
import { photos } from './photos';

export const orderStatusEnum = pgEnum('order_status', ['awaiting_payment', 'paid', 'canceled']);

export const orderItemKindEnum = pgEnum('order_item_kind', ['digital', 'print']);

// Tamanhos físicos oferecidos no totem/fila de impressão (ver print-queue-
// panel.tsx) — fixos por enquanto, sem tela de cadastro (mesmo espírito de
// event_categories: cadastro do sistema, não por evento).
export const printSizeEnum = pgEnum('print_size', ['5x7', 'polaroid', '10x15', '15x20']);

// Pedido de compra de fotos. Nasce no checkout público (sem login — ver
// src/actions/orders.ts) e some para "paid" só quando um admin confirma o
// pagamento (placeholder de gateway; ver src/lib/orders/mark-paid.ts). Todo
// valor é snapshot do momento da compra: editar/apagar um plano depois não
// muda pedidos já feitos.
export const orders = pgTable(
  'orders',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    // Segredo de posse do link /pedido/[token] — 256 bits, gerado em
    // src/actions/orders.ts com randomBytes, nunca derivado do id.
    token: text('token').notNull().unique(),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    // Formato livre digitado pela pessoa — mesmo padrão de access_requests.phone.
    customerPhone: text('customer_phone').notNull(),
    marketingOptIn: boolean('marketing_opt_in').notNull().default(false),
    status: orderStatusEnum('status').notNull().default('awaiting_payment'),
    planId: text('plan_id').references(() => event_plans.id, { onDelete: 'set null' }),
    planName: text('plan_name'),
    planPriceCents: integer('plan_price_cents').notNull().default(0),
    extraDigitalCount: integer('extra_digital_count').notNull().default(0),
    extraPrintCount: integer('extra_print_count').notNull().default(0),
    extraDigitalPriceCents: integer('extra_digital_price_cents').notNull().default(0),
    extraPrintPriceCents: integer('extra_print_price_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    paidBy: text('paid_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('orders_event_id_status_idx').on(table.eventId, table.status)],
);

// Uma linha por (foto, modalidade) — permite a mesma foto ser digital E
// impressa no mesmo pedido, e é a query direta da fila de impressão
// (kind='print', printedAt IS NULL). onDelete 'restrict' na foto: impede
// apagar do bucket uma foto já vendida (hoje só reapAbandonedUploads apaga
// foto, e só 'awaiting_upload' — nunca comprável).
export const order_items = pgTable(
  'order_items',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    photoId: text('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'restrict' }),
    kind: orderItemKindEnum('kind').notNull(),
    printedAt: timestamp('printed_at', { withTimezone: true }),
    // Só preenchidos junto com printedAt, no mesmo markItemsPrinted (ver
    // src/actions/sales.ts) — rastreabilidade de quem mandou imprimir, em
    // qual tamanho. Nulos pra item ainda não impresso (ou impresso antes
    // dessas colunas existirem).
    printSize: printSizeEnum('print_size'),
    printedBy: text('printed_by').references(() => user.id, { onDelete: 'set null' }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    uniqueIndex('order_items_order_photo_kind_key').on(table.orderId, table.photoId, table.kind),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  event: one(events, { fields: [orders.eventId], references: [events.id] }),
  plan: one(event_plans, { fields: [orders.planId], references: [event_plans.id] }),
  items: many(order_items),
}));

export const orderItemsRelations = relations(order_items, ({ one }) => ({
  order: one(orders, { fields: [order_items.orderId], references: [orders.id] }),
  photo: one(photos, { fields: [order_items.photoId], references: [photos.id] }),
}));
