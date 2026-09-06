import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { bucketName, storage } from './client';

const PUT_URL_EXPIRES_SECONDS = 60 * 15; // 15 min é de sobra para o upload de uma foto
const GET_URL_EXPIRES_SECONDS = 60 * 60; // 1h — suficiente para carregar a galeria

// Upload em massa precisa ir direto do browser para o bucket, sem passar pela
// Server Action (limite de 10mb do body).
export async function getPresignedUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType });
  return getSignedUrl(storage, command, { expiresIn: PUT_URL_EXPIRES_SECONDS });
}

// `<a download>` é ignorado em URL cross-origin (o presigned GET aponta pro
// bucket, não pro app); quem força o "salvar como" em vez de abrir na aba é
// o header que o S3 devolve, pedido aqui na própria assinatura.
export async function getPresignedDownloadUrl(key: string, filename?: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: filename ? `attachment; filename="${filename}"` : undefined,
  });
  return getSignedUrl(storage, command, { expiresIn: GET_URL_EXPIRES_SECONDS });
}

// Confirma que o PUT presignado realmente chegou ao bucket antes de enfileirar
// a foto para indexação — evita fotos "pending" fantasma se o browser falhar
// silenciosamente entre o presign e o upload.
export async function headObject(key: string) {
  return storage.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
}
