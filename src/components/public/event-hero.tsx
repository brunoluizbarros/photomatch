// Hero full-bleed portado do PhotoAlbumHero do app-carneiros: foto de fundo,
// dois scrims verticais, logo no canto superior esquerdo, eyebrow + título
// serifado no rodapé. Título/eyebrow sempre em cores claras — garante
// contraste sobre a foto tanto de dia quanto à noite.
export function EventHero({
  title,
  eyebrow,
  heroImageUrl,
  logoUrl,
}: {
  title: string;
  eyebrow: string;
  heroImageUrl: string | null;
  logoUrl: string | null;
}) {
  return (
    <section className="relative isolate h-[220px] w-full overflow-hidden bg-[#1b1f0f] sm:h-[280px]">
      {heroImageUrl ? (
        // Domínio arbitrário definido pelo admin — next/image exigiria estar
        // em remotePatterns, então usamos <img> puro aqui.
        <img src={heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, var(--event-accent) 0%, var(--event-olive-deep) 100%)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,6,0.45)_0%,transparent_22%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_62%,rgba(12,10,6,0.60)_100%)]" />

      {logoUrl && (
        <div className="absolute top-4 left-[22px]">
          <img src={logoUrl} alt="" className="h-7 w-auto" />
        </div>
      )}

      <div className="absolute right-[22px] bottom-5 left-[22px]">
        <p className="mb-1.5 font-semibold text-[10.5px] text-event-accent uppercase tracking-[0.2em]">
          {eyebrow}
        </p>
        <h1 className="font-display text-[32px] text-event-cream leading-[34px] tracking-[-0.26px]">
          {title}
        </h1>
      </div>
    </section>
  );
}
