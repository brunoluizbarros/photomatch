// Import em massa de fotos para um evento, sem passar pelo painel web.
//
// Pasta local:    pnpm import-photos <event-slug> ./pasta-local
// Prefixo no bucket (fotos já sobem lá por outro processo): pnpm import-photos <event-slug> --bucket prefixo/
//
// Nos dois casos só cria a linha `pending` em `photos` — o worker
// (pnpm worker:face-indexer) faz o resto. Sem uploadedBy: import por CLI não
// tem um fotógrafo associado.
import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

async function main() {
  const [slug, source] = process.argv.slice(2);
  if (!slug || !source) {
    console.error('Uso: pnpm import-photos <event-slug> <./pasta-local | --bucket prefixo/>');
    process.exit(1);
  }

  const { db } = await import('../src/lib/db/client');
  const { events, photos } = await import('../src/lib/db/schemas');
  const { eq } = await import('drizzle-orm');
  const { randomFilename } = await import('../src/lib/utils/random-filename');

  const [event] = await db.select().from(events).where(eq(events.slug, slug));
  if (!event) {
    console.error(`Evento "${slug}" não encontrado. Crie-o pelo painel /admin primeiro.`);
    process.exit(1);
  }

  const rows: { eventId: string; storageKey: string }[] = [];

  if (source === '--bucket') {
    const prefix = process.argv[4];
    if (!prefix) {
      console.error('Faltou o prefixo: pnpm import-photos <slug> --bucket prefixo/');
      process.exit(1);
    }
    const { storage, bucketName } = await import('../src/lib/storage/client');
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

    let continuationToken: string | undefined;
    do {
      const page = await storage.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of page.Contents ?? []) {
        if (obj.Key) rows.push({ eventId: event.id, storageKey: obj.Key });
      }
      continuationToken = page.NextContinuationToken;
    } while (continuationToken);
  } else {
    const { storage, bucketName } = await import('../src/lib/storage/client');
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    const files = readdirSync(source).filter((f) =>
      IMAGE_EXTENSIONS.has(f.slice(f.lastIndexOf('.')).toLowerCase()),
    );

    for (const file of files) {
      // ponytail: prefixo "albums/" mantido de propósito — é o mesmo usado
      // pelas chaves já existentes no bucket (de quando "álbum" era o nome do
      // evento no código); a chave é opaca, trocar o prefixo não traz ganho.
      const storageKey = `albums/${event.id}/${randomFilename(file)}`;
      const body = readFileSync(join(source, file));
      await storage.send(new PutObjectCommand({ Bucket: bucketName, Key: storageKey, Body: body }));
      rows.push({ eventId: event.id, storageKey });
    }
  }

  if (rows.length === 0) {
    console.info('Nenhuma foto encontrada.');
    process.exit(0);
  }

  await db.insert(photos).values(rows.map((r) => ({ ...r, status: 'pending' as const })));
  console.info(
    `${rows.length} foto(s) registrada(s) para o evento "${slug}". Rode o worker para indexar.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Falha ao importar fotos', err);
  process.exit(1);
});
