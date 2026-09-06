import { env } from '@/config/env';
import { db } from '@/lib/db/client';
import { photos } from '@/lib/db/schemas';
import { InvalidParameterException } from '@aws-sdk/client-rekognition';
import { and, inArray, isNotNull } from 'drizzle-orm';
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

// Core compartilhado da busca por selfie (busca pública, 1+ selfies). Para
// cada selfie: SearchFacesByImage -> acumula matches. No fim: dedup por foto
// mantendo a maior similaridade entre TODAS as selfies -> ordena desc ->
// hidrata via IN(...) -> reordena as rows na ordem de similaridade.
//
// Sequencial, não Promise.all: o Rekognition tem teto de TPS por conta/região
// (ver REKOGNITION_MAX_TPS) e esta rota não tem o Bottleneck que o worker tem.
//
// Uma selfie sem rosto não derruba a busca das outras — só lança
// NoFaceDetectedError se NENHUMA selfie detectou rosto.
export async function searchPhotosByFace(params: {
  collectionId: string;
  selfiesBase64: string[];
  limit?: number;
}): Promise<PhotoSearchResult[]> {
  const matches: { photoId: string; similarity: number }[] = [];
  let detectedCount = 0;

  for (const selfieBase64 of params.selfiesBase64) {
    try {
      const found = await searchFacesBySelfie({
        collectionId: params.collectionId,
        selfieBytes: Buffer.from(selfieBase64, 'base64'),
        faceMatchThreshold: env.REKOGNITION_FACE_MATCH_THRESHOLD,
        maxFaces: params.limit,
      });
      detectedCount++;
      matches.push(...found);
    } catch (err) {
      if (!(err instanceof InvalidParameterException)) throw err;
      // rosto não detectado nesta selfie — segue para as próximas
    }
  }

  if (detectedCount === 0) {
    throw new NoFaceDetectedError(
      'Não encontramos um rosto nessa foto. Tire outra selfie e tente de novo.',
    );
  }

  const orderedIds = dedupeAndOrderMatches(matches);
  if (orderedIds.length === 0) return [];

  // previewKey nulo = foto ainda sem o derivado com marca d'água (worker não
  // processou ainda, ou falhou) — nunca vaza o original pro público.
  const rows = await db
    .select()
    .from(photos)
    .where(and(inArray(photos.id, orderedIds), isNotNull(photos.previewKey)));
  const rowsById = new Map(rows.map((row) => [row.id, row]));

  const ordered = orderedIds.flatMap((id) => {
    const row = rowsById.get(id);
    return row ? [row] : [];
  });

  const urls = await Promise.all(
    ordered.map((row) => getPresignedDownloadUrl(row.previewKey as string)),
  );
  return ordered.map((row, i) => ({ id: row.id, url: urls[i] }));
}
