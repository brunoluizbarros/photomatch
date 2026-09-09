// Enquadramento de carrinho em plano — função pura, sem I/O (nenhum import de
// db/env), pra rodar idêntica no cliente (barra do carrinho em tempo real) e
// no servidor (createOrder recalcula e ignora qualquer preço vindo do
// cliente).
//
// Regra de negócio: entre os planos que cobrem as duas quantidades, vence o
// mais barato. Se nenhum cobre, vence o "maior" plano cadastrado (maior
// priceCents) como base, cobrando por unidade o que passar da quota dele —
// pelo preço avulso DESTE plano (planos mais caros costumam ter avulso mais
// barato; não existe avulso "do evento"). Sem planos cadastrados, não há
// nada a vender. Carrinho vazio nunca compra plano.

export type Plan = {
  id: string;
  name: string;
  digitalQuota: number;
  printQuota: number;
  // Modalidade existe ou não neste plano — diferente de quota=0 (que ainda
  // vende avulso). false bloqueia a modalidade de vez, em qualquer preço.
  includesDigital: boolean;
  includesPrint: boolean;
  priceCents: number;
  extraDigitalPriceCents: number;
  extraPrintPriceCents: number;
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
  // true quando o carrinho não pôde ser precificado (sem planos, ou
  // excedente sem preço avulso configurado no plano escolhido) — sem essa
  // guarda um plano com avulso zerado por esquecimento venderia de graça
  // além da própria quota.
  unavailable: boolean;
};

// Empate resolvido de forma determinística, nunca pela ordem de chegada do
// banco: maior quota total primeiro, depois menor id. Só o critério primário
// (preço) inverte entre "mais barato que cobre" e "maior plano" — os
// desempates (quota, id) são os MESMOS nos dois casos, por isso são duas
// funções em vez de negar uma só (negar inverteria também o desempate de id).
function compareCheapest(a: Plan, b: Plan): number {
  if (a.priceCents !== b.priceCents) return a.priceCents - b.priceCents;
  const totalA = a.digitalQuota + a.printQuota;
  const totalB = b.digitalQuota + b.printQuota;
  if (totalA !== totalB) return totalB - totalA;
  return a.id.localeCompare(b.id);
}

function compareLargest(a: Plan, b: Plan): number {
  if (a.priceCents !== b.priceCents) return b.priceCents - a.priceCents;
  const totalA = a.digitalQuota + a.printQuota;
  const totalB = b.digitalQuota + b.printQuota;
  if (totalA !== totalB) return totalB - totalA;
  return a.id.localeCompare(b.id);
}

function quoteFor(plan: Plan, digitalCount: number, printCount: number): Quote | null {
  // Modalidade ausente no plano: nenhum preço a cobrar torna isto vendável —
  // checado antes da quota, não depois (quota=0 + avulso=0 já bloqueava por
  // acidente; isto bloqueia de propósito, mesmo se a quota ficou > 0).
  if (digitalCount > 0 && !plan.includesDigital) return null;
  if (printCount > 0 && !plan.includesPrint) return null;

  const extraDigital = Math.max(0, digitalCount - plan.digitalQuota);
  const extraPrint = Math.max(0, printCount - plan.printQuota);

  // Excedente sem preço avulso configurado (<=0) torna o plano inválido pra
  // este carrinho — não é "de graça".
  if (extraDigital > 0 && plan.extraDigitalPriceCents <= 0) return null;
  if (extraPrint > 0 && plan.extraPrintPriceCents <= 0) return null;

  const extraDigitalCents = extraDigital * plan.extraDigitalPriceCents;
  const extraPrintCents = extraPrint * plan.extraPrintPriceCents;

  return {
    plan,
    planPriceCents: plan.priceCents,
    extraDigital,
    extraPrint,
    extraDigitalCents,
    extraPrintCents,
    totalCents: plan.priceCents + extraDigitalCents + extraPrintCents,
    remainingDigital: Math.max(0, plan.digitalQuota - digitalCount),
    remainingPrint: Math.max(0, plan.printQuota - printCount),
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
}): Quote {
  const digitalCount = Math.max(0, Math.trunc(input.digitalCount) || 0);
  const printCount = Math.max(0, Math.trunc(input.printCount) || 0);
  const { plans } = input;

  if (digitalCount === 0 && printCount === 0) return EMPTY_QUOTE;
  if (plans.length === 0) return { ...EMPTY_QUOTE, unavailable: true };

  const covering = plans.filter(
    (plan) =>
      plan.digitalQuota >= digitalCount &&
      plan.printQuota >= printCount &&
      (digitalCount === 0 || plan.includesDigital) &&
      (printCount === 0 || plan.includesPrint),
  );
  if (covering.length > 0) {
    const cheapest = [...covering].sort(compareCheapest)[0];
    return quoteFor(cheapest, digitalCount, printCount) as Quote;
  }

  // Ninguém cobre: base é o "maior" plano (maior preço; empate por maior
  // quota total, depois id) + avulso DELE pelo que exceder a quota.
  const largest = [...plans].sort(compareLargest)[0];
  return quoteFor(largest, digitalCount, printCount) ?? { ...EMPTY_QUOTE, unavailable: true };
}
