import { env } from '@/config/env';
import { db } from '@/lib/db/client';
import { photos } from '@/lib/db/schemas';
import { InvalidParameterException } from '@aws-sdk/client-rekognition';
import { inArray } from 'drizzle-orm';
import { searchFacesBySelfie } from './rekognition/faces';
import { getPresignedDownloadUrl } from './storage/presign';

export class NoFaceDetectedError extends Error {}

export type PhotoSearchResult = {
  id: string;
  url: string;
};

// Dedup por foto mantendo a maior similaridade, depois ordena desc. Extraída
// como função pura para ser testável sem depender de AWS/DB.
export function dedupeAndOrderMatches(
  matches: { photoId: string; similarity: number }[],
): string[] {
  const bestByPhoto = new Map<string, number>();
  for (const match of matches) {
    const current = bestByPhoto.get(match.photoId);
    if (current === undefined || match.similarity > current) {
      bestByPhoto.set(match.photoId, match.similarity);
    }
  }
  return [...bestByPhoto.entries()].sort((a, b) => b[1] - a[1]).map(([photoId]) => photoId);
}

// Core compartilhado da busca por selfie (painel de teste e busca pública).
// SearchFacesByImage -> dedup por foto mantendo a maior similaridade -> ordena
// desc -> hidrata via IN(...) -> reordena as rows na ordem de similaridade.
export async function searchPhotosByFace(params: {
  collectionId: string;
  selfieBase64: string;
  limit?: number;
}): Promise<PhotoSearchResult[]> {
  const selfieBytes = Buffer.from(params.selfieBase64, 'base64');

  let matches: Awaited<ReturnType<typeof searchFacesBySelfie>>;
  try {
    matches = await searchFacesBySelfie({
      collectionId: params.collectionId,
      selfieBytes,
      faceMatchThreshold: env.REKOGNITION_FACE_MATCH_THRESHOLD,
      maxFaces: params.limit,
    });
  } catch (err) {
    if (err instanceof InvalidParameterException) {
      throw new NoFaceDetectedError(
        'Não encontramos um rosto nessa foto. Tire outra selfie e tente de novo.',
      );
    }
    throw err;
  }

  const orderedIds = dedupeAndOrderMatches(matches);
  if (orderedIds.length === 0) return [];

  const rows = await db.select().from(photos).where(inArray(photos.id, orderedIds));
  const rowsById = new Map(rows.map((row) => [row.id, row]));

  const results: PhotoSearchResult[] = [];
  for (const id of orderedIds) {
    const row = rowsById.get(id);
    if (!row) continue;
    results.push({ id: row.id, url: await getPresignedDownloadUrl(row.storageKey) });
  }
  return results;
}
