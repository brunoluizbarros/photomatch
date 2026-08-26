import { env } from '@/config/env';
import { drizzle as createDrizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schemas';

// Guarda a conexão no escopo global para não abrir um pool novo a cada hot
// reload do Next em dev.
const global = globalThis as unknown as {
  pool: Pool;
  db: ReturnType<typeof createDrizzle<typeof schema>>;
  migrationsRun?: boolean;
};

if (!global.pool) {
  global.pool = new Pool({
    connectionString: process.env.IS_BUILD
      ? (process.env.DATABASE_PUBLIC_URL ?? env.DATABASE_URL)
      : env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  global.pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  const migrationsPath = `${process.cwd()}/src/lib/db/migrations`;
  global.db = createDrizzle(global.pool, {
    schema,
    logger: process.env.DB_VERBOSE === 'true',
  });

  // O Postgres do Railway pode estar "dormindo" no primeiro request depois de
  // um período ocioso — retry com backoff evita falhar o boot por isso.
  async function runMigrationsWithRetry(retries = 5, delayMs = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await migrate(global.db, { migrationsFolder: migrationsPath });
        return;
      } catch (err) {
        const isLastAttempt = attempt === retries;
        console.error(`Migration attempt ${attempt}/${retries} failed`, err);
        if (isLastAttempt) return;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // Em testes, o Pool pode existir só para satisfazer a validação de env de
  // módulos importados — sem isto, migrar contra um DATABASE_URL fake gera
  // 5 tentativas de retry em segundo plano a cada run.
  if (!global.migrationsRun && process.env.NODE_ENV !== 'test') {
    runMigrationsWithRetry();
    global.migrationsRun = true;
  }
}

export const db = global.db;
export const pool = global.pool;
