'use client';

import { Badge } from '@/components/ui/badge';
import type { photos } from '@/lib/db/schemas';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
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

type GalleryPhoto = { id: string; url: string; status: Status };

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

export function PhotoGalleryGrid({ photos: pagePhotos }: { photos: GalleryPhoto[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {pagePhotos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelectedIndex(i)}
            className="space-y-1.5 text-left"
          >
            <div className="relative aspect-square overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)] transition-opacity hover:opacity-90">
              <Image
                src={photo.url}
                alt=""
                fill
                sizes="25vw"
                loading="eager"
                className="object-cover"
              />
            </div>
            <Badge variant={STATUS_VARIANT[photo.status]}>{STATUS_LABEL[photo.status]}</Badge>
          </button>
        ))}
      </div>

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
