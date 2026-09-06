import { getEvent } from '@/actions/events';
import { AccessRequestsPanel } from '@/components/admin/access-requests-panel';
import { AnalyticsPanel } from '@/components/admin/analytics-panel';
import { EventBrandingCard } from '@/components/admin/event-branding-card';
import { EventSalesCard } from '@/components/admin/event-sales-card';
import { EventVisibilityToggle } from '@/components/admin/event-visibility-toggle';
import { PhotographerPermissionsCard } from '@/components/admin/photographer-permissions-card';
import { PublishToggle } from '@/components/admin/publish-toggle';
import { QrCodeCard } from '@/components/admin/qr-code-card';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/require-admin';
import { resolveBrandingImageUrl } from '@/lib/branding-image';
import { Images, Printer, ReceiptText, ScanFace } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const DEFAULT_WINDOW_DAYS = 30;

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { id } = await params;
  const { d } = await searchParams;
  const days = Number(d) || DEFAULT_WINDOW_DAYS;
  const { role } = await requireUser();
  const isAdmin = role === 'admin';
  const event = await getEvent(id);
  if (!event) notFound();

  const [heroPreviewUrl, logoPreviewUrl] = await Promise.all([
    resolveBrandingImageUrl(event.heroImageKey, event.heroImageUrl),
    resolveBrandingImageUrl(event.logoImageKey, event.logoUrl),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase">{event.name}</h1>
        <p className="text-[var(--muted-foreground)] text-sm">
          Collection: <code>{event.rekognitionCollectionId}</code>
        </p>
      </div>

      {isAdmin && (
        <PublishToggle
          eventId={event.id}
          slug={event.slug}
          initialIsPublished={event.isPublished}
        />
      )}
      {isAdmin && <EventVisibilityToggle eventId={event.id} initialIsPublic={event.isPublic} />}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/events/${event.id}/photos`}>
            <Images className="size-4" />
            Ver galeria de fotos
          </Link>
        </Button>
        {isAdmin && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/events/${event.id}/test`}>
              <ScanFace className="size-4" />
              Testar reconhecimento facial
            </Link>
          </Button>
        )}
        {isAdmin && event.salesEnabled && (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/events/${event.id}/orders`}>
                <ReceiptText className="size-4" />
                Pedidos
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/events/${event.id}/print-queue`}>
                <Printer className="size-4" />
                Fila de impressão
              </Link>
            </Button>
          </>
        )}
      </div>

      {isAdmin && (
        <>
          <AnalyticsPanel days={days} eventId={event.id} basePath={`/admin/events/${event.id}`} />
          <EventSalesCard eventId={event.id} initialSalesEnabled={event.salesEnabled} />
          <PhotographerPermissionsCard
            eventId={event.id}
            initialSeeAllPhotos={event.photographersSeeAllPhotos}
            initialCanCreateAlbums={event.photographersCanCreateAlbums}
          />
          <AccessRequestsPanel eventId={event.id} />
        </>
      )}

      <QrCodeCard slug={event.slug} />

      {isAdmin && (
        <EventBrandingCard
          event={event}
          heroPreviewUrl={heroPreviewUrl}
          logoPreviewUrl={logoPreviewUrl}
        />
      )}
    </div>
  );
}
