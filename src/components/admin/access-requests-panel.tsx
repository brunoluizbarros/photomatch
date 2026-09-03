'use client';

import {
  approveAccessRequest,
  getAccessRequests,
  rejectAccessRequest,
} from '@/actions/access-requests';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';

type Requests = Awaited<ReturnType<typeof getAccessRequests>>;

function ResultBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Badge variant={ok ? 'success' : 'destructive'}>
      {ok ? '✓' : '✗'} {label}
    </Badge>
  );
}

export function AccessRequestsPanel({ albumId }: { albumId: string }) {
  const [requests, setRequests] = useState<Requests | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRequests(await getAccessRequests(albumId));
  }, [albumId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!requests) return null;

  const pending = requests.filter((r) => r.status === 'pending');
  const decided = requests.filter((r) => r.status !== 'pending');

  async function handleApprove(id: string) {
    setBusyId(id);
    await approveAccessRequest(id);
    await load();
    setBusyId(null);
  }

  async function handleReject(id: string) {
    setBusyId(id);
    await rejectAccessRequest(id);
    await load();
    setBusyId(null);
  }

  if (requests.length === 0) return null;

  return (
    <Card className="space-y-4">
      <h2 className="font-display uppercase">Pedidos de acesso</h2>

      {pending.length === 0 && (
        <p className="text-[var(--muted-foreground)] text-sm">Nenhum pedido pendente.</p>
      )}

      <div className="space-y-3">
        {pending.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border)] p-3"
          >
            <div>
              <p className="font-semibold text-sm">{r.name || r.email}</p>
              <p className="text-[var(--muted-foreground)] text-xs">
                {r.email} · {r.phone}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={busyId === r.id} onClick={() => handleApprove(r.id)}>
                {busyId === r.id ? 'Aprovando...' : 'Aprovar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === r.id}
                onClick={() => handleReject(r.id)}
              >
                Recusar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {decided.length > 0 && (
        <div className="space-y-2 border-[var(--border)] border-t pt-3">
          <p className="text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
            Respondidos
          </p>
          {decided.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <span className="font-medium">{r.name || r.email}</span>{' '}
                <span className="text-[var(--muted-foreground)] text-xs">
                  {r.respondedAt && format(r.respondedAt, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {r.status === 'approved' ? (
                  <>
                    <ResultBadge label="e-mail" ok={!!r.emailSentAt} />
                    <ResultBadge label="whatsapp" ok={!!r.whatsappSentAt} />
                  </>
                ) : (
                  <Badge>recusado</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
