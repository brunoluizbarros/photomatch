import {
  CreateCollectionCommand,
  DeleteCollectionCommand,
  DeleteFacesCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
} from '@aws-sdk/client-rekognition';
import { rekognition } from './client';

export type IndexedFace = {
  faceId: string;
  boundingBox: Record<string, number>;
  confidence: number;
};

export type FaceMatch = {
  photoId: string;
  similarity: number;
};

// Uma Rekognition Collection por evento — a busca por selfie fica naturalmente
// escopada ao evento, sem precisar filtrar depois.
//
// ponytail: o prefixo "album-" é literal, não "event-" — é o nome real das
// Collections já criadas na AWS e persistido em events.rekognitionCollectionId
// (de quando "álbum" era o nome do evento no código). Trocar o prefixo
// quebraria todo evento existente; a função é que ganhou o nome novo.
export function collectionIdForEvent(eventId: string) {
  return `album-${eventId}`;
}

export async function createEventCollection(collectionId: string) {
  await rekognition.send(new CreateCollectionCommand({ CollectionId: collectionId }));
}

export async function deleteEventCollection(collectionId: string) {
  await rekognition.send(new DeleteCollectionCommand({ CollectionId: collectionId }));
}

// Indexa os rostos de uma foto na coleção do evento. ExternalImageId = photoId,
// o que permite reconstruir a foto a partir de um FaceMatch sem outra consulta.
export async function indexPhotoFaces(params: {
  collectionId: string;
  photoId: string;
  imageBytes: Uint8Array;
}): Promise<{ faces: IndexedFace[]; unindexedCount: number }> {
  const result = await rekognition.send(
    new IndexFacesCommand({
      CollectionId: params.collectionId,
      ExternalImageId: params.photoId,
      Image: { Bytes: params.imageBytes },
      MaxFaces: 20,
      QualityFilter: 'AUTO',
    }),
  );

  const faces: IndexedFace[] = [];
  for (const record of result.FaceRecords ?? []) {
    const faceId = record.Face?.FaceId;
    if (!faceId) continue;
    faces.push({
      faceId,
      boundingBox: (record.Face?.BoundingBox ?? {}) as Record<string, number>,
      confidence: record.Face?.Confidence ?? 0,
    });
  }

  return { faces, unindexedCount: result.UnindexedFaces?.length ?? 0 };
}

// Busca por selfie dentro da coleção do evento. Retorna os matches ordenados
// por similaridade (0-100); o corte pelo threshold acontece em quem chama.
export async function searchFacesBySelfie(params: {
  collectionId: string;
  selfieBytes: Uint8Array;
  faceMatchThreshold: number;
  maxFaces?: number;
}): Promise<FaceMatch[]> {
  const result = await rekognition.send(
    new SearchFacesByImageCommand({
      CollectionId: params.collectionId,
      Image: { Bytes: params.selfieBytes },
      MaxFaces: params.maxFaces ?? 500,
      FaceMatchThreshold: params.faceMatchThreshold,
    }),
  );

  const matches: FaceMatch[] = [];
  for (const m of result.FaceMatches ?? []) {
    const photoId = m.Face?.ExternalImageId;
    if (!photoId || typeof m.Similarity !== 'number') continue;
    matches.push({ photoId, similarity: m.Similarity });
  }
  return matches;
}

// Apaga os FaceIds antigos de uma foto antes de reindexar. Sem isso, cada
// reprocessamento deixaria vetores órfãos acumulando na Collection.
export async function deletePhotoFaces(collectionId: string, faceIds: string[]) {
  if (faceIds.length === 0) return;
  await rekognition.send(new DeleteFacesCommand({ CollectionId: collectionId, FaceIds: faceIds }));
}
