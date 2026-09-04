import type { Column } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from './server';

export type Role = 'admin' | 'photographer' | 'support';

// Server Actions são endpoints POST com ID próprio — não basta confiar no
// middleware (que protege a página). Cada action de admin chama isto primeiro.
//
// Sem argumentos, aceita qualquer papel logado (só checa sessão). Com papéis,
// rejeita quem não estiver na lista — ex: requireUser('admin', 'photographer').
export async function requireUser(...roles: Role[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');
  // Falha fechado: um role ausente nunca deve virar o papel mais
  // privilegiado por omissão. Na prática `role` é NOT NULL DEFAULT 'admin'
  // no banco, então toda sessão real já vem com o campo preenchido — isto
  // é a rede de segurança para o caso em que não vier.
  const role = session.user.role as Role | undefined;
  if (!role) throw new Error('Unauthorized');
  if (roles.length > 0 && !roles.includes(role)) throw new Error('Forbidden');
  return { userId: session.user.id, role };
}

export const requireAdmin = () => requireUser('admin');

// Filtro de posse para a galeria de fotos: fotógrafo só vê o que ele mesmo
// subiu; admin e atendimento veem tudo. `and()` do drizzle ignora
// `undefined`, então o mesmo where serve os três papéis.
//
// allowAll vem de events.photographersSeeAllPhotos (ver src/lib/db/event-
// scope.ts) — quando o evento libera, o fotógrafo também vê tudo. Default
// false: sem passar nada, o comportamento continua o mesmo de sempre (só
// escopo por dono), o que importa pras ações que não são sobre visibilidade
// (ex: confirmPhotoUploaded só pode confirmar o que o próprio fotógrafo
// subiu, não depende dessa configuração do evento).
export function ownedBy(role: Role, userId: string, uploadedByColumn: Column, allowAll = false) {
  if (allowAll) return undefined;
  return role === 'photographer' ? eq(uploadedByColumn, userId) : undefined;
}
