import { toE164BR } from '@/lib/utils/phone';
import { describe, expect, it } from 'vitest';

describe('toE164BR', () => {
  it('adds +55 to an 11-digit local number', () => {
    expect(toE164BR('11987654321')).toBe('+5511987654321');
  });

  it('adds +55 to a 10-digit local number (landline)', () => {
    expect(toE164BR('1132654321')).toBe('+551132654321');
  });

  it('strips a masked number and adds +55', () => {
    expect(toE164BR('(11) 98765-4321')).toBe('+5511987654321');
  });

  it('keeps a number that already has the 55 country code', () => {
    expect(toE164BR('5511987654321')).toBe('+5511987654321');
  });

  it('returns null for an invalid number', () => {
    expect(toE164BR('123')).toBeNull();
  });
});
