// Cria um usuário do painel admin. Signup público está desabilitado na app
// principal (better-auth.emailAndPassword.disableSignUp) — esse flag bloqueia
// o handler inteiro, inclusive chamado via auth.api, então este script monta
// sua própria instância do better-auth (mesmo banco, sem o flag) só para criar
// a conta. É o único caminho para existir um admin.
//
// Uso: pnpm create-admin email@exemplo.com senha123 "Nome"
import 'dotenv/config';

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Uso: pnpm create-admin <email> <senha> [nome]');
    process.exit(1);
  }

  const { betterAuth } = await import('better-auth');
  const { drizzleAdapter } = await import('better-auth/adapters/drizzle');
  const { db } = await import('../src/lib/db/client');
  const { env } = await import('../src/config/env');

  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.NEXT_PUBLIC_APP_URL,
    emailAndPassword: { enabled: true },
  });

  await auth.api.signUpEmail({
    body: { email, password, name: name ?? email.split('@')[0] },
  });

  console.info(`Admin criado: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Falha ao criar admin', err);
  process.exit(1);
});
