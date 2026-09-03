import { getAlbum } from '@/actions/albums';
import { getAlbumPhotosPage } from '@/actions/photos';
import { AlbumDetail } from '@/components/admin/album-detail';
import { PhotoGalleryGrid } from '@/components/admin/photo-gallery-grid';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const PAGE_SIZE = 12;

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
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/albums/${id}`}>
          <ArrowLeft className="size-4" />
          Voltar para o álbum
        </Link>
      </Button>

      <div>
        <h1 className="font-bold text-2xl">Fotos — {album.name}</h1>
        <p className="text-[var(--muted-foreground)] text-sm">{total} foto(s) no total</p>
      </div>

      <AlbumDetail albumId={id} />

      {pagePhotos.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">Nenhuma foto nesta página.</p>
      ) : (
        <PhotoGalleryGrid photos={pagePhotos} />
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
