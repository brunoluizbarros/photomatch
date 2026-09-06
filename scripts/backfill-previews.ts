// Backfill do preview com marca d'água para fotos indexadas antes dessa
// feature existir (previewKey nulo). Não toca no Rekognition — só gera o
// derivado 900px e grava a chave.
//
// Rodar uma vez logo após o deploy da migration que adiciona previewKey:
// pnpm backfill-previews
// Enquanto não rodar, fotos antigas ficam invisíveis na busca pública (o
// filtro isNotNull(previewKey) em src/lib/photo-search.ts) — deliberado: o
// contrário seria presignar o original sem marca d'água.
import 'dotenv/config';

async function main() {
  const { db } = await import('../src/lib/db/client');
  const { events, photos } = await import('../src/lib/db/schemas');
  const { and, eq, isNull } = await import('drizzle-orm');
  const { storage, bucketName } = await import('../src/lib/storage/client');
  const { GetObjectCommand, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { buildWatermarkedPreview } = await import('../src/lib/image/watermark');

  const rows = await db
    .select({
      id: photos.id,
      eventId: photos.eventId,
      storageKey: photos.storageKey,
      eventName: events.name,
    })
    .from(photos)
    .innerJoin(events, eq(events.id, photos.eventId))
    .where(and(eq(photos.status, 'indexed'), isNull(photos.previewKey)));

  if (rows.length === 0) {
    console.info('Nenhuma foto pendente de preview.');
    process.exit(0);
  }

  console.info(`Gerando preview para ${rows.length} foto(s)...`);
  let done = 0;
  for (const row of rows) {
    try {
      const object = await storage.send(
        new GetObjectCommand({ Bucket: bucketName, Key: row.storageKey }),
      );
      if (!object.Body) throw new Error('corpo vazio');
      const original = Buffer.from(await object.Body.transformToByteArray());
      const preview = await buildWatermarkedPreview(original, row.eventName);
      const previewKey = `previews/${row.eventId}/${row.id}.jpg`;
      await storage.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: previewKey,
          Body: preview,
          ContentType: 'image/jpeg',
        }),
      );
      await db.update(photos).set({ previewKey }).where(eq(photos.id, row.id));
      done++;
    } catch (err) {
      console.error(`Falha ao gerar preview de ${row.id}`, err);
    }
  }
  console.info(`${done}/${rows.length} preview(s) gerado(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Falha no backfill de previews', err);
  process.exit(1);
});
