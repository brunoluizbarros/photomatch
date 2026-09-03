'use server';

import { db } from '@/lib/db/client';
import { albums, analytics_events } from '@/lib/db/schemas';
import { searchPhotosByFace } from '@/lib/photo-search';
import { isRateLimited } from '@/lib/rate-limit';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';

const MAX_SEARCHES_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

async function getClientIp() {
  const headerList = await headers();
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

// Endpoint público, sem login: convidado tira selfie em /e/[slug] e recebe as
// fotos dele. A selfie nunca é persistida — trafega só como base64 no corpo
// desta Server Action e morre com a request.
export async function searchPhotosBySelfiePublic(
  slug: string,
  selfieBase64: string,
  deviceId: string,
) {
  const ip = await getClientIp();
  if (isRateLimited(`public-search:${ip}`, MAX_SEARCHES_PER_WINDOW, RATE_LIMIT_WINDOW_MS)) {
    throw new Error('Muitas buscas em pouco tempo. Espere um minuto e tente de novo.');
  }

  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.slug, slug), eq(albums.isPublished, true)));
  if (!album) throw new Error('Evento não encontrado');

  const results = await searchPhotosByFace({
    collectionId: album.rekognitionCollectionId,
    selfieBase64,
  });

  // Analytics nunca pode derrubar a busca do convidado.
  try {
    await db.insert(analytics_events).values({
      albumId: album.id,
      deviceId: deviceId.slice(0, 64),
      type: 'search',
      photoCount: results.length,
    });
  } catch (err) {
    console.error('search event insert failed', err);
  }

  return results;
}
