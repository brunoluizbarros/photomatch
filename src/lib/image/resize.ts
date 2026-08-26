import sharp from 'sharp';

export const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024; // margem de segurança sob o limite de 5MB do Rekognition

// Fotos de câmera profissional em resolução plena costumam passar do limite.
// Não é preciso mexer em parâmetros de detecção — só caber no teto de bytes da API.
export async function resizeToFitByteLimit(original: Buffer): Promise<Buffer> {
  if (original.length <= MAX_IMAGE_BYTES) return original;

  for (const quality of [85, 75, 65]) {
    const attempt = await sharp(original).jpeg({ quality }).toBuffer();
    if (attempt.length <= MAX_IMAGE_BYTES) return attempt;
  }

  for (const width of [2400, 1800, 1200]) {
    const attempt = await sharp(original)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    if (attempt.length <= MAX_IMAGE_BYTES) return attempt;
  }

  // Último recurso: garante que cabe, mesmo perdendo qualidade.
  return sharp(original).resize({ width: 1000 }).jpeg({ quality: 70 }).toBuffer();
}
