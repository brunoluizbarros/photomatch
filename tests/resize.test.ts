import { MAX_IMAGE_BYTES, resizeToFitByteLimit } from '@/lib/image/resize';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

describe('resizeToFitByteLimit', () => {
  it('leaves an already-small image untouched', async () => {
    const small = await sharp({
      create: { width: 10, height: 10, channels: 3, background: 'red' },
    })
      .jpeg()
      .toBuffer();

    const result = await resizeToFitByteLimit(small);
    expect(result).toBe(small);
  });

  it('shrinks a large synthetic image under the byte limit', async () => {
    // Alto ruído para não comprimir bem em JPEG e forçar a cascata de resize.
    const noisy = Buffer.alloc(4000 * 3000 * 3);
    for (let i = 0; i < noisy.length; i++) noisy[i] = Math.floor(Math.random() * 256);

    const large = await sharp(noisy, { raw: { width: 4000, height: 3000, channels: 3 } })
      .jpeg({ quality: 100 })
      .toBuffer();
    expect(large.length).toBeGreaterThan(MAX_IMAGE_BYTES);

    const result = await resizeToFitByteLimit(large);
    expect(result.length).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  });
});
