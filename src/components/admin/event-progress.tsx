'use client';

import { getEventProgress } from '@/actions/events';
import { getPhotosWithUnindexedFaces, reindexFailedPhotos } from '@/actions/photos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

type Progress = Awaited<ReturnType<typeof getEventProgress>>;
type UnindexedPhotos = Awaited<ReturnType<typeof getPhotosWithUnindexedFaces>>;

// Grade de miniaturas das fotos por trás do aviso agregado "N rostos não
// detectados" — cada foto mostra quantos rostos dela não indexaram; clique
// abre o original numa aba nova (mesma URL assinada, sem precisar de outro
// visualizador em tela cheia só pra isso).
function UnindexedPhotosGrid({ eventId }: { eventId: string }) {
  const [photos, setPhotos] = useState<UnindexedPhotos | null>(null);

  useEffect(() => {
    getPhotosWithUnindexedFaces(eventId).then(setPhotos);
  }, [eventId]);

  if (!photos) return <p className="text-[var(--muted-foreground)] text-sm">Carregando...</p>;
  if (photos.length === 0) {
    return <p className="text-[var(--muted-foreground)] text-sm">Nenhuma foto encontrada.</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
      {photos.map((photo) => (
        <a
          key={photo.id}
          href={photo.url}
          target="_blank"
          rel="noreferrer"
          className="relative block aspect-square overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)]"
        >
          <Image src={photo.url} alt="" fill sizes="16vw" className="object-cover" />
          <span className="absolute right-1 bottom-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
            {photo.unindexedFaceCount} rosto{photo.unindexedFaceCount === 1 ? '' : 's'}
          </span>
        </a>
      ))}
    </div>
  );
}

export function EventProgress({ eventId, refreshKey }: { eventId: string; refreshKey: number }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showUnindexed, setShowUnindexed] = useState(false);
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
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[var(--muted-foreground)] text-sm">
              {progress.unindexedFaceCount === 1
                ? 'Detectamos 1 rosto que não pôde ser usado na busca por selfie (a imagem estava com qualidade baixa demais para o reconhecimento facial).'
                : `Detectamos ${progress.unindexedFaceCount} rostos que não puderam ser usados na busca por selfie (a imagem estava com qualidade baixa demais para o reconhecimento facial).`}
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowUnindexed((v) => !v)}>
              {showUnindexed ? 'Ocultar fotos' : 'Ver fotos'}
            </Button>
          </div>
          {showUnindexed && <UnindexedPhotosGrid eventId={eventId} />}
        </div>
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
