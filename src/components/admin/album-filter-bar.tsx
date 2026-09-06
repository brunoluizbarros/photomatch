'use client';

import { createAlbum, deleteAlbum, listAlbumsByEvent, renameAlbum } from '@/actions/photo-albums';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { Folder, Pencil, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

type Albums = Awaited<ReturnType<typeof listAlbumsByEvent>>;

type DialogState =
  | { type: 'create' }
  | { type: 'rename'; albumId: string; name: string }
  | { type: 'delete'; albumId: string; name: string }
  | null;

// Diálogo único para criar/renomear/excluir — troca só título, valor inicial
// e ação conforme o `state`, em vez de três componentes quase idênticos.
function AlbumDialog({
  state,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: {
  state: DialogState;
  onClose: () => void;
  onCreate: (name: string) => Promise<string | undefined>;
  onRename: (albumId: string, name: string) => Promise<string | undefined>;
  onDelete: (albumId: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(state?.type === 'rename' ? state.name : '');
    setError(null);
  }, [state]);

  if (!state) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Checagem redundante com o guard acima: TS não propaga a narrow de
    // `state` não-nulo pra dentro deste closure.
    if (!state) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    const err =
      state.type === 'create' ? await onCreate(trimmed) : await onRename(state.albumId, trimmed);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  if (state.type === 'delete') {
    return (
      <Dialog open title="Excluir álbum" onClose={onClose}>
        <p className="text-sm">
          Excluir o álbum <strong>{state.name}</strong>? As fotos não são apagadas, só saem da
          pasta.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await onDelete(state.albumId);
              setLoading(false);
              onClose();
            }}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      title={state.type === 'create' ? 'Novo álbum' : 'Renomear álbum'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="album-name">Nome do álbum</Label>
          <Input
            id="album-name"
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : state.type === 'create' ? 'Criar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// Faixa de "pastas" acima da galeria de fotos do evento — filtra por álbum
// via querystring (?album=<id>|none|all), mesmo padrão server-side de ?page=
// já usado na página. Os três papéis podem filtrar por álbum; quem pode
// criar depende de canCreate (admin sempre, fotógrafo só se o evento
// liberar — ver events.photographersCanCreateAlbums). Renomear/excluir
// continua só admin.
export function AlbumFilterBar({
  eventId,
  basePath,
  activeAlbum,
  noAlbumCount,
  isAdmin,
  canCreate,
}: {
  eventId: string;
  basePath: string;
  activeAlbum: string; // 'all' | 'none' | <albumId>
  noAlbumCount: number;
  isAdmin: boolean;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [albums, setAlbums] = useState<Albums | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const load = useCallback(async () => {
    setAlbums(await listAlbumsByEvent(eventId));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(name: string) {
    setError(null);
    const result = await createAlbum(eventId, name);
    if (!result.ok) return result.error;
    await load();
    router.refresh();
  }

  async function handleRename(albumId: string, name: string): Promise<string | undefined> {
    await renameAlbum(albumId, eventId, name);
    await load();
    router.refresh();
    return undefined;
  }

  async function handleDelete(albumId: string) {
    await deleteAlbum(albumId, eventId);
    await load();
    router.refresh();
  }

  if (!albums) {
    return <div className="h-9 w-64 animate-pulse rounded-full bg-[var(--muted)]" />;
  }

  return (
    <div className="space-y-2">
      <AlbumDialog
        state={dialog}
        onClose={() => setDialog(null)}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Chip href={`${basePath}?album=all`} active={activeAlbum === 'all'} icon={Folder}>
          Todas
        </Chip>
        <Chip href={`${basePath}?album=none`} active={activeAlbum === 'none'} icon={Folder}>
          Sem álbum ({noAlbumCount})
        </Chip>
        {albums.map((album) => (
          <div
            key={album.id}
            className="group relative"
            title={album.authorName ? `Criado por ${album.authorName}` : undefined}
          >
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
                  onClick={() => setDialog({ type: 'rename', albumId: album.id, name: album.name })}
                  className="grid size-4 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)]"
                  aria-label="Renomear álbum"
                >
                  <Pencil className="size-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDialog({ type: 'delete', albumId: album.id, name: album.name })}
                  className="grid size-4 place-items-center rounded-full bg-[var(--destructive)] text-white"
                  aria-label="Excluir álbum"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            )}
          </div>
        ))}
        {canCreate && (
          <button
            type="button"
            onClick={() => setDialog({ type: 'create' })}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:border-[var(--foreground)]/40"
          >
            <Plus className="size-3.5" />
            Novo álbum
          </button>
        )}
      </div>
      {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
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
