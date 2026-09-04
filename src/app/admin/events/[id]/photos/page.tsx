import { getEvent } from '@/actions/events';
import { countPhotosWithoutAlbum } from '@/actions/photo-albums';
import { getEventPhotosPage } from '@/actions/photos';
import { AlbumFilterBar } from '@/components/admin/album-filter-bar';
import { EventDetail } from '@/components/admin/event-detail';
import { PhotoGalleryGrid } from '@/components/admin/photo-gallery-grid';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/require-admin';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const PAGE_SIZE = 12;

export default async function EventPhotosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; album?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam, album: albumParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const activeAlbum = albumParam ?? 'all';

  const { role } = await requireUser();
  const event = await getEvent(id);
  if (!event) notFound();
  const isAdmin = role === 'admin';
  const canCreateAlbum = isAdmin || (role === 'photographer' && event.photographersCanCreateAlbums);

  const albumFilter =
    activeAlbum === 'all' ? undefined : { albumId: activeAlbum === 'none' ? null : activeAlbum };

  const [{ photos: pagePhotos, total }, noAlbumCount] = await Promise.all([
    getEventPhotosPage(id, page, PAGE_SIZE, albumFilter),
    countPhotosWithoutAlbum(id),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = `/admin/events/${id}/photos`;

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/events/${id}`}>
          <ArrowLeft className="size-4" />
          Voltar para o evento
        </Link>
      </Button>

      <div>
        <h1 className="font-display text-2xl uppercase">Fotos — {event.name}</h1>
        <p className="text-[var(--muted-foreground)] text-sm">{total} foto(s) no total</p>
      </div>

      <AlbumFilterBar
        eventId={id}
        basePath={basePath}
        activeAlbum={activeAlbum}
        noAlbumCount={noAlbumCount}
        isAdmin={isAdmin}
        canCreate={canCreateAlbum}
      />

      {role !== 'support' && (
        <EventDetail eventId={id} albumId={albumFilter?.albumId ?? undefined} />
      )}

      {pagePhotos.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">Nenhuma foto nesta página.</p>
      ) : (
        <PhotoGalleryGrid photos={pagePhotos} eventId={id} canMove={role !== 'support'} />
      )}

      <div className="flex items-center justify-between border-[var(--border)] border-t pt-4">
        <PageLink basePath={basePath} album={activeAlbum} page={page - 1} disabled={page <= 1}>
          ← Anterior
        </PageLink>
        <span className="text-[var(--muted-foreground)] text-sm">
          Página {page} de {totalPages}
        </span>
        <PageLink
          basePath={basePath}
          album={activeAlbum}
          page={page + 1}
          disabled={page >= totalPages}
        >
          Próxima →
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  basePath,
  album,
  page,
  disabled,
  children,
}: {
  basePath: string;
  album: string;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="text-[var(--muted-foreground)] text-sm opacity-50">{children}</span>;
  }
  return (
    <Link
      href={`${basePath}?page=${page}&album=${album}`}
      className="text-sm underline underline-offset-2"
    >
      {children}
    </Link>
  );
}
