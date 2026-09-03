'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { getPresignedUploadUrl } from '@/lib/storage/presign';
import { randomFilename } from '@/lib/utils/random-filename';

// Upload de imagem de marca (capa ou logo) de um evento — presign direto, sem
// passar pela fila de indexação (não é uma foto de evento, não entra em
// `photos`). O storageKey vai pra events.heroImageKey/logoImageKey; a URL
// exibida é sempre uma presigned GET gerada fresca no request (ver
// src/lib/branding-image.ts), nunca guardada pronta.
//
// requireAdmin() explícito e não requireUser('admin'): esta action gera uma
// presigned PUT (escrita) pra um prefixo arbitrário do bucket a partir só de
// um eventId sem validar nada mais — nunca deve ficar disponível pra
// fotógrafo/atendimento.
export async function requestBrandingImageUpload(input: {
  eventId: string;
  kind: 'hero' | 'logo';
  filename: string;
  contentType: string;
}) {
  await requireAdmin();
  const storageKey = `albums/${input.eventId}/branding/${input.kind}-${randomFilename(input.filename)}`;
  const uploadUrl = await getPresignedUploadUrl(storageKey, input.contentType);
  return { storageKey, uploadUrl };
}
