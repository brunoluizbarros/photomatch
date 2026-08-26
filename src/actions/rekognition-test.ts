'use server';

import { env } from '@/config/env';
import { requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { albums } from '@/lib/db/schemas';
import { searchFacesBySelfie } from '@/lib/rekognition/faces';
import { eq } from 'drizzle-orm';

// Painel de calibração: busca com threshold 0 e devolve TODOS os scores, para
// achar o REKOGNITION_FACE_MATCH_THRESHOLD ideal sem mexer no .env às cegas.
export async function testRekognitionSearch(albumId: string, selfieBase64: string) {
  await requireAdmin();

  const [album] = await db.select().from(albums).where(eq(albums.id, albumId));
  if (!album) throw new Error('Album not found');

  const matches = await searchFacesBySelfie({
    collectionId: album.rekognitionCollectionId,
    selfieBytes: Buffer.from(selfieBase64, 'base64'),
    faceMatchThreshold: 0,
    maxFaces: 100,
  });

  return matches
    .sort((a, b) => b.similarity - a.similarity)
    .map((match) => ({
      ...match,
      passesThreshold: match.similarity >= env.REKOGNITION_FACE_MATCH_THRESHOLD,
    }));
}
