'use client';

import { createAlbum, deleteAlbum, listAlbumsByEvent, renameAlbum } from '@/actions/photo-albums';
import { cn } from '@/lib/utils/cn';
import { Folder, Pencil, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type Albums = Awaited<ReturnType<typeof listAlbumsByEvent>>;

// Faixa de "pastas" acima da galeria de fotos do evento — filtra por álbum
// via querystring (?album=<id>|none|all), mesmo padrão server-side de ?page=
// já usado na página. Só o admin cria/renomeia/exclui; os três papéis podem
// filtrar por álbum.
export function AlbumFilterBar({
  eventId,
  basePath,
  activeAlbum,
  noAlbumCount,
  isAdmin,
}: {
  eventId: string;
  basePath: string;
  activeAlbum: string; // 'all' | 'none' | <albumId>
  noAlbumCount: number;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [albums, setAlbums] = useState<Albums | null>(null);

  const load = useCallback(async () => {
    setAlbums(await listAlbumsByEvent(eventId));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    const name = window.prompt('Nome do álbum:');
    if (!name?.trim()) return;
    await createAlbum(eventId, name.trim());
    await load();
    router.refresh();
  }

  async function handleRename(albumId: string, currentName: string) {
    const name = window.prompt('Renomear álbum:', currentName);
    if (!name?.trim() || name.trim() === currentName) return;
    await renameAlbum(albumId, eventId, name.trim());
    await load();
    router.refresh();
  }

  async function handleDelete(albumId: string, name: string) {
    if (
      !window.confirm(`Excluir o álbum "${name}"? As fotos não são apagadas, só saem da pasta.`)
    ) {
      return;
    }
    await deleteAlbum(albumId, eventId);
    await load();
    router.refresh();
  }

  if (!albums) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip href={`${basePath}?album=all`} active={activeAlbum === 'all'} icon={Folder}>
        Todas
      </Chip>
      <Chip href={`${basePath}?album=none`} active={activeAlbum === 'none'} icon={Folder}>
        Sem álbum ({noAlbumCount})
      </Chip>
      {albums.map((album) => (
        <div key={album.id} className="group relative">
          <Chip
            href={`${basePath}?album=${album.id}`}
            active={activeAlbum === album.id}
            icon={Folder}
          >
            {album.name} ({album.photoCount})
          </Chip>
          {isAdmin && (
            <span className="absolute -top-1.5 -right-1.5 hidden gap-0.5 group-hover:flex">
              <button
                type="button"
                onClick={() => handleRename(album.id, album.name)}
                className="grid size-4 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)]"
                aria-label="Renomear álbum"
              >
                <Pencil className="size-2.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(album.id, album.name)}
                className="grid size-4 place-items-center rounded-full bg-[var(--destructive)] text-white"
                aria-label="Excluir álbum"
              >
                <X className="size-2.5" />
              </button>
            </span>
          )}
        </div>
      ))}
      {isAdmin && (
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:border-[var(--foreground)]/40"
        >
          <Plus className="size-3.5" />
          Novo álbum
        </button>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: typeof Folder;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
          : 'border-[var(--border)] hover:border-[var(--foreground)]/40',
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </Link>
  );
}
