import { getPublishedAlbumBySlug } from '@/actions/albums';
import { EventHero } from '@/components/public/event-hero';
import { SelfieSearch } from '@/components/public/selfie-search';
import { resolveSurface } from '@/lib/event-theme/surface';
import { getAccentPreset } from '@/lib/theme/accent-presets';
import { getBodyPreset } from '@/lib/theme/body-presets';
import { ALL_FONT_VARIABLES, getFontPreset } from '@/lib/theme/font-presets';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';

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

  const eyebrow = album.eventDate
    ? format(album.eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Galeria do evento';
  const welcomeMessage = album.welcomeMessage ?? 'Tire uma selfie e encontre suas fotos do evento.';
  const accent = getAccentPreset(album.primaryColor);
  const font = getFontPreset(album.fontId);
  const body = getBodyPreset(album.bodyColor);
  // Um fundo de corpo customizado (não "auto") fixa a superfície clara/escura
  // certa pra esse fundo, em vez de trocar sozinha por horário — um preset
  // escuro custom com o texto do modo dia (tinta) ficaria ilegível.
  const surface = body.background ? body.mode : resolveSurface(theme);

  return (
    <div
      className={cn(
        ALL_FONT_VARIABLES,
        surface === 'night' ? 'event-night' : 'event-day',
        'min-h-dvh bg-event-bg font-sans text-event-text antialiased',
      )}
      style={
        {
          '--event-accent': accent.solid,
          '--font-display': `var(${font.cssVar})`,
          ...(body.background ? { background: body.background } : null),
        } as CSSProperties
      }
    >
      <EventHero
        title={album.name}
        eyebrow={eyebrow}
        heroImageUrl={album.heroImageUrl}
        logoUrl={album.logoUrl}
        fallbackGradient={accent.gradient}
      />
      <main className="relative z-10 mx-auto -mt-10 w-full max-w-[620px] px-5 pb-24 sm:-mt-12 sm:px-6">
        {/* bloom do accent atrás do card — profundidade sem imagem extra */}
        <div
          aria-hidden
          className="-z-10 -top-24 pointer-events-none absolute left-1/2 size-72 -translate-x-1/2 rounded-full bg-event-accent/25 blur-[90px]"
        />
        <SelfieSearch slug={album.slug} welcomeMessage={welcomeMessage} />
        <div className="mx-auto mt-10 mb-4 h-px w-8 bg-event-line" />
        <p className="text-center text-[11px] text-event-text-mute uppercase tracking-[0.2em]">
          {album.name}
        </p>
      </main>
    </div>
  );
}
