import { funnelRates } from '@/lib/analytics/funnel-rates';
import { describe, expect, it } from 'vitest';

describe('funnelRates', () => {
  it('does not divide by zero when there are no visits or searches', () => {
    expect(funnelRates({ visits: 0, searches: 0, found: 0 })).toEqual({
      searchRate: 0,
      successRate: 0,
    });
  });

  it('computes search and success rates', () => {
    expect(funnelRates({ visits: 100, searches: 40, found: 10 })).toEqual({
      searchRate: 0.4,
      successRate: 0.25,
    });
  });
});
