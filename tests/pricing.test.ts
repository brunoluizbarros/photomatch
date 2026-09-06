import { type Plan, quoteCart } from '@/lib/pricing';
import { describe, expect, it } from 'vitest';

const BASE = { digitalUnitPriceCents: 500, printUnitPriceCents: 800 };

const BRONZE: Plan = {
  id: 'bronze',
  name: 'Bronze',
  digitalQuota: 3,
  printQuota: 0,
  priceCents: 2000,
};
const SILVER: Plan = {
  id: 'silver',
  name: 'Prata',
  digitalQuota: 5,
  printQuota: 2,
  priceCents: 4000,
};
const GOLD: Plan = { id: 'gold', name: 'Ouro', digitalQuota: 10, printQuota: 5, priceCents: 9000 };
const PLANS = [BRONZE, SILVER, GOLD];

describe('quoteCart', () => {
  it('empty cart costs nothing and picks no plan, even with plans registered', () => {
    expect(quoteCart({ digitalCount: 0, printCount: 0, plans: [], ...BASE }).plan).toBeNull();
    const withPlans = quoteCart({ digitalCount: 0, printCount: 0, plans: PLANS, ...BASE });
    expect(withPlans.plan).toBeNull();
    expect(withPlans.totalCents).toBe(0);
  });

  it('no plans registered: everything priced à la carte', () => {
    const quote = quoteCart({ digitalCount: 3, printCount: 2, plans: [], ...BASE });
    expect(quote.plan).toBeNull();
    expect(quote.totalCents).toBe(3 * 500 + 2 * 800);
    expect(quote.extraDigital).toBe(3);
    expect(quote.extraPrint).toBe(2);
    expect(quote.unavailable).toBe(false);
  });

  it('digital-only cart picks the cheapest plan that covers it', () => {
    const quote = quoteCart({ digitalCount: 3, printCount: 0, plans: PLANS, ...BASE });
    expect(quote.plan?.id).toBe('bronze');
    expect(quote.totalCents).toBe(2000);
    expect(quote.remainingDigital).toBe(0);
    expect(quote.extraDigital).toBe(0);
  });

  it('print-only cart skips plans with insufficient print quota', () => {
    // BRONZE has printQuota 0, does not cover 1 print; SILVER (printQuota 2) does.
    const quote = quoteCart({ digitalCount: 0, printCount: 1, plans: PLANS, ...BASE });
    expect(quote.plan?.id).toBe('silver');
    expect(quote.totalCents).toBe(4000);
    expect(quote.extraPrint).toBe(0);
  });

  it('exact fit picks the cheapest covering plan with zero remaining', () => {
    const quote = quoteCart({ digitalCount: 5, printCount: 2, plans: PLANS, ...BASE });
    expect(quote.plan?.id).toBe('silver');
    expect(quote.remainingDigital).toBe(0);
    expect(quote.remainingPrint).toBe(0);
    expect(quote.totalCents).toBe(4000);
  });

  it('overflow in a single dimension: largest plan as base + à la carte units', () => {
    // No plan covers 12 digitais (GOLD tops out at 10) -> largest plan (GOLD)
    // is the base, overflow billed à la carte.
    const quote = quoteCart({ digitalCount: 12, printCount: 2, plans: PLANS, ...BASE });
    expect(quote.plan?.id).toBe('gold');
    expect(quote.extraDigital).toBe(2);
    expect(quote.extraPrint).toBe(0);
    expect(quote.totalCents).toBe(9000 + 2 * 500);
  });

  it('overflow in both dimensions: largest plan as base + both à la carte units', () => {
    const quote = quoteCart({ digitalCount: 12, printCount: 6, plans: PLANS, ...BASE });
    expect(quote.plan?.id).toBe('gold');
    expect(quote.extraDigital).toBe(2);
    expect(quote.extraPrint).toBe(1);
    expect(quote.totalCents).toBe(9000 + 2 * 500 + 1 * 800);
  });

  it('tie-break among covering plans is deterministic regardless of list order', () => {
    const a: Plan = { id: 'a', name: 'A', digitalQuota: 5, printQuota: 5, priceCents: 5000 };
    const b: Plan = { id: 'b', name: 'B', digitalQuota: 5, printQuota: 5, priceCents: 5000 };
    const forward = quoteCart({ digitalCount: 2, printCount: 1, plans: [a, b], ...BASE });
    const reversed = quoteCart({ digitalCount: 2, printCount: 1, plans: [b, a], ...BASE });
    expect(forward.plan?.id).toBe(reversed.plan?.id);
    expect(forward.plan?.id).toBe('a'); // same price, same quota total -> lowest id wins
  });

  it('tie-break among "largest" plans (overflow case) is deterministic regardless of list order', () => {
    const a: Plan = { id: 'a', name: 'A', digitalQuota: 2, printQuota: 0, priceCents: 1000 };
    const b: Plan = { id: 'b', name: 'B', digitalQuota: 2, printQuota: 0, priceCents: 1000 };
    const forward = quoteCart({ digitalCount: 5, printCount: 0, plans: [a, b], ...BASE });
    const reversed = quoteCart({ digitalCount: 5, printCount: 0, plans: [b, a], ...BASE });
    expect(forward.plan?.id).toBe(reversed.plan?.id);
  });

  it('a zero-quota plan is never picked as the covering plan for a non-empty cart', () => {
    const zero: Plan = { id: 'zero', name: 'Zero', digitalQuota: 0, printQuota: 0, priceCents: 1 };
    const quote = quoteCart({ digitalCount: 1, printCount: 0, plans: [zero, GOLD], ...BASE });
    // zero never covers a non-empty cart; GOLD does, so GOLD wins even though
    // it's pricier than "zero + 1 unit" would be — the rule only compares
    // among plans that actually cover, never against a non-covering plan.
    expect(quote.plan?.id).toBe('gold');
  });

  it('marks the cart unavailable when overflow has no configured à la carte price', () => {
    const quote = quoteCart({
      digitalCount: 4,
      printCount: 0,
      plans: [BRONZE],
      digitalUnitPriceCents: 0,
      printUnitPriceCents: 0,
    });
    expect(quote.unavailable).toBe(true);
    expect(quote.totalCents).toBe(0);
  });

  it('marks the cart unavailable with no plans and no à la carte price configured', () => {
    const quote = quoteCart({
      digitalCount: 1,
      printCount: 0,
      plans: [],
      digitalUnitPriceCents: 0,
      printUnitPriceCents: 0,
    });
    expect(quote.unavailable).toBe(true);
  });

  it('remainingDigital/remainingPrint are never negative', () => {
    const quote = quoteCart({ digitalCount: 20, printCount: 20, plans: [GOLD], ...BASE });
    expect(quote.remainingDigital).toBeGreaterThanOrEqual(0);
    expect(quote.remainingPrint).toBeGreaterThanOrEqual(0);
  });
});
