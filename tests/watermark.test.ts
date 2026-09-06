import { buildWatermarkedPreview } from '@/lib/image/watermark';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

async function fakePhoto(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: 'blue' } })
    .jpeg({ quality: 100 })
    .toBuffer();
}

describe('buildWatermarkedPreview', () => {
  it('returns a JPEG resized to the preview width', async () => {
    const original = await fakePhoto(2000, 1500);
    const preview = await buildWatermarkedPreview(original, 'Réveillon Carneiros');

    const metadata = await sharp(preview).metadata();
    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(900);
  });

  it('does not upscale a photo smaller than the preview width', async () => {
    const original = await fakePhoto(400, 300);
    const preview = await buildWatermarkedPreview(original, 'Evento Pequeno');

    const metadata = await sharp(preview).metadata();
    expect(metadata.width).toBe(400);
  });

  it('does not blow up with XML-sensitive characters in the event name', async () => {
    const original = await fakePhoto(600, 400);
    await expect(
      buildWatermarkedPreview(original, 'Casa & Cia <script>"teste"'),
    ).resolves.toBeInstanceOf(Buffer);
  });
});
