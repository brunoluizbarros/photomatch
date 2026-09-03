import { getAlbum } from '@/actions/albums';
import { getAlbumPhotosPage } from '@/actions/photos';
import { Badge } from '@/components/ui/badge';
import type { photos } from '@/lib/db/schemas';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const PAGE_SIZE = 12;

const STATUS_LABEL: Record<(typeof photos.$inferSelect)['status'], string> = {
  awaiting_upload: 'enviando',
  pending: 'na fila',
  processing: 'processando',
  indexed: 'indexada',
  failed: 'falhou',
};

const STATUS_VARIANT: Record<
  (typeof photos.$inferSelect)['status'],
  'default' | 'success' | 'warning' | 'destructive'
> = {
  awaiting_upload: 'default',
  pending: 'default',
  processing: 'warning',
  indexed: 'success',
  failed: 'destructive',
};

export default async function AlbumPhotosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const album = await getAlbum(id);
  if (!album) notFound();

  const { photos: pagePhotos, total } = await getAlbumPhotosPage(id, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bold text-2xl">Fotos — {album.name}</h1>
        <p className="text-[var(--muted-foreground)] text-sm">{total} foto(s) no total</p>
      </div>

      {pagePhotos.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">Nenhuma foto nesta página.</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {pagePhotos.map((photo) => (
            <div key={photo.id} className="space-y-1.5">
              <div className="relative aspect-square overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)]">
                <Image src={photo.url} alt="" fill sizes="25vw" className="object-cover" />
              </div>
              <Badge variant={STATUS_VARIANT[photo.status]}>{STATUS_LABEL[photo.status]}</Badge>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-[var(--border)] border-t pt-4">
        <PageLink albumId={id} page={page - 1} disabled={page <= 1}>
          ← Anterior
        </PageLink>
        <span className="text-[var(--muted-foreground)] text-sm">
          Página {page} de {totalPages}
        </span>
        <PageLink albumId={id} page={page + 1} disabled={page >= totalPages}>
          Próxima →
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  albumId,
  page,
  disabled,
  children,
}: {
  albumId: string;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="text-[var(--muted-foreground)] text-sm opacity-50">{children}</span>;
  }
  return (
    <Link
      href={`/admin/albums/${albumId}/photos?page=${page}`}
      className="text-sm underline underline-offset-2"
    >
      {children}
    </Link>
  );
}
