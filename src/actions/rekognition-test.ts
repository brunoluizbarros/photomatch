'use server';

import { env } from '@/config/env';
import { requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { events } from '@/lib/db/schemas';
import { searchFacesBySelfie } from '@/lib/rekognition/faces';
import { InvalidParameterException } from '@aws-sdk/client-rekognition';
import { eq } from 'drizzle-orm';

// Painel de calibração: busca com threshold 0 e devolve TODOS os scores, para
// achar o REKOGNITION_FACE_MATCH_THRESHOLD ideal sem mexer no .env às cegas.
//
// {ok, error} em vez de lançar: o Next redige mensagens de erros lançados em
// Server Actions no build de produção, e esse painel só serve pra admin ler
// a mensagem exata (ex. "nenhum rosto na selfie de teste").
export async function testRekognitionSearch(eventId: string, selfieBase64: string) {
  await requireAdmin();

  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event) return { ok: false as const, error: 'Evento não encontrado.' };

  let matches: Awaited<ReturnType<typeof searchFacesBySelfie>>;
  try {
    matches = await searchFacesBySelfie({
      collectionId: event.rekognitionCollectionId,
      selfieBytes: Buffer.from(selfieBase64, 'base64'),
      faceMatchThreshold: 0,
      maxFaces: 100,
    });
  } catch (err) {
    if (err instanceof InvalidParameterException) {
      return { ok: false as const, error: 'Nenhum rosto detectado na selfie de teste.' };
    }
    throw err;
  }

  return {
    ok: true as const,
    matches: matches
      .sort((a, b) => b.similarity - a.similarity)
      .map((match) => ({
        ...match,
        passesThreshold: match.similarity >= env.REKOGNITION_FACE_MATCH_THRESHOLD,
      })),
  };
}
