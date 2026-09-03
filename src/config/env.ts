import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    DATABASE_PUBLIC_URL: z.string().optional(),
    BETTER_AUTH_SECRET: z.string().min(1),

    STORAGE_ENDPOINT: z.string(),
    STORAGE_REGION: z.string().default('auto'),
    STORAGE_BUCKET: z.string(),
    STORAGE_ACCESS_KEY_ID: z.string(),
    STORAGE_SECRET_ACCESS_KEY: z.string(),

    REKOGNITION_REGION: z.string().default('us-east-1'),
    REKOGNITION_ACCESS_KEY_ID: z.string().optional(),
    REKOGNITION_SECRET_ACCESS_KEY: z.string().optional(),
    // Similaridade mínima (escala 0-100 da AWS) para considerar uma foto um match.
    // Calibrar com fotos reais do evento pelo painel de teste antes de confiar no default.
    REKOGNITION_FACE_MATCH_THRESHOLD: z.coerce.number().min(0).max(100).default(80),
    // Teto de chamadas/s que o worker se impõe, abaixo da cota da conta AWS na região
    // (50 TPS em us-east-1, 5 em sa-east-1).
    REKOGNITION_MAX_TPS: z.coerce.number().positive().default(40),

    // Notificação de pedido de acesso (src/lib/notify/*) — opcionais: sem elas,
    // o pedido continua sendo salvo normalmente, só o envio fica marcado como
    // falho no painel (ver access-requests-panel.tsx), nunca falha silenciosa.
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_WHATSAPP_FROM: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_PUBLIC_URL: process.env.DATABASE_PUBLIC_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
    STORAGE_REGION: process.env.STORAGE_REGION,
    STORAGE_BUCKET: process.env.STORAGE_BUCKET,
    STORAGE_ACCESS_KEY_ID: process.env.STORAGE_ACCESS_KEY_ID,
    STORAGE_SECRET_ACCESS_KEY: process.env.STORAGE_SECRET_ACCESS_KEY,
    REKOGNITION_REGION: process.env.REKOGNITION_REGION,
    REKOGNITION_ACCESS_KEY_ID: process.env.REKOGNITION_ACCESS_KEY_ID,
    REKOGNITION_SECRET_ACCESS_KEY: process.env.REKOGNITION_SECRET_ACCESS_KEY,
    REKOGNITION_FACE_MATCH_THRESHOLD: process.env.REKOGNITION_FACE_MATCH_THRESHOLD,
    REKOGNITION_MAX_TPS: process.env.REKOGNITION_MAX_TPS,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
