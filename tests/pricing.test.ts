import { type Plan, quoteCart } from '@/lib/pricing';
import { describe, expect, it } from 'vitest';

const AVULSO = { extraDigitalPriceCents: 500, extraPrintPriceCents: 800 };

const BRONZE: Plan = {
  id: 'bronze',
  name: 'Bronze',
  digitalQuota: 3,
  printQuota: 0,
  priceCents: 2000,
  ...AVULSO,
};
const SILVER: Plan = {
  id: 'silver',
  name: 'Prata',
  digitalQuota: 5,
  printQuota: 2,
  priceCents: 4000,
  ...AVULSO,
};
const GOLD: Plan = {
  id: 'gold',
  name: 'Ouro',
  digitalQuota: 10,
  printQuota: 5,
  priceCents: 9000,
  ...AVULSO,
};
const PLANS = [BRONZE, SILVER, GOLD];

describe('quoteCart', () => {
  it('empty cart costs nothing and picks no plan, even with plans registered', () => {
    expect(quoteCart({ digitalCount: 0, printCount: 0, plans: [] }).plan).toBeNull();
    const withPlans = quoteCart({ digitalCount: 0, printCount: 0, plans: PLANS });
    expect(withPlans.plan).toBeNull();
    expect(withPlans.totalCents).toBe(0);
  });

  it('no plans registered: nothing to sell', () => {
    const quote = quoteCart({ digitalCount: 3, printCount: 2, plans: [] });
    expect(quote.unavailable).toBe(true);
    expect(quote.totalCents).toBe(0);
  });

  it('digital-only cart picks the cheapest plan that covers it', () => {
    const quote = quoteCart({ digitalCount: 3, printCount: 0, plans: PLANS });
    expect(quote.plan?.id).toBe('bronze');
    expect(quote.totalCents).toBe(2000);
    expect(quote.remainingDigital).toBe(0);
    expect(quote.extraDigital).toBe(0);
  });

  it('print-only cart skips plans with insufficient print quota', () => {
    // BRONZE has printQuota 0, does not cover 1 print; SILVER (printQuota 2) does.
    const quote = quoteCart({ digitalCount: 0, printCount: 1, plans: PLANS });
    expect(quote.plan?.id).toBe('silver');
    expect(quote.totalCents).toBe(4000);
    expect(quote.extraPrint).toBe(0);
  });

  it('exact fit picks the cheapest covering plan with zero remaining', () => {
    const quote = quoteCart({ digitalCount: 5, printCount: 2, plans: PLANS });
    expect(quote.plan?.id).toBe('silver');
    expect(quote.remainingDigital).toBe(0);
    expect(quote.remainingPrint).toBe(0);
    expect(quote.totalCents).toBe(4000);
  });

  it('overflow in a single dimension: largest plan as base + its own avulso', () => {
    // No plan covers 12 digitais (GOLD tops out at 10) -> largest plan (GOLD)
    // is the base, overflow billed at GOLD's own extra price.
    const quote = quoteCart({ digitalCount: 12, printCount: 2, plans: PLANS });
    expect(quote.plan?.id).toBe('gold');
    expect(quote.extraDigital).toBe(2);
    expect(quote.extraPrint).toBe(0);
    expect(quote.totalCents).toBe(9000 + 2 * 500);
  });

  it('overflow in both dimensions: largest plan as base + both avulsos', () => {
    const quote = quoteCart({ digitalCount: 12, printCount: 6, plans: PLANS });
    expect(quote.plan?.id).toBe('gold');
    expect(quote.extraDigital).toBe(2);
    expect(quote.extraPrint).toBe(1);
    expect(quote.totalCents).toBe(9000 + 2 * 500 + 1 * 800);
  });

  it('each plan bills overflow at its OWN avulso price, not a shared rate', () => {
    const cheapExtra: Plan = {
      id: 'a',
      name: 'A',
      digitalQuota: 2,
      printQuota: 0,
      priceCents: 1000,
      extraDigitalPriceCents: 100,
      extraPrintPriceCents: 100,
    };
    const pricierExtra: Plan = {
      id: 'b',
      name: 'B',
      digitalQuota: 2,
      printQuota: 0,
      priceCents: 1000,
      extraDigitalPriceCents: 900,
      extraPrintPriceCents: 900,
    };
    // Same base price and quota, only the avulso differs -> 'a' wins on the
    // cheaper overflow, proving avulso is read per-plan, not from one shared
    // event-level rate.
    const quote = quoteCart({ digitalCount: 3, printCount: 0, plans: [pricierExtra, cheapExtra] });
    expect(quote.plan?.id).toBe('a');
    expect(quote.totalCents).toBe(1000 + 100);
  });

  it('tie-break among covering plans is deterministic regardless of list order', () => {
    const a: Plan = {
      id: 'a',
      name: 'A',
      digitalQuota: 5,
      printQuota: 5,
      priceCents: 5000,
      ...AVULSO,
    };
    const b: Plan = {
      id: 'b',
      name: 'B',
      digitalQuota: 5,
      printQuota: 5,
      priceCents: 5000,
      ...AVULSO,
    };
    const forward = quoteCart({ digitalCount: 2, printCount: 1, plans: [a, b] });
    const reversed = quoteCart({ digitalCount: 2, printCount: 1, plans: [b, a] });
    expect(forward.plan?.id).toBe(reversed.plan?.id);
    expect(forward.plan?.id).toBe('a'); // same price, same quota total -> lowest id wins
  });

  it('tie-break among "largest" plans (overflow case) is deterministic regardless of list order', () => {
    const a: Plan = {
      id: 'a',
      name: 'A',
      digitalQuota: 2,
      printQuota: 0,
      priceCents: 1000,
      ...AVULSO,
    };
    const b: Plan = {
      id: 'b',
      name: 'B',
      digitalQuota: 2,
      printQuota: 0,
      priceCents: 1000,
      ...AVULSO,
    };
    const forward = quoteCart({ digitalCount: 5, printCount: 0, plans: [a, b] });
    const reversed = quoteCart({ digitalCount: 5, printCount: 0, plans: [b, a] });
    expect(forward.plan?.id).toBe(reversed.plan?.id);
  });

  it('a zero-quota plan is never picked as the covering plan for a non-empty cart', () => {
    const zero: Plan = {
      id: 'zero',
      name: 'Zero',
      digitalQuota: 0,
      printQuota: 0,
      priceCents: 1,
      ...AVULSO,
    };
    const quote = quoteCart({ digitalCount: 1, printCount: 0, plans: [zero, GOLD] });
    // zero never covers a non-empty cart; GOLD does, so GOLD wins even though
    // it's pricier than "zero + 1 unit" would be — the rule only compares
    // among plans that actually cover, never against a non-covering plan.
    expect(quote.plan?.id).toBe('gold');
  });

  it('marks the cart unavailable when overflow has no configured avulso price on the chosen plan', () => {
    const noExtra: Plan = {
      id: 'bronze',
      name: 'Bronze',
      digitalQuota: 3,
      printQuota: 0,
      priceCents: 2000,
      extraDigitalPriceCents: 0,
      extraPrintPriceCents: 0,
    };
    const quote = quoteCart({ digitalCount: 4, printCount: 0, plans: [noExtra] });
    expect(quote.unavailable).toBe(true);
    expect(quote.totalCents).toBe(0);
  });

  it('remainingDigital/remainingPrint are never negative', () => {
    const quote = quoteCart({ digitalCount: 20, printCount: 20, plans: [GOLD] });
    expect(quote.remainingDigital).toBeGreaterThanOrEqual(0);
    expect(quote.remainingPrint).toBeGreaterThanOrEqual(0);
  });
});
