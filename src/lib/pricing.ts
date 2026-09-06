// Enquadramento de carrinho em plano — função pura, sem I/O (nenhum import de
// db/env), pra rodar idêntica no cliente (barra do carrinho em tempo real) e
// no servidor (createOrder recalcula e ignora qualquer preço vindo do
// cliente).
//
// Regra de negócio: entre os planos que cobrem as duas quantidades, vence o
// mais barato. Se nenhum cobre, vence o "maior" plano cadastrado (maior
// priceCents) como base, cobrando por unidade o que passar da quota dele.
// Sem planos cadastrados, tudo é avulso. Carrinho vazio nunca compra plano.

export type Plan = {
  id: string;
  name: string;
  digitalQuota: number;
  printQuota: number;
  priceCents: number;
};

export type Quote = {
  plan: Plan | null;
  planPriceCents: number;
  extraDigital: number;
  extraPrint: number;
  extraDigitalCents: number;
  extraPrintCents: number;
  totalCents: number;
  remainingDigital: number;
  remainingPrint: number;
  // true quando o carrinho não pôde ser precificado (excedente sem preço
  // avulso configurado) — sem essa guarda um evento com unitário zerado por
  // esquecimento venderia de graça além da quota de qualquer plano.
  unavailable: boolean;
};

// Empate resolvido de forma determinística, nunca pela ordem de chegada do
// banco: maior quota total primeiro, depois menor id.
function comparePlans(a: Plan, b: Plan): number {
  if (a.priceCents !== b.priceCents) return a.priceCents - b.priceCents;
  const totalA = a.digitalQuota + a.printQuota;
  const totalB = b.digitalQuota + b.printQuota;
  if (totalA !== totalB) return totalB - totalA;
  return a.id.localeCompare(b.id);
}

function quoteFor(
  plan: Plan | null,
  digitalCount: number,
  printCount: number,
  digitalUnitPriceCents: number,
  printUnitPriceCents: number,
): Quote | null {
  const digitalQuota = plan?.digitalQuota ?? 0;
  const printQuota = plan?.printQuota ?? 0;
  const extraDigital = Math.max(0, digitalCount - digitalQuota);
  const extraPrint = Math.max(0, printCount - printQuota);

  // Excedente sem preço avulso configurado (<=0) torna a opção inválida —
  // não é "de graça".
  if (extraDigital > 0 && digitalUnitPriceCents <= 0) return null;
  if (extraPrint > 0 && printUnitPriceCents <= 0) return null;

  const planPriceCents = plan?.priceCents ?? 0;
  const extraDigitalCents = extraDigital * digitalUnitPriceCents;
  const extraPrintCents = extraPrint * printUnitPriceCents;

  return {
    plan,
    planPriceCents,
    extraDigital,
    extraPrint,
    extraDigitalCents,
    extraPrintCents,
    totalCents: planPriceCents + extraDigitalCents + extraPrintCents,
    remainingDigital: Math.max(0, digitalQuota - digitalCount),
    remainingPrint: Math.max(0, printQuota - printCount),
    unavailable: false,
  };
}

const EMPTY_QUOTE: Quote = {
  plan: null,
  planPriceCents: 0,
  extraDigital: 0,
  extraPrint: 0,
  extraDigitalCents: 0,
  extraPrintCents: 0,
  totalCents: 0,
  remainingDigital: 0,
  remainingPrint: 0,
  unavailable: false,
};

export function quoteCart(input: {
  digitalCount: number;
  printCount: number;
  plans: Plan[];
  digitalUnitPriceCents: number;
  printUnitPriceCents: number;
}): Quote {
  const digitalCount = Math.max(0, Math.trunc(input.digitalCount) || 0);
  const printCount = Math.max(0, Math.trunc(input.printCount) || 0);
  const { plans, digitalUnitPriceCents, printUnitPriceCents } = input;

  if (digitalCount === 0 && printCount === 0) return EMPTY_QUOTE;

  if (plans.length === 0) {
    return (
      quoteFor(null, digitalCount, printCount, digitalUnitPriceCents, printUnitPriceCents) ?? {
        ...EMPTY_QUOTE,
        unavailable: true,
      }
    );
  }

  const covering = plans.filter(
    (plan) => plan.digitalQuota >= digitalCount && plan.printQuota >= printCount,
  );
  if (covering.length > 0) {
    const cheapest = [...covering].sort(comparePlans)[0];
    return quoteFor(
      cheapest,
      digitalCount,
      printCount,
      digitalUnitPriceCents,
      printUnitPriceCents,
    ) as Quote;
  }

  // Ninguém cobre: base é o "maior" plano (maior preço; empate por maior
  // quota total, depois id) + avulsas pelo que exceder a quota dele.
  const largest = [...plans].sort((a, b) => -comparePlans(a, b))[0];
  const quote = quoteFor(
    largest,
    digitalCount,
    printCount,
    digitalUnitPriceCents,
    printUnitPriceCents,
  );
  return quote ?? { ...EMPTY_QUOTE, unavailable: true };
}
