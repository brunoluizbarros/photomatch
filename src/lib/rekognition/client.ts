import { env } from '@/config/env';
import { RekognitionClient } from '@aws-sdk/client-rekognition';

// Credencial IAM própria, separada do STORAGE_* (Railway Object Storage). Só
// os bytes da imagem trafegam para a AWS; o Rekognition não guarda a imagem
// original, apenas o vetor facial derivado dentro da Collection.
//
// ponytail: credenciais opcionais aqui de propósito — sem elas o SDK cai no
// provider chain padrão da AWS, que só falha quando a feature é de fato usada
// (criar álbum, indexar, buscar), não na inicialização do app/build.
export const rekognition = new RekognitionClient({
  region: env.REKOGNITION_REGION,
  ...(env.REKOGNITION_ACCESS_KEY_ID && env.REKOGNITION_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: env.REKOGNITION_ACCESS_KEY_ID,
          secretAccessKey: env.REKOGNITION_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});
