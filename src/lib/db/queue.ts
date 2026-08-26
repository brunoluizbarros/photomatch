import { and, eq, sql } from 'drizzle-orm';
import { db } from './client';
import { photos } from './schemas';

const LEASE_TIMEOUT = sql`interval '10 minutes'`;
export const MAX_ATTEMPTS = 3;

export type ClaimedPhoto = typeof photos.$inferSelect;

// Reivindica um lote de fotos para indexar numa única transação.
// FOR UPDATE SKIP LOCKED garante que duas réplicas do worker nunca pegam a
// mesma foto; o OR com "processing" + lease vencida é o reaper — resolve o
// caso de um worker morto no meio, que sem isso deixaria a foto travada para
// sempre em "processing" (invisível ao botão "Reprocessar falhas", que só
// olha "failed").
export async function claimPhotoBatch(limit = 5): Promise<ClaimedPhoto[]> {
  return db.transaction(async (tx) => {
    const candidates = await tx.execute<{ id: string }>(sql`
      SELECT id FROM photos
       WHERE status = 'pending'
          OR (status = 'processing' AND leased_at < now() - ${LEASE_TIMEOUT})
       ORDER BY created_at
       LIMIT ${limit}
       FOR UPDATE SKIP LOCKED
    `);

    const ids = candidates.rows.map((row) => row.id);
    if (ids.length === 0) return [];

    const claimed: ClaimedPhoto[] = [];
    for (const id of ids) {
      const [row] = await tx
        .update(photos)
        .set({ status: 'processing', leasedAt: new Date(), attempts: sql`${photos.attempts} + 1` })
        .where(eq(photos.id, id))
        .returning();
      if (row) claimed.push(row);
    }
    return claimed;
  });
}

export async function releaseSuccess(
  photoId: string,
  data: {
    faceCount: number;
    unindexedFaceCount: number;
    width?: number;
    height?: number;
    bytes: number;
  },
) {
  await db
    .update(photos)
    .set({
      status: 'indexed',
      leasedAt: null,
      lastError: null,
      indexedAt: new Date(),
      faceCount: data.faceCount,
      unindexedFaceCount: data.unindexedFaceCount,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    })
    .where(eq(photos.id, photoId));
}

// attempts >= MAX_ATTEMPTS => 'failed', que funciona como a DLQ: o painel de
// progresso já lista essas fotos e oferece "Reprocessar falhas".
export async function releaseFailure(photoId: string, attempts: number, errorMessage: string) {
  await db
    .update(photos)
    .set({
      status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
      leasedAt: null,
      lastError: errorMessage,
    })
    .where(eq(photos.id, photoId));
}

export async function reindexFailedPhotos(albumId: string) {
  await db
    .update(photos)
    .set({ status: 'pending', attempts: 0, lastError: null })
    .where(and(eq(photos.albumId, albumId), eq(photos.status, 'failed')));
}
