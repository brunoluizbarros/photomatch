import { getPublishedAlbumBySlug } from '@/actions/albums';
import { EventHero } from '@/components/public/event-hero';
import { SelfieSearch } from '@/components/public/selfie-search';
import { resolveSurface } from '@/lib/event-theme/surface';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Fraunces } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';

// Carregada só nesta rota (não no layout raiz) para não pagar o preload em
// /admin e nas demais páginas.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-fraunces',
  display: 'swap',
});

// A superfície dia/noite depende do horário no momento do request.
export const dynamic = 'force-dynamic';

export default async function PublicAlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: string }>;
}) {
  const { slug } = await params;
  const { theme } = await searchParams;
  const album = await getPublishedAlbumBySlug(slug);
  if (!album) notFound();

  const surface = resolveSurface(theme);
  const eyebrow = album.eventDate
    ? format(album.eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Galeria do evento';
  const welcomeMessage = album.welcomeMessage ?? 'Tire uma selfie e encontre suas fotos do evento.';

  return (
    <div
      className={cn(
        fraunces.variable,
        surface === 'night' ? 'event-night' : 'event-day',
        'min-h-dvh bg-event-bg font-sans text-event-text',
      )}
      style={{ '--event-accent': album.primaryColor } as CSSProperties}
    >
      <EventHero
        title={album.name}
        eyebrow={eyebrow}
        heroImageUrl={album.heroImageUrl}
        logoUrl={album.logoUrl}
      />
      <main className="mx-auto w-full px-[22px] pt-6 pb-16">
        <SelfieSearch slug={album.slug} welcomeMessage={welcomeMessage} />
      </main>
    </div>
  );
}
