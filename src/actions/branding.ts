'use server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { getPresignedUploadUrl } from '@/lib/storage/presign';
import { randomFilename } from '@/lib/utils/random-filename';

// Upload de imagem de marca (capa ou logo) de um álbum — presign direto, sem
// passar pela fila de indexação (não é uma foto de evento, não entra em
// `photos`). O storageKey vai pra albums.heroImageKey/logoImageKey; a URL
// exibida é sempre uma presigned GET gerada fresca no request (ver
// src/lib/branding-image.ts), nunca guardada pronta.
export async function requestBrandingImageUpload(input: {
  albumId: string;
  kind: 'hero' | 'logo';
  filename: string;
  contentType: string;
}) {
  await requireAdmin();
  const storageKey = `albums/${input.albumId}/branding/${input.kind}-${randomFilename(input.filename)}`;
  const uploadUrl = await getPresignedUploadUrl(storageKey, input.contentType);
  return { storageKey, uploadUrl };
}
