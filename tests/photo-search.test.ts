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

  // searchPhotosByFace (multi-selfie) apenas concatena os matches de cada
  // selfie antes de chamar esta função uma única vez — a união deduplicada
  // é inteiramente coberta por este caso: mesma foto aparecendo na busca de
  // duas selfies diferentes (ex: mãe e filho na mesma foto de grupo) não
  // duplica, e mantém a maior similaridade entre as duas buscas.
  it('unions matches from multiple selfies without duplicating photos', () => {
    const selfie1Matches = [
      { photoId: 'group-photo', similarity: 85 },
      { photoId: 'only-in-selfie-1', similarity: 92 },
    ];
    const selfie2Matches = [
      { photoId: 'group-photo', similarity: 97 },
      { photoId: 'only-in-selfie-2', similarity: 88 },
    ];
    const result = dedupeAndOrderMatches([...selfie1Matches, ...selfie2Matches]);
    expect(result).toEqual(['group-photo', 'only-in-selfie-1', 'only-in-selfie-2']);
  });
});
