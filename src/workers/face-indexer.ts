// Worker de indexação facial — serviço Railway separado (start command
// próprio, ver package.json "worker:face-indexer"), rodando no mesmo repo do
// Next. Puxa trabalho da própria tabela `photos` via FOR UPDATE SKIP LOCKED
// (src/lib/db/queue.ts) em vez de um broker externo.
//
// Baixa a foto do bucket, redimensiona só o necessário para caber no limite
// de 5MB da API do Rekognition, indexa os rostos na Collection do evento e
// grava o mapeamento FaceId->foto.
import 'dotenv/config';

import { env } from '@/config/env';
import { db } from '@/lib/db/client';
import {
  type ClaimedPhoto,
  claimPhotoBatch,
  reapAbandonedUploads,
  releaseFailure,
  releaseSuccess,
} from '@/lib/db/queue';
import { events, photo_faces, photos } from '@/lib/db/schemas';
import { resizeToFitByteLimit } from '@/lib/image/resize';
import { buildWatermarkedPreview } from '@/lib/image/watermark';
import { fetchRemoteImage } from '@/lib/import/fetch-remote-image';
import { deletePhotoFaces, indexPhotoFaces } from '@/lib/rekognition/faces';
import { bucketName, storage } from '@/lib/storage/client';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import Bottleneck from 'bottleneck';
import { eq, inArray } from 'drizzle-orm';
import sharp from 'sharp';

const POLL_INTERVAL_MS = 2000;
const BATCH_SIZE = 5;

// Impõe um teto de chamadas/segundo ao Rekognition, abaixo da cota da conta
// na região configurada.
// ponytail: minTime é por processo — com N réplicas do worker o TPS efetivo é
// N x REKOGNITION_MAX_TPS. Rodar 1 réplica até o volume justificar Redis.
const limiter = new Bottleneck({ minTime: 1000 / env.REKOGNITION_MAX_TPS });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadPhoto(storageKey: string): Promise<Buffer> {
  const object = await storage.send(new GetObjectCommand({ Bucket: bucketName, Key: storageKey }));
  if (!object.Body) throw new Error(`Empty object body for ${storageKey}`);
  return Buffer.from(await object.Body.transformToByteArray());
}

// Foto importada por link (Drive/Dropbox): baixa da origem e grava no bucket
// na primeira passada, depois zera sourceUrl — assim um retry (releaseFailure
// devolve a linha pra 'pending') já lê do bucket em vez de bater na origem de
// novo.
async function loadPhotoBytes(photo: ClaimedPhoto): Promise<Buffer> {
  if (!photo.sourceUrl) return downloadPhoto(photo.storageKey);

  const { body, contentType } = await fetchRemoteImage(photo.sourceUrl);
  await storage.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: photo.storageKey,
      Body: body,
      ContentType: contentType,
    }),
  );
  await db.update(photos).set({ sourceUrl: null }).where(eq(photos.id, photo.id));
  return body;
}

async function handlePhoto(photo: ClaimedPhoto, collectionId: string, eventName: string) {
  try {
    const original = await loadPhotoBytes(photo);
    const resized = await resizeToFitByteLimit(original);

    // Se é uma reindexação, apaga os FaceIds antigos na AWS antes de indexar
    // de novo — evita acumular vetores órfãos na Collection a cada reprocesso.
    const existingFaces = await db
      .select({ rekognitionFaceId: photo_faces.rekognitionFaceId })
      .from(photo_faces)
      .where(eq(photo_faces.photoId, photo.id));
    if (existingFaces.length > 0) {
      await deletePhotoFaces(
        collectionId,
        existingFaces.map((f) => f.rekognitionFaceId),
      );
    }

    const { faces, unindexedCount } = await limiter.schedule(() =>
      indexPhotoFaces({ collectionId, photoId: photo.id, imageBytes: resized }),
    );

    await db.delete(photo_faces).where(eq(photo_faces.photoId, photo.id));
    if (faces.length > 0) {
      await db.insert(photo_faces).values(
        faces.map((face) => ({
          photoId: photo.id,
          eventId: photo.eventId,
          rekognitionFaceId: face.faceId,
          boundingBox: face.boundingBox,
          confidence: face.confidence,
        })),
      );
    }

    const metadata = await sharp(resized).metadata();

    // Preview público com marca d'água — é a ÚNICA imagem que o convidado
    // recebe (ver src/lib/photo-search.ts). Uma foto sem preview não pode
    // virar "indexed": cai no catch e volta pra fila.
    const preview = await buildWatermarkedPreview(original, eventName);
    const previewKey = `previews/${photo.eventId}/${photo.id}.jpg`;
    await storage.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: previewKey,
        Body: preview,
        ContentType: 'image/jpeg',
      }),
    );

    await releaseSuccess(photo.id, {
      faceCount: faces.length,
      unindexedFaceCount: unindexedCount,
      width: metadata.width,
      height: metadata.height,
      bytes: resized.length,
      previewKey,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Failed to index photo ${photo.id} (attempt ${photo.attempts})`, err);
    await releaseFailure(photo.id, photo.attempts, errorMessage);
  }
}

async function main() {
  console.info(`face-indexer worker started (max ${env.REKOGNITION_MAX_TPS} req/s to Rekognition)`);

  while (true) {
    let batch: ClaimedPhoto[];
    try {
      batch = await claimPhotoBatch(BATCH_SIZE);
    } catch (err) {
      // Soluço transitório de banco não pode matar o processo — só o
      // próximo poll tenta de novo.
      console.error('claimPhotoBatch failed, retrying next poll', err);
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    if (batch.length === 0) {
      // Worker ocioso mesmo — aproveita pra limpar uploads abandonados em
      // vez de rodar isso num cron/serviço à parte.
      await reapAbandonedUploads();
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    // Um SELECT para os eventos distintos do lote (em vez de um por foto) —
    // o lote quase sempre é do mesmo evento.
    const eventIds = [...new Set(batch.map((photo) => photo.eventId))];
    const eventRows = await db.select().from(events).where(inArray(events.id, eventIds));
    const eventById = new Map(eventRows.map((event) => [event.id, event]));

    // O Bottleneck já impõe o teto de TPS do Rekognition, e handlePhoto tem
    // try/catch próprio por foto — processar o lote em paralelo não perde
    // isolamento de falha e multiplica o throughput.
    await Promise.all(
      batch.map((photo) => {
        const event = eventById.get(photo.eventId);
        if (!event) {
          console.warn(`Event ${photo.eventId} not found for photo ${photo.id}, skipping`);
          return;
        }
        return handlePhoto(photo, event.rekognitionCollectionId, event.name);
      }),
    );
  }
}

main().catch((err) => {
  console.error('face-indexer worker crashed', err);
  process.exit(1);
});
