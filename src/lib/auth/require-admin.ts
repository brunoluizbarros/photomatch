import { headers } from 'next/headers';
import { auth } from './server';

// Server Actions são endpoints POST com ID próprio — não basta confiar no
// middleware (que protege a página). Cada action de admin chama isto primeiro.
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Unauthorized');
  return session;
}
