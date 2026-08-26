import { dedupeAndOrderMatches } from '@/lib/photo-search';
import { describe, expect, it } from 'vitest';

describe('dedupeAndOrderMatches', () => {
  it('keeps the highest similarity per photo', () => {
    const result = dedupeAndOrderMatches([
      { photoId: 'a', similarity: 80 },
      { photoId: 'a', similarity: 95 },
      { photoId: 'a', similarity: 60 },
    ]);
    expect(result).toEqual(['a']);
  });

  it('orders photos by similarity, descending', () => {
    const result = dedupeAndOrderMatches([
      { photoId: 'low', similarity: 81 },
      { photoId: 'high', similarity: 99 },
      { photoId: 'mid', similarity: 90 },
    ]);
    expect(result).toEqual(['high', 'mid', 'low']);
  });

  it('returns an empty list for no matches', () => {
    expect(dedupeAndOrderMatches([])).toEqual([]);
  });
});
