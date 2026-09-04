'use server';

import { env } from '@/config/env';
import { type Role, requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { account, user } from '@/lib/db/schemas';
import { and, eq, ne, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const VALID_ROLES: Role[] = ['admin', 'photographer', 'support'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listUsers() {
  await requireAdmin();
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(user.createdAt);
}

// Signup público está desabilitado (better-auth.emailAndPassword.disableSignUp)
// — esse flag bloqueia o handler inteiro, inclusive chamado via auth.api, então
// esta action monta sua própria instância do better-auth (mesmo banco, sem o
// flag) só pra criar a conta. Mesmo truque do scripts/create-admin.ts.
//
// role nunca vai no body do signup: additionalFields.role tem input:false
// (src/lib/auth/server.ts) — o campo nasce 'admin' (default da coluna) e só
// depois é ajustado com um UPDATE, exatamente como o script faz.
export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: Role;
}) {
  await requireAdmin();

  const email = input.email.trim();
  const name = input.name.trim();
  if (!EMAIL_RE.test(email)) return { ok: false as const, error: 'E-mail inválido.' };
  if (!name) return { ok: false as const, error: 'Nome é obrigatório.' };
  if (!VALID_ROLES.includes(input.role)) return { ok: false as const, error: 'Papel inválido.' };

  const [taken] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (taken) return { ok: false as const, error: 'Já existe um usuário com esse e-mail.' };

  const { betterAuth } = await import('better-auth');
  const { drizzleAdapter } = await import('better-auth/adapters/drizzle');
  const signupAuth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.NEXT_PUBLIC_APP_URL,
    emailAndPassword: { enabled: true },
  });

  try {
    await signupAuth.api.signUpEmail({ body: { email, password: input.password, name } });
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Não foi possível criar o usuário.',
    };
  }

  if (input.role !== 'admin') {
    await db.update(user).set({ role: input.role }).where(eq(user.email, email));
  }

  revalidatePath('/admin/users');
  return { ok: true as const };
}

// Nome/e-mail vivem em `user`; senha vive em `account` (provider "credential"),
// hasheada pelo próprio better-auth — hashPassword é a mesma função que o
// login usa pra conferir (better-auth/crypto), então o resultado abre sessão
// normalmente. password vazio/omitido = mantém a senha atual (não existe
// fluxo de "esqueci minha senha" no app; isto é a única forma de recuperar
// acesso de alguém que perdeu a senha).
export async function updateUser(
  targetUserId: string,
  input: { name: string; email: string; password?: string },
) {
  await requireAdmin();

  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { ok: false as const, error: 'Nome é obrigatório.' };
  if (!EMAIL_RE.test(email)) return { ok: false as const, error: 'E-mail inválido.' };
  if (input.password && input.password.length < 8) {
    return { ok: false as const, error: 'Senha precisa de pelo menos 8 caracteres.' };
  }

  const [taken] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.email, email), ne(user.id, targetUserId)));
  if (taken) return { ok: false as const, error: 'Já existe um usuário com esse e-mail.' };

  await db.update(user).set({ name, email }).where(eq(user.id, targetUserId));

  if (input.password) {
    const { hashPassword } = await import('better-auth/crypto');
    const hashed = await hashPassword(input.password);
    await db
      .update(account)
      .set({ password: hashed })
      .where(and(eq(account.userId, targetUserId), eq(account.providerId, 'credential')));
  }

  revalidatePath('/admin/users');
  return { ok: true as const };
}

// Impede remover o último admin — travaria o sistema sem ninguém pra
// administrar eventos, e recuperar exigiria mexer direto no banco.
async function isLastAdmin(targetUserId: string): Promise<boolean> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(and(eq(user.role, 'admin'), ne(user.id, targetUserId)));
  return (row?.count ?? 0) === 0;
}

export async function updateUserRole(targetUserId: string, role: Role) {
  const { userId: currentUserId } = await requireAdmin();
  if (!VALID_ROLES.includes(role)) return { ok: false as const, error: 'Papel inválido.' };
  if (targetUserId === currentUserId) {
    return { ok: false as const, error: 'Você não pode alterar o próprio papel.' };
  }

  const [target] = await db.select({ role: user.role }).from(user).where(eq(user.id, targetUserId));
  if (!target) return { ok: false as const, error: 'Usuário não encontrado.' };
  if (target.role === 'admin' && role !== 'admin' && (await isLastAdmin(targetUserId))) {
    return { ok: false as const, error: 'Precisa existir pelo menos um admin.' };
  }

  await db.update(user).set({ role }).where(eq(user.id, targetUserId));
  revalidatePath('/admin/users');
  return { ok: true as const };
}

export async function deleteUser(targetUserId: string) {
  const { userId: currentUserId } = await requireAdmin();
  if (targetUserId === currentUserId) {
    return { ok: false as const, error: 'Você não pode remover a própria conta.' };
  }
  if (await isLastAdmin(targetUserId)) {
    return { ok: false as const, error: 'Precisa existir pelo menos um admin.' };
  }

  // FKs com onDelete: session/account em cascade (limpa a sessão do usuário
  // removido), photos.uploadedBy em set null (fotos já enviadas continuam
  // existindo, só perdem o autor).
  await db.delete(user).where(eq(user.id, targetUserId));
  revalidatePath('/admin/users');
  return { ok: true as const };
}
