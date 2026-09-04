'use client';

import { listAlbumsByEvent, movePhotosToAlbum } from '@/actions/photo-albums';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { photos } from '@/lib/db/schemas';
import { ChevronLeft, ChevronRight, Printer, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Status = (typeof photos.$inferSelect)['status'];

const STATUS_LABEL: Record<Status, string> = {
  awaiting_upload: 'enviando',
  pending: 'na fila',
  processing: 'processando',
  indexed: 'indexada',
  failed: 'falhou',
};

const STATUS_VARIANT: Record<Status, 'default' | 'success' | 'warning' | 'destructive'> = {
  awaiting_upload: 'default',
  pending: 'default',
  processing: 'warning',
  indexed: 'success',
  failed: 'destructive',
};

const MOVE_SELECT_CLASS =
  'h-9 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]';
// Sentinel pra "sem álbum" — distinto de "" (reservado pro placeholder
// desabilitado do select, senão os dois valores colidiriam).
const NO_ALBUM_VALUE = '__none__';

type GalleryPhoto = { id: string; url: string; status: Status };
type Albums = Awaited<ReturnType<typeof listAlbumsByEvent>>;

// Mesmo padrão de modal em tela cheia da página pública (selfie-search.tsx)
// — duplicado em vez de compartilhado porque os dados aqui têm status/badge,
// que o resultado público não tem.
function PhotoModal({
  photos: modalPhotos,
  index,
  onClose,
  onNavigate,
}: {
  photos: GalleryPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < modalPhotos.length - 1) onNavigate(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, modalPhotos.length, onClose, onNavigate]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: fechar no clique do fundo é reforço do botão X e do Escape, não a única forma de fechar
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Fechar"
      >
        <X className="size-5" />
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index - 1);
          }}
          className="absolute left-2 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      {index < modalPhotos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index + 1);
          }}
          className="absolute right-2 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
          aria-label="Próxima foto"
        >
          <ChevronRight className="size-5" />
        </button>
      )}

      <div className="flex flex-col items-center gap-3">
        <img
          src={modalPhotos[index].url}
          alt=""
          className="max-h-[80svh] max-w-[92vw] rounded-[10px] object-contain"
        />
        <Badge variant={STATUS_VARIANT[modalPhotos[index].status]}>
          {STATUS_LABEL[modalPhotos[index].status]}
        </Badge>
      </div>
    </div>
  );
}

// eventId habilita a seleção + impressão (a página pública e o admin/[test]
// não passam eventId e ficam sem essa barra, só a galeria de leitura).
// canMove espelha o guard de movePhotosToAlbum (admin/fotógrafo) — atendimento
// não vê a opção de mover, já que a action rejeitaria mesmo assim.
export function PhotoGalleryGrid({
  photos: pagePhotos,
  eventId,
  canMove = false,
}: {
  photos: GalleryPhoto[];
  eventId?: string;
  canMove?: boolean;
}) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [albums, setAlbums] = useState<Albums | null>(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (!eventId || !canMove) return;
    listAlbumsByEvent(eventId).then(setAlbums);
  }, [eventId, canMove]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleMove(albumId: string) {
    if (!eventId || selected.size === 0 || !albumId) return;
    setMoving(true);
    await movePhotosToAlbum(eventId, [...selected], albumId === NO_ALBUM_VALUE ? null : albumId);
    setMoving(false);
    setSelected(new Set());
    router.refresh();
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {pagePhotos.map((photo, i) => (
          <div key={photo.id} className="space-y-1.5">
            <button
              type="button"
              onClick={() => setSelectedIndex(i)}
              className="relative block aspect-square w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)] text-left transition-opacity hover:opacity-90"
            >
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="25vw"
                loading="eager"
                className="object-cover"
              />
              {eventId && (
                <Checkbox
                  checked={selected.has(photo.id)}
                  onCheckedChange={() => toggleSelected(photo.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 left-2 border-white bg-black/40"
                  aria-label="Selecionar foto"
                />
              )}
            </button>
            <Badge variant={STATUS_VARIANT[photo.status]}>{STATUS_LABEL[photo.status]}</Badge>
          </div>
        ))}
      </div>

      {eventId && selected.size > 0 && (
        <div className="sticky bottom-4 z-40 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--background)] p-3 shadow-lg">
          <span className="text-sm">{selected.size} selecionada(s)</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-[var(--muted-foreground)] text-sm underline"
            >
              Limpar
            </button>
            {canMove && albums && (
              <select
                className={MOVE_SELECT_CLASS}
                disabled={moving}
                value=""
                onChange={(e) => handleMove(e.target.value)}
              >
                <option value="" disabled>
                  {moving ? 'Movendo...' : 'Mover para álbum...'}
                </option>
                <option value={NO_ALBUM_VALUE}>Sem álbum</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
            )}
            <Link
              href={`/admin/events/${eventId}/print?ids=${[...selected].join(',')}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 text-[var(--primary-foreground)] text-sm font-semibold"
            >
              <Printer className="size-4" />
              Imprimir
            </Link>
          </div>
        </div>
      )}

      {selectedIndex !== null && (
        <PhotoModal
          photos={pagePhotos}
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </>
  );
}
