// Hero cinematográfico portado do PhotoAlbumHero do app-carneiros, com Ken
// Burns sutil (one-shot, não em loop — evita compositor rodando pra sempre
// no celular do convidado) e vinheta/scrim em 3 paradas pra profundidade
// sem depender de textura extra. Título/eyebrow sempre em cores claras —
// garante contraste sobre a foto tanto de dia quanto à noite.
export function EventHero({
  title,
  eyebrow,
  heroImageUrl,
  logoUrl,
  fallbackGradient,
}: {
  title: string;
  eyebrow: string;
  heroImageUrl: string | null;
  logoUrl: string | null;
  fallbackGradient: string;
}) {
  return (
    <section className="relative isolate h-[52svh] max-h-[520px] min-h-[340px] w-full overflow-hidden bg-[#1b1f0f] sm:h-[60svh] sm:max-h-[620px]">
      {heroImageUrl ? (
        // Domínio arbitrário definido pelo admin — next/image exigiria estar
        // em remotePatterns, então usamos <img> puro aqui.
        <img
          src={heroImageUrl}
          alt=""
          className="event-kenburns absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="event-kenburns absolute inset-0" style={{ background: fallbackGradient }} />
      )}

      {/* scrim topo — legibilidade do logo */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,6,0.50)_0%,transparent_26%)]" />
      {/* vinheta — profundidade sem textura/imagem extra */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_75%_at_50%_38%,transparent_35%,rgba(12,10,6,0.42)_100%)]" />
      {/* scrim base em 3 paradas — o card do fluxo de busca sobrepõe esta borda (ver page.tsx) */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(12,10,6,0.55)_74%,rgba(12,10,6,0.88)_100%)]" />

      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="event-rise absolute top-5 left-[22px] h-8 w-auto drop-shadow-[0_2px_12px_rgba(12,10,6,0.6)] sm:left-8"
        />
      )}

      <div className="absolute right-[22px] bottom-20 left-[22px] sm:right-8 sm:bottom-28 sm:left-8">
        <div className="event-rise mb-4 h-px w-10 bg-event-accent [animation-delay:80ms]" />
        <p className="event-rise mb-2.5 font-semibold text-[10.5px] text-event-cream/80 uppercase tracking-[0.24em] [animation-delay:140ms]">
          {eyebrow}
        </p>
        <h1 className="event-rise max-w-[16ch] text-balance font-display font-semibold text-[clamp(34px,8.5vw,62px)] text-event-cream leading-[0.94] tracking-[-0.02em] [animation-delay:200ms] [text-shadow:0_2px_28px_rgba(12,10,6,0.45)]">
          {title}
        </h1>
      </div>
    </section>
  );
}
