import { createId } from '@paralleldrive/cuid2';

// Prefixa com um cuid2 para nunca colidir, mantém o nome original pra debug.
export function randomFilename(originalName: string) {
  const ext = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : '';
  const base = originalName.slice(0, originalName.length - ext.length);
  const safeBase = base.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 60);
  return `${createId()}-${safeBase}${ext}`;
}
