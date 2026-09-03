import { getPublishedAlbumBySlug } from '@/actions/albums';
import { EventHero } from '@/components/public/event-hero';
import { SelfieSearch } from '@/components/public/selfie-search';
import { resolveSurface } from '@/lib/event-theme/surface';
import { getAccentPreset } from '@/lib/theme/accent-presets';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Anton } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';

// Carregada só nesta rota (não no layout raiz) para não pagar o preload em
// /admin e nas demais páginas. Anton só existe em peso 400 no Google Fonts —
// pedir outro peso quebra o build.
const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});

// A superfície dia/noite depende do horário no momento do request.
export const dynamic = 'force-dynamic';

// Chaves fixas pro texto repetido do ticker (sempre 6 cópias, nunca
// reordena) — só pra não usar índice de array como key.
const TICKER_REPEAT_KEYS = ['t1', 't2', 't3', 't4', 't5', 't6'];

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
  const accent = getAccentPreset(album.primaryColor);

  return (
    <div
      className={cn(
        anton.variable,
        surface === 'night' ? 'event-night' : 'event-day',
        'min-h-dvh bg-event-bg font-sans text-event-text antialiased',
      )}
      style={{ '--event-accent': accent.solid } as CSSProperties}
    >
      {/* Ticker — texto repetido rolando, motivo do site de corrida usado
          como referência. Duplicado 2x pro loop de -50% ficar contínuo. */}
      <div
        aria-hidden
        className="relative z-10 overflow-hidden border-event-line border-y bg-event-accent py-2"
      >
        <div className="event-ticker-track flex w-max gap-8 whitespace-nowrap">
          {[0, 1].map((half) => (
            <span
              key={half}
              className="flex items-center gap-8 pr-8 font-display text-[13px] text-event-cream uppercase tracking-[0.08em]"
            >
              {TICKER_REPEAT_KEYS.map((key) => (
                <span key={key} className="flex items-center gap-8">
                  {album.name} <span>•</span> Galeria do evento <span>•</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <EventHero
        title={album.name}
        eyebrow={eyebrow}
        heroImageUrl={album.heroImageUrl}
        logoUrl={album.logoUrl}
        fallbackGradient={accent.gradient}
      />
      <main className="relative z-10 mx-auto -mt-14 w-full max-w-[620px] px-5 pb-24 sm:-mt-16 sm:px-6">
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
