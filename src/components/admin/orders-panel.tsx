'use client';

import { cancelOrder, listOrders, markOrderPaid } from '@/actions/sales';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';

type Orders = Awaited<ReturnType<typeof listOrders>>;

const STATUS_LABEL: Record<
  Orders[number]['status'],
  { label: string; variant: 'default' | 'success' | 'warning' }
> = {
  awaiting_payment: { label: 'Aguardando pagamento', variant: 'warning' },
  paid: { label: 'Pago', variant: 'success' },
  canceled: { label: 'Cancelado', variant: 'default' },
};

function centsToBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function OrdersPanel({ eventId }: { eventId: string }) {
  const [orders, setOrders] = useState<Orders | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOrders(await listOrders(eventId));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkPaid(orderId: string) {
    setBusyId(orderId);
    setError(null);
    const result = await markOrderPaid(orderId);
    if (!result.ok) setError(result.error);
    await load();
    setBusyId(null);
  }

  async function handleCancel(orderId: string) {
    if (!window.confirm('Cancelar este pedido?')) return;
    setBusyId(orderId);
    setError(null);
    const result = await cancelOrder(orderId);
    if (!result.ok) setError(result.error);
    await load();
    setBusyId(null);
  }

  if (!orders) return null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Pedidos</h1>
      {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}

      {orders.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">Nenhum pedido ainda.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = STATUS_LABEL[order.status];
            return (
              <Card key={order.id} className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-[var(--muted-foreground)] text-sm">
                      {order.customerEmail} · {order.customerPhone}
                    </p>
                    <p className="text-[var(--muted-foreground)] text-xs">
                      {format(order.createdAt, "dd 'de' MMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                <p className="text-sm">
                  {order.planName ?? 'Sem plano'} · {order.extraDigitalCount} digitais avulsas ·{' '}
                  {order.extraPrintCount} impressas avulsas ·{' '}
                  <span className="font-semibold">{centsToBRL(order.totalCents)}</span>
                </p>

                {order.status === 'awaiting_payment' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="accent"
                      disabled={busyId === order.id}
                      onClick={() => handleMarkPaid(order.id)}
                    >
                      Marcar como pago
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === order.id}
                      onClick={() => handleCancel(order.id)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
