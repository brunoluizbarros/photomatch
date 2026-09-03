'use client';

import { getEventProgress } from '@/actions/events';
import { reindexFailedPhotos } from '@/actions/photos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCallback, useEffect, useRef, useState } from 'react';

type Progress = Awaited<ReturnType<typeof getEventProgress>>;

export function EventProgress({ eventId, refreshKey }: { eventId: string; refreshKey: number }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const data = await getEventProgress(eventId);
    setProgress(data);
    return data;
  }, [eventId]);

  // refreshKey é só um gatilho para reiniciar o poll depois de um upload —
  // não é lido dentro do efeito.
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey é gatilho, não dado lido no efeito
  useEffect(() => {
    let cancelled = false;

    async function tick() {
      const data = await load();
      if (cancelled) return;
      // Poll só enquanto houver trabalho em andamento — para sozinho quando zera.
      if (data.pending > 0 || data.processing > 0) {
        timerRef.current = setTimeout(tick, 5000);
      }
    }
    tick();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [load, refreshKey]);

  if (!progress) return null;

  return (
    <Card className="space-y-3">
      <h2 className="font-display uppercase">Progresso da indexação</h2>
      <div className="flex flex-wrap gap-2">
        <Badge>{progress.awaiting_upload} enviando</Badge>
        <Badge>{progress.pending} na fila</Badge>
        <Badge variant="warning">{progress.processing} processando</Badge>
        <Badge variant="success">{progress.indexed} indexadas</Badge>
        {progress.failed > 0 && <Badge variant="destructive">{progress.failed} falharam</Badge>}
      </div>
      {progress.unindexedFaceCount > 0 && (
        <p className="text-[var(--muted-foreground)] text-sm">
          {progress.unindexedFaceCount === 1
            ? 'Detectamos 1 rosto que não pôde ser usado na busca por selfie (a imagem estava com qualidade baixa demais para o reconhecimento facial).'
            : `Detectamos ${progress.unindexedFaceCount} rostos que não puderam ser usados na busca por selfie (a imagem estava com qualidade baixa demais para o reconhecimento facial).`}
        </p>
      )}
      {progress.failed > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await reindexFailedPhotos(eventId);
            load();
          }}
        >
          Reprocessar falhas
        </Button>
      )}
    </Card>
  );
}
