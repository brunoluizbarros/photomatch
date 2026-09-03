import { getEvent } from '@/actions/events';
import { AccessRequestsPanel } from '@/components/admin/access-requests-panel';
import { AnalyticsPanel } from '@/components/admin/analytics-panel';
import { EventBrandingForm } from '@/components/admin/event-branding-form';
import { PublishToggle } from '@/components/admin/publish-toggle';
import { QrCodeCard } from '@/components/admin/qr-code-card';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth/require-admin';
import { resolveBrandingImageUrl } from '@/lib/branding-image';
import { Images, ScanFace } from 'lucide-react';
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
      </div>

      {isAdmin && (
        <>
          <AnalyticsPanel days={days} eventId={event.id} basePath={`/admin/events/${event.id}`} />
          <AccessRequestsPanel eventId={event.id} />
        </>
      )}

      <QrCodeCard slug={event.slug} />

      {isAdmin && (
        <EventBrandingForm
          event={event}
          heroPreviewUrl={heroPreviewUrl}
          logoPreviewUrl={logoPreviewUrl}
        />
      )}
    </div>
  );
}
