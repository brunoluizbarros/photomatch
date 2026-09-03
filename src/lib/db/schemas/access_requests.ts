import { createId } from '@paralleldrive/cuid2';
import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { albums } from './albums';

export const accessRequestStatusEnum = pgEnum('access_request_status', [
  'pending',
  'approved',
  'rejected',
]);

// Pedido de acesso de um convidado que achou o evento pela busca da home mas
// não tem o link/QR code — fica pendente até o organizador aprovar no admin.
// emailSentAt/whatsappSentAt guardam o resultado real do envio na aprovação
// (não só "aprovado", mas se a mensagem realmente saiu por cada canal).
export const access_requests = pgTable(
  'access_requests',
  {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => createId()),
    albumId: text('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    name: text('name'),
    email: text('email').notNull(),
    // Formato livre digitado pela pessoa — normalizado pra E.164 só na hora
    // de mandar WhatsApp (ver src/lib/utils/phone.ts).
    phone: text('phone').notNull(),
    status: accessRequestStatusEnum('status').notNull().default('pending'),
    emailSentAt: timestamp('email_sent_at', { withTimezone: true }),
    whatsappSentAt: timestamp('whatsapp_sent_at', { withTimezone: true }),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('access_requests_album_id_status_idx').on(table.albumId, table.status)],
);
