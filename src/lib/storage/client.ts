import { env } from '@/config/env';
import { S3Client } from '@aws-sdk/client-s3';

export const storage = new S3Client({
  region: env.STORAGE_REGION,
  endpoint: env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
  },
  // Necessário para serviços S3-compatíveis fora da AWS (Railway, MinIO, R2).
  forcePathStyle: true,
});

export const bucketName = env.STORAGE_BUCKET;
