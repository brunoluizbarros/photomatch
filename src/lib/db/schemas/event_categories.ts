import { createId } from '@paralleldrive/cuid2';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Cadastro do sistema (não por evento) — o mesmo conjunto de categorias vale
// pra todos os eventos, seedado uma vez em 0015_*.sql. Sem admin CRUD por
// enquanto (YAGNI); dá pra adicionar uma tela depois se pedirem.
export const event_categories = pgTable('event_categories', {
  id: text('id')
    .notNull()
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
