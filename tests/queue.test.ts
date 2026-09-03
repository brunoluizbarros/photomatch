// Teste de integração: precisa de um Postgres real (DATABASE_URL + demais env
// vars obrigatórias). Pulado automaticamente se o ambiente não estiver
// configurado — rode com `.env` preenchido para exercitá-lo de verdade.
import { describe, expect, it } from 'vitest';

// vitest.config.ts injeta um DATABASE_URL fake só para módulos que exigem a
// var de env sem realmente usar o banco (ex: photo-search.test.ts). Este
// teste precisa de um Postgres de verdade, então exige um valor diferente
// desse placeholder.
const FAKE_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
const hasDb = !!process.env.DATABASE_URL && process.env.DATABASE_URL !== FAKE_DATABASE_URL;

describe.skipIf(!hasDb)('claimPhotoBatch', () => {
  it('never lets two concurrent claims return the same photo', async () => {
    const { db } = await import('@/lib/db/client');
    const { events, photos } = await import('@/lib/db/schemas');
    const { claimPhotoBatch } = await import('@/lib/db/queue');
    const { createId } = await import('@paralleldrive/cuid2');
    const { eq } = await import('drizzle-orm');

    const eventId = createId();
    await db.insert(events).values({
      id: eventId,
      name: 'test',
      slug: `test-${eventId}`,
      rekognitionCollectionId: `test-${eventId}`,
    });

    const photoIds = Array.from({ length: 10 }, () => createId());
    await db
      .insert(photos)
      .values(
        photoIds.map((id) => ({ id, eventId, storageKey: `k/${id}`, status: 'pending' as const })),
      );

    try {
      const [batchA, batchB] = await Promise.all([claimPhotoBatch(5), claimPhotoBatch(5)]);
      const idsA = new Set(batchA.map((p) => p.id));
      const overlap = batchB.filter((p) => idsA.has(p.id));
      expect(overlap).toHaveLength(0);
    } finally {
      await db.delete(events).where(eq(events.id, eventId));
    }
  });
});
