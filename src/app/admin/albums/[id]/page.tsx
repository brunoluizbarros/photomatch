import { getAlbum } from '@/actions/albums';
import { AlbumBrandingForm } from '@/components/admin/album-branding-form';
import { AlbumDetail } from '@/components/admin/album-detail';
import { PublishToggle } from '@/components/admin/publish-toggle';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl">{album.name}</h1>
        <p className="text-[var(--muted-foreground)] text-sm">
          Collection: <code>{album.rekognitionCollectionId}</code>
        </p>
      </div>

      <PublishToggle albumId={album.id} slug={album.slug} initialIsPublished={album.isPublished} />

      <div className="flex gap-4">
        <Link href={`/admin/albums/${album.id}/photos`} className="text-sm underline">
          Ver galeria de fotos
        </Link>
        <Link href={`/admin/albums/${album.id}/test`} className="text-sm underline">
          Testar reconhecimento facial
        </Link>
      </div>

      <AlbumBrandingForm album={album} />

      <AlbumDetail albumId={album.id} />
    </div>
  );
}
