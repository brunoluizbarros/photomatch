'use client';

import { listPrintQueue, markItemsPrinted } from '@/actions/sales';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MAX_PRINT_PHOTOS } from '@/lib/print';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Queue = Awaited<ReturnType<typeof listPrintQueue>>;

export function PrintQueuePanel({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<Queue | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const rows = await listPrintQueue(eventId);
    setItems(rows);
    // Descarta seleção de itens que já saíram da fila (ex: marcados em outra aba).
    setSelected((prev) => new Set([...prev].filter((id) => rows.some((r) => r.itemId === id))));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(itemId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else if (next.size < MAX_PRINT_PHOTOS) {
        next.add(itemId);
      }
      return next;
    });
  }

  async function handleMarkPrinted() {
    setBusy(true);
    await markItemsPrinted(eventId, [...selected]);
    setSelected(new Set());
    await load();
    setBusy(false);
  }

  if (!items) return null;

  const selectedItems = items.filter((item) => selected.has(item.itemId));
  const printHref = `/admin/events/${eventId}/print?ids=${selectedItems.map((i) => i.photoId).join(',')}`;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Fila de impressão</h1>

      {items.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">Nenhuma foto aguardando impressão.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[var(--muted-foreground)] text-sm">
              {selected.size} de {items.length} selecionadas (máximo {MAX_PRINT_PHOTOS} por vez)
            </p>
            <Button asChild variant="accent" size="sm" disabled={selected.size === 0}>
              <Link href={printHref} target="_blank">
                Imprimir selecionadas
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selected.size === 0 || busy}
              onClick={handleMarkPrinted}
            >
              Marcar como impressas
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item) => (
              <Card key={item.itemId} className="space-y-2 p-3">
                <Label className="flex cursor-pointer flex-col gap-2">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-[var(--muted)]">
                    <Image src={item.url} alt="Foto para impressão" fill className="object-cover" />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={selected.has(item.itemId)}
                      onCheckedChange={() => toggle(item.itemId)}
                    />
                    <span className="truncate">{item.customerName}</span>
                  </div>
                </Label>
                <p className="text-[var(--muted-foreground)] text-xs">
                  {format(item.createdAt, "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
