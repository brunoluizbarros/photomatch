'use client';

import { setPhotographersCanCreateAlbums, setPhotographersSeeAllPhotos } from '@/actions/events';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-2 text-left disabled:opacity-60"
    >
      <span>
        <span className="block font-semibold text-[var(--foreground)] text-sm">{label}</span>
        <span className="block text-[var(--muted-foreground)] text-xs">{hint}</span>
      </span>
      <span
        className={
          checked
            ? 'flex h-6 w-11 shrink-0 items-center rounded-full bg-[var(--accent)] px-0.5'
            : 'flex h-6 w-11 shrink-0 items-center rounded-full bg-[var(--border)] px-0.5'
        }
      >
        <span
          className={
            checked
              ? 'size-5 translate-x-5 rounded-full bg-white transition-transform'
              : 'size-5 translate-x-0 rounded-full bg-white transition-transform'
          }
        />
      </span>
    </button>
  );
}

// Duas permissões de fotógrafo, por evento — default restritivo (desligado):
// cada fotógrafo só vê/mexe no que é dele. Admin liga por evento quando quiser.
export function PhotographerPermissionsCard({
  eventId,
  initialSeeAllPhotos,
  initialCanCreateAlbums,
}: {
  eventId: string;
  initialSeeAllPhotos: boolean;
  initialCanCreateAlbums: boolean;
}) {
  const router = useRouter();
  const [seeAllPhotos, setSeeAllPhotos] = useState(initialSeeAllPhotos);
  const [canCreateAlbums, setCanCreateAlbums] = useState(initialCanCreateAlbums);
  const [loading, setLoading] = useState(false);

  async function toggleSeeAll(next: boolean) {
    setLoading(true);
    await setPhotographersSeeAllPhotos(eventId, next);
    setSeeAllPhotos(next);
    setLoading(false);
    router.refresh();
  }

  async function toggleCreateAlbums(next: boolean) {
    setLoading(true);
    await setPhotographersCanCreateAlbums(eventId, next);
    setCanCreateAlbums(next);
    setLoading(false);
    router.refresh();
  }

  return (
    <Card className="space-y-1">
      <h2 className="mb-2 font-display uppercase">Permissões de fotógrafo</h2>
      <Toggle
        label="Ver todas as fotos do evento"
        hint="Desligado (padrão): cada fotógrafo só vê as fotos que ele mesmo enviou."
        checked={seeAllPhotos}
        disabled={loading}
        onChange={toggleSeeAll}
      />
      <div className="border-[var(--border)] border-t" />
      <Toggle
        label="Criar álbuns"
        hint="Desligado (padrão): só o admin cria álbuns (pastas) neste evento."
        checked={canCreateAlbums}
        disabled={loading}
        onChange={toggleCreateAlbums}
      />
    </Card>
  );
}
