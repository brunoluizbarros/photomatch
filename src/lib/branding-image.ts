import { getPresignedDownloadUrl } from '@/lib/storage/presign';

// Resolve a imagem de marca (capa/logo) efetiva de um evento: a chave do
// bucket (upload feito pelo admin) tem prioridade sobre a URL legada (texto
// colado à mão, ex. um arquivo em public/images/) — a chave vira uma
// presigned URL fresca a cada chamada, nunca é guardada pronta no banco.
export async function resolveBrandingImageUrl(
  key: string | null,
  legacyUrl: string | null,
): Promise<string | null> {
  if (key) return getPresignedDownloadUrl(key);
  return legacyUrl;
}
