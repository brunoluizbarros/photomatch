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
  const role = (session.user.role as Role | undefined) ?? 'admin';
  if (roles.length > 0 && !roles.includes(role)) throw new Error('Forbidden');
  return { userId: session.user.id, role };
}

export const requireAdmin = () => requireUser('admin');

// Filtro de posse para a galeria de fotos: fotógrafo só vê o que ele mesmo
// subiu; admin e atendimento veem tudo. `and()` do drizzle ignora
// `undefined`, então o mesmo where serve os três papéis.
export function ownedBy(role: Role, userId: string, uploadedByColumn: Column) {
  return role === 'photographer' ? eq(uploadedByColumn, userId) : undefined;
}
