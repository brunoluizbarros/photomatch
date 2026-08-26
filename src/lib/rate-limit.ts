// ponytail: rate limit em memória do processo — não sobrevive a restart nem
// funciona com múltiplas réplicas web. Suficiente para 1 réplica; se escalar
// horizontalmente, trocar por uma tabela no Postgres ou Redis.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}
