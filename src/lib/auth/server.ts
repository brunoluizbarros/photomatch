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
    // Painel fechado: sem autocadastro. Usuários são criados via
    // `pnpm create-admin` (scripts/create-admin.ts).
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      // 'admin' | 'photographer' | 'support' — ver src/lib/auth/require-admin.ts.
      // input:false: ninguém envia role no body de signup/updateUser, senão um
      // usuário logado poderia se auto-promover via authClient.updateUser().
      role: {
        type: ['admin', 'photographer', 'support'],
        defaultValue: 'admin',
        input: false,
        required: false,
      },
    },
  },
});
