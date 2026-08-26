import { env } from '@/config/env';
import { db } from '@/lib/db/client';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
    // Painel fechado: sem autocadastro. Admins são criados via
    // `pnpm create-admin` (scripts/create-admin.ts).
    disableSignUp: true,
  },
});
