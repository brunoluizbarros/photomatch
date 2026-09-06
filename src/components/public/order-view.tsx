'use client';

import { type getOrderByToken, getOrderPhotoDownloadUrl } from '@/actions/orders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Loader2, Printer } from 'lucide-react';
import { useState } from 'react';

type OrderResult = Extract<Awaited<ReturnType<typeof getOrderByToken>>, { ok: true }>;

function centsToBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function DigitalItem({ token, photoId }: { token: string; photoId: string }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const result = await getOrderPhotoDownloadUrl(token, photoId);
      if (result.ok) window.location.assign(result.url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={downloading} onClick={handleDownload}>
      {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Baixar
    </Button>
  );
}

export function OrderView({ token, order, items }: { token: string } & Omit<OrderResult, 'ok'>) {
  const digitalItems = items.filter((item) => item.kind === 'digital');
  const printItems = items.filter((item) => item.kind === 'print');

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl uppercase">Seu pedido</h1>
        <p className="text-[var(--muted-foreground)] text-sm">
          {order.customerName} · {order.customerEmail}
        </p>
      </div>

      <Card className="space-y-2">
        <p className="text-sm">
          {order.planName ?? 'Sem plano'}
          {order.extraDigitalCount > 0 && ` · ${order.extraDigitalCount} digitais avulsas`}
          {order.extraPrintCount > 0 && ` · ${order.extraPrintCount} impressas avulsas`}
        </p>
        <p className="font-semibold text-lg">{centsToBRL(order.totalCents)}</p>
      </Card>

      {order.status === 'awaiting_payment' && (
        <Card className="border-amber-200 bg-amber-50 text-amber-900">
          Aguardando confirmação do pagamento. Assim que a organização confirmar, suas fotos
          digitais aparecem aqui e as impressas entram na fila de impressão.
        </Card>
      )}

      {order.status === 'canceled' && (
        <Card className="border-red-200 bg-red-50 text-red-900">Este pedido foi cancelado.</Card>
      )}

      {digitalItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wide">Fotos digitais</h2>
          <div className="space-y-2">
            {digitalItems.map((item) => (
              <Card key={item.id} className="flex items-center justify-between p-3">
                <span className="text-sm">Foto {item.photoId.slice(0, 8)}</span>
                {order.status === 'paid' ? (
                  <DigitalItem token={token} photoId={item.photoId} />
                ) : (
                  <span className="text-[var(--muted-foreground)] text-xs">
                    Aguardando pagamento
                  </span>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {printItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wide">Fotos impressas</h2>
          <div className="space-y-2">
            {printItems.map((item) => (
              <Card key={item.id} className="flex items-center justify-between p-3">
                <span className="flex items-center gap-2 text-sm">
                  <Printer className="size-4" />
                  Foto {item.photoId.slice(0, 8)}
                </span>
                <span className="text-[var(--muted-foreground)] text-xs">
                  {item.deliveredAt
                    ? 'Entregue'
                    : item.printedAt
                      ? 'Impressa'
                      : order.status === 'paid'
                        ? 'Na fila de impressão'
                        : 'Aguardando pagamento'}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
