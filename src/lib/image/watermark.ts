import sharp from 'sharp';

const PREVIEW_WIDTH = 900; // cobre o modal em tela cheia no celular e o grid de 300px sem borrar

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Ladrilho de texto repetido na diagonal — cobre a foto inteira sem calcular
// posição (`tile: true` no composite abaixo repete este SVG lado a lado).
function watermarkTile(eventName: string): Buffer {
  const label = escapeXml(eventName);
  return Buffer.from(`
    <svg width="220" height="140" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="80" font-family="sans-serif" font-size="20" font-weight="600"
            fill="white" fill-opacity="0.35" transform="rotate(-30 110 70)">${label}</text>
    </svg>
  `);
}

// Preview público: redimensiona para caber na tela e aplica a marca d'água
// com o nome do evento — é a trava comercial (o original nunca é presignado
// para o público, ver src/lib/photo-search.ts).
export async function buildWatermarkedPreview(
  original: Buffer,
  eventName: string,
): Promise<Buffer> {
  const resized = sharp(original).resize({ width: PREVIEW_WIDTH, withoutEnlargement: true });
  return resized
    .composite([{ input: watermarkTile(eventName), tile: true, blend: 'over' }])
    .jpeg({ quality: 78 })
    .toBuffer();
}
