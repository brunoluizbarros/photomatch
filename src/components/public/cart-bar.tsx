'use client';

import { Button } from '@/components/ui/button';
import type { Quote } from '@/lib/pricing';

function centsToBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Barra fixa no rodapé — some quando o carrinho está vazio. Mostra o
// enquadramento em tempo real (mesma função pura que o servidor recalcula no
// checkout, ver src/lib/pricing.ts).
export function CartBar({
  digitalCount,
  printCount,
  quote,
  onCheckout,
}: {
  digitalCount: number;
  printCount: number;
  quote: Quote;
  onCheckout: () => void;
}) {
  if (digitalCount === 0 && printCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-30 mt-4 rounded-[14px] border border-event-line bg-event-surface p-4 shadow-[0_24px_60px_-32px_rgba(20,16,10,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px] text-event-text-soft">
          <p className="font-semibold text-event-text">
            {digitalCount} {digitalCount === 1 ? 'digital' : 'digitais'} · {printCount}{' '}
            {printCount === 1 ? 'impressa' : 'impressas'} · {centsToBRL(quote.totalCents)}
          </p>
          {quote.unavailable ? (
            <p className="text-[var(--destructive)]">
              Não foi possível calcular o preço. Fale com a organização do evento.
            </p>
          ) : (
            <p>
              {quote.plan ? quote.plan.name : 'Sem plano'}
              {quote.remainingDigital > 0 && ` · ainda cabem ${quote.remainingDigital} digitais`}
              {quote.remainingPrint > 0 && ` · ainda cabem ${quote.remainingPrint} impressas`}
              {(quote.extraDigital > 0 || quote.extraPrint > 0) &&
                ` · ${quote.extraDigital + quote.extraPrint} avulsas`}
            </p>
          )}
        </div>
        <Button
          className="h-11 rounded-full bg-event-accent px-6 text-event-cream hover:opacity-90"
          disabled={quote.unavailable}
          onClick={onCheckout}
        >
          Finalizar pedido
        </Button>
      </div>
    </div>
  );
}
