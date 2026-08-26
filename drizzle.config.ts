import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// override: true garante que o .env local vence variáveis já exportadas no shell.
dotenv.config({ path: '.env', override: true });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required (set it in .env)');
}

export default defineConfig({
  strict: true,
  verbose: true,
  dialect: 'postgresql',
  out: './src/lib/db/migrations',
  schema: './src/lib/db/schemas',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
