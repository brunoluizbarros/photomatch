import { getAlbum } from '@/actions/albums';
import { AccessRequestsPanel } from '@/components/admin/access-requests-panel';
import { AlbumBrandingForm } from '@/components/admin/album-branding-form';
import { AnalyticsPanel } from '@/components/admin/analytics-panel';
import { PublishToggle } from '@/components/admin/publish-toggle';
import { QrCodeCard } from '@/components/admin/qr-code-card';
import { Button } from '@/components/ui/button';
import { resolveBrandingImageUrl } from '@/lib/branding-image';
import { Images, ScanFace } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const DEFAULT_WINDOW_DAYS = 30;

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { id } = await params;
  const { d } = await searchParams;
  const days = Number(d) || DEFAULT_WINDOW_DAYS;
  const album = await getAlbum(id);
  if (!album) notFound();

  const [heroPreviewUrl, logoPreviewUrl] = await Promise.all([
    resolveBrandingImageUrl(album.heroImageKey, album.heroImageUrl),
    resolveBrandingImageUrl(album.logoImageKey, album.logoUrl),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase">{album.name}</h1>
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

      <AnalyticsPanel days={days} albumId={album.id} basePath={`/admin/albums/${album.id}`} />

      <AccessRequestsPanel albumId={album.id} />

      <QrCodeCard slug={album.slug} />

      <AlbumBrandingForm
        album={album}
        heroPreviewUrl={heroPreviewUrl}
        logoPreviewUrl={logoPreviewUrl}
      />
    </div>
  );
}
