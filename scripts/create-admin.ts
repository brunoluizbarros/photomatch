// Cria um usuário do painel admin. Signup público está desabilitado na app
// principal (better-auth.emailAndPassword.disableSignUp) — esse flag bloqueia
// o handler inteiro, inclusive chamado via auth.api, então este script monta
// sua própria instância do better-auth (mesmo banco, sem o flag) só para criar
// a conta. É o único caminho para existir um usuário.
//
// Uso: pnpm create-admin email@exemplo.com senha123 "Nome"
//      pnpm create-user  email@exemplo.com senha123 "Nome" photographer
//
// role omitido = 'admin' (default da coluna). O signup do better-auth ignora
// role no body (input:false em src/lib/auth/server.ts, pra ninguém se
// auto-promover via updateUser), então quem cria com outro papel precisa de
// um UPDATE explícito depois.
import 'dotenv/config';

const VALID_ROLES = ['admin', 'photographer', 'support'] as const;

async function main() {
  const [email, password, name, role] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Uso: pnpm create-admin <email> <senha> [nome] [admin|photographer|support]');
    process.exit(1);
  }
  if (role && !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    console.error(`Papel inválido: ${role}. Use um de: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  const { betterAuth } = await import('better-auth');
  const { drizzleAdapter } = await import('better-auth/adapters/drizzle');
  const { db } = await import('../src/lib/db/client');
  const { user } = await import('../src/lib/db/schemas');
  const { env } = await import('../src/config/env');
  const { eq } = await import('drizzle-orm');

  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.NEXT_PUBLIC_APP_URL,
    emailAndPassword: { enabled: true },
  });

  await auth.api.signUpEmail({
    body: { email, password, name: name ?? email.split('@')[0] },
  });

  if (role && role !== 'admin') {
    await db.update(user).set({ role }).where(eq(user.email, email));
  }

  console.info(`Usuário criado: ${email} (${role ?? 'admin'})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Falha ao criar usuário', err);
  process.exit(1);
});
