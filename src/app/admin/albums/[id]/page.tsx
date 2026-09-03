import { getAlbum } from '@/actions/albums';
import { AlbumBrandingForm } from '@/components/admin/album-branding-form';
import { AlbumDetail } from '@/components/admin/album-detail';
import { PublishToggle } from '@/components/admin/publish-toggle';
import { Button } from '@/components/ui/button';
import { Images, ScanFace } from 'lucide-react';
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

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/albums/${album.id}/photos`}>
            <Images className="size-4" />
            Ver galeria de fotos
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/albums/${album.id}/test`}>
            <ScanFace className="size-4" />
            Testar reconhecimento facial
          </Link>
        </Button>
      </div>

      <AlbumBrandingForm album={album} />

      <AlbumDetail albumId={album.id} />
    </div>
  );
}
