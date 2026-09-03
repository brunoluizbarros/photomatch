// Teste de integração: precisa de um Postgres real (mesma convenção de
// tests/queue.test.ts — pulado automaticamente sem DATABASE_URL real).
//
// Cobre o escopo por dono da galeria de fotos (src/actions/photos.ts,
// src/lib/auth/require-admin.ts:ownedBy): duas fotos do mesmo evento,
// uploadedBy diferente, e afirma que o fotógrafo só vê a dele — tanto na
// lista quanto no count (os dois têm que usar o mesmo `where`, senão a
// paginação mostra um total que não bate com as linhas retornadas).
import { describe, expect, it } from 'vitest';

const FAKE_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
const hasDb = !!process.env.DATABASE_URL && process.env.DATABASE_URL !== FAKE_DATABASE_URL;

describe.skipIf(!hasDb)('ownedBy scoping', () => {
  it('photographer sees only their own photos, admin/support see all', async () => {
    const { db } = await import('@/lib/db/client');
    const { events, photos, user } = await import('@/lib/db/schemas');
    const { ownedBy } = await import('@/lib/auth/require-admin');
    const { createId } = await import('@paralleldrive/cuid2');
    const { and, eq, sql } = await import('drizzle-orm');

    const eventId = createId();
    const userAId = createId();
    const userBId = createId();
    const now = new Date();

    await db.insert(events).values({
      id: eventId,
      name: 'test',
      slug: `test-${eventId}`,
      rekognitionCollectionId: `test-${eventId}`,
    });
    await db.insert(user).values([
      {
        id: userAId,
        name: 'A',
        email: `${userAId}@test.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: userBId,
        name: 'B',
        email: `${userBId}@test.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const photoAId = createId();
    const photoBId = createId();
    await db.insert(photos).values([
      {
        id: photoAId,
        eventId,
        storageKey: `k/${photoAId}`,
        status: 'pending',
        uploadedBy: userAId,
      },
      {
        id: photoBId,
        eventId,
        storageKey: `k/${photoBId}`,
        status: 'pending',
        uploadedBy: userBId,
      },
    ]);

    try {
      // getEventPhotosPage monta exatamente este where — as duas queries
      // (linhas e count) precisam do mesmo filtro.
      const whereFor = (role: 'admin' | 'photographer' | 'support', userId: string) =>
        and(eq(photos.eventId, eventId), ownedBy(role, userId, photos.uploadedBy));

      const photographerWhere = whereFor('photographer', userAId);
      const [rows, [{ count }]] = await Promise.all([
        db.select().from(photos).where(photographerWhere),
        db.select({ count: sql<number>`count(*)::int` }).from(photos).where(photographerWhere),
      ]);
      expect(rows.map((r) => r.id)).toEqual([photoAId]);
      expect(count).toBe(1);

      for (const role of ['admin', 'support'] as const) {
        const allRows = await db.select().from(photos).where(whereFor(role, userAId));
        expect(allRows).toHaveLength(2);
      }
    } finally {
      await db.delete(events).where(eq(events.id, eventId));
      await db.delete(user).where(eq(user.id, userAId));
      await db.delete(user).where(eq(user.id, userBId));
    }
  });
});
