'use client';

import { listPrintQueue, markItemsPrinted } from '@/actions/sales';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MAX_PRINT_PHOTOS, PRINT_SIZES, type PrintSize } from '@/lib/print';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Queue = Awaited<ReturnType<typeof listPrintQueue>>;

const SELECT_CLASS =
  'h-9 rounded-lg border-2 border-[var(--border)] bg-transparent px-2 text-xs outline-none focus:border-[var(--accent)]';

export function PrintQueuePanel({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<Queue | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Tamanho por item — cada foto pode ir num tamanho diferente (individual);
  // "aplicar às selecionadas" abaixo é só um atalho pra setar o mesmo valor
  // em massa, não um modo à parte.
  const [sizes, setSizes] = useState<Record<string, PrintSize | ''>>({});
  const [bulkSize, setBulkSize] = useState<PrintSize | ''>('');
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

  function setItemSize(itemId: string, size: PrintSize | '') {
    setSizes((prev) => ({ ...prev, [itemId]: size }));
  }

  function applyBulkSize() {
    if (!bulkSize) return;
    setSizes((prev) => {
      const next = { ...prev };
      for (const id of selected) next[id] = bulkSize;
      return next;
    });
  }

  const selectedItems = items?.filter((item) => selected.has(item.itemId)) ?? [];
  const missingSize = selectedItems.some((item) => !sizes[item.itemId]);

  async function handleMarkPrinted() {
    if (missingSize) return;
    setBusy(true);
    // Um tamanho por chamada (ver markItemsPrinted) — agrupa a seleção por
    // tamanho escolhido, assim 1 foto (individual) ou N com o mesmo tamanho
    // (em massa) viram 1 chamada só; tamanhos misturados viram uma por grupo.
    const bySize = new Map<PrintSize, string[]>();
    for (const item of selectedItems) {
      const size = sizes[item.itemId];
      if (!size) continue;
      const group = bySize.get(size) ?? [];
      group.push(item.itemId);
      bySize.set(size, group);
    }
    await Promise.all(
      [...bySize.entries()].map(([size, ids]) => markItemsPrinted(eventId, ids, size)),
    );
    setSelected(new Set());
    await load();
    setBusy(false);
  }

  if (!items) return null;

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

            <div className="flex items-center gap-1.5">
              <select
                value={bulkSize}
                onChange={(e) => setBulkSize(e.target.value as PrintSize | '')}
                disabled={selected.size === 0}
                className={SELECT_CLASS}
              >
                <option value="">Tamanho...</option>
                {PRINT_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={selected.size === 0 || !bulkSize}
                onClick={applyBulkSize}
              >
                Aplicar às selecionadas
              </Button>
            </div>

            <Button asChild variant="accent" size="sm" disabled={selected.size === 0}>
              <Link href={printHref} target="_blank">
                Imprimir selecionadas
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selected.size === 0 || missingSize || busy}
              onClick={handleMarkPrinted}
              title={missingSize ? 'Escolha o tamanho de cada foto selecionada' : undefined}
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
                <select
                  value={sizes[item.itemId] ?? ''}
                  onChange={(e) => setItemSize(item.itemId, e.target.value as PrintSize | '')}
                  className={`${SELECT_CLASS} w-full`}
                >
                  <option value="">Tamanho...</option>
                  {PRINT_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
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
