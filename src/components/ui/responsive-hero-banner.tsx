'use client';

import { type Variants, motion } from 'motion/react';
import { useState } from 'react';

interface NavLink {
  label: string;
  href: string;
  isActive?: boolean;
}

interface Partner {
  logoUrl: string;
  href: string;
}

interface ResponsiveHeroBannerProps {
  logoUrl?: string;
  backgroundImageUrl?: string;
  navLinks?: NavLink[];
  ctaButtonText?: string;
  ctaButtonHref?: string;
  badgeText?: string;
  badgeLabel?: string;
  title?: string;
  titleLine2?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  partnersTitle?: string;
  partners?: Partner[];
}

// Entrada em cascata do conteúdo (badge → título → descrição → botões →
// parceiros) — substitui as classes CSS animate-fade-slide-in-* do design
// original por motion, único disparo no mount (staggerChildren cuida da
// ordem, sem @keyframes nem CSS extra no globals.css compartilhado).
const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

// Título é o destaque da animação: cada palavra revela por conta própria,
// em vez do bloco inteiro entrando de uma vez — reforça "Journey Beyond
// Earth" linha a linha sem exigir uma lib de split-text à parte.
const wordVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function AnimatedTitleLine({ text }: { text: string }) {
  return (
    <motion.span
      variants={containerVariants}
      className="inline-flex flex-wrap justify-center gap-x-[0.28em]"
    >
      {text.split(' ').map((word, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: palavras do título são estáticas, ordem nunca muda
        <motion.span key={i} variants={wordVariants} className="inline-block">
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

function ResponsiveHeroBanner({
  logoUrl = 'https://cdn.21st.dev/assets/mirror/c4/c4d5f159140e3ccc35a8bd4f043453cb9e2692f700206e43855ff598c171b924.png',
  backgroundImageUrl = 'https://cdn.21st.dev/assets/mirror/a8/a8cf38f65f7315f95eba8c803c4a80a9d78cb2ea36fbfee49828396e4a0b9737.jpg',
  navLinks = [
    { label: 'Home', href: '#', isActive: true },
    { label: 'Missions', href: '#' },
    { label: 'Destinations', href: '#' },
    { label: 'Technology', href: '#' },
    { label: 'Book Flight', href: '#' },
  ],
  ctaButtonText = 'Reserve Seat',
  ctaButtonHref = '#',
  badgeLabel = 'New',
  badgeText = 'First Commercial Flight to Mars 2026',
  title = 'Journey Beyond Earth',
  titleLine2 = 'Into the Cosmos',
  description = 'Experience the cosmos like never before. Our advanced spacecraft and cutting-edge technology make interplanetary travel accessible, safe, and unforgettable.',
  primaryButtonText = 'Book Your Journey',
  primaryButtonHref = '#',
  secondaryButtonText = 'Watch Launch',
  secondaryButtonHref = '#',
  partnersTitle = 'Partnering with leading space agencies worldwide',
  partners = [
    {
      logoUrl:
        'https://cdn.21st.dev/assets/mirror/96/964eca0b0415aebc2718799b530b39d6f552b39634f3fb2072e769df17c6668f.png',
      href: '#',
    },
    {
      logoUrl:
        'https://cdn.21st.dev/assets/mirror/90/900ad16bdb8bd723836996d2283c47420e719ba8c9a4f7d24ff67e59056e88fe.png',
      href: '#',
    },
    {
      logoUrl:
        'https://cdn.21st.dev/assets/mirror/1b/1b66b155997cb81da3bdabeb8da22771b07f4ac5273d6a19d629c77cf75a861f.png',
      href: '#',
    },
    {
      logoUrl:
        'https://cdn.21st.dev/assets/mirror/cb/cb112906d9fa8a57380201b1385c5534075020542dab48d5f29f2e35a3e19bc1.png',
      href: '#',
    },
    {
      logoUrl:
        'https://cdn.21st.dev/assets/mirror/f6/f68e2933c2f24ef4b28fb81328350831eb56bf42244dee50e2b7f6efd7497783.png',
      href: '#',
    },
  ],
}: ResponsiveHeroBannerProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden">
      {/* Ken Burns sutil, um disparo só (sem loop) — mesmo espírito do
          EventHero (src/components/public/event-hero.tsx), aqui via motion
          em vez de @keyframes CSS. */}
      <motion.img
        src={backgroundImageUrl}
        alt=""
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 9, ease: 'easeOut' }}
        className="absolute top-0 right-0 bottom-0 left-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-black/30" />

      <header className="relative z-10 xl:top-4">
        <div className="mx-6">
          <div className="flex items-center justify-between pt-4">
            <a
              href="/"
              className="inline-flex h-[40px] w-[100px] items-center justify-center rounded bg-cover bg-center"
              style={{ backgroundImage: `url(${logoUrl})` }}
            >
              <span className="sr-only">Home</span>
            </a>

            <nav className="hidden items-center gap-2 md:flex">
              <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`px-3 py-2 font-sans text-sm font-medium transition-colors hover:text-white ${
                      link.isActive ? 'text-white/90' : 'text-white/80'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href={ctaButtonHref}
                  className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 font-sans text-sm font-medium text-neutral-900 transition-colors hover:bg-white/90"
                >
                  {ctaButtonText}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                </a>
              </div>
            </nav>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-white/90"
                aria-hidden="true"
              >
                <path d="M4 5h16" />
                <path d="M4 12h16" />
                <path d="M4 19h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-7xl px-6 pt-28 pb-16 sm:pt-28 md:pt-32 lg:pt-40"
        >
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              variants={fadeSlideUp}
              className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur"
            >
              <span className="inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 font-sans text-xs font-medium text-neutral-900">
                {badgeLabel}
              </span>
              <span className="font-sans text-sm font-medium text-white/90">{badgeText}</span>
            </motion.div>

            <h1 className="flex flex-col text-4xl leading-tight font-serif font-normal tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              <AnimatedTitleLine text={title} />
              <AnimatedTitleLine text={titleLine2} />
            </h1>

            <motion.p
              variants={fadeSlideUp}
              className="mx-auto mt-6 max-w-2xl text-base text-white/80 sm:text-lg"
            >
              {description}
            </motion.p>

            <motion.div
              variants={fadeSlideUp}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            >
              <a
                href={primaryButtonHref}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 font-sans text-sm font-medium text-white ring-1 ring-white/15 transition-colors hover:bg-white/15"
              >
                {primaryButtonText}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a
                href={secondaryButtonHref}
                className="inline-flex items-center gap-2 rounded-full bg-transparent px-5 py-3 font-sans text-sm font-medium text-white/90 transition-colors hover:text-white"
              >
                {secondaryButtonText}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                </svg>
              </a>
            </motion.div>
          </div>

          <motion.div variants={fadeSlideUp} className="mx-auto mt-20 max-w-5xl">
            <p className="text-center text-sm text-white/70">{partnersTitle}</p>
            <div className="mt-6 grid grid-cols-2 items-center justify-items-center gap-4 text-white/70 sm:grid-cols-3 md:grid-cols-5">
              {partners.map((partner, i) => (
                <a
                  key={partner.logoUrl}
                  href={partner.href}
                  className="inline-flex h-[36px] w-[120px] items-center justify-center rounded-full bg-cover bg-center opacity-80 transition-opacity hover:opacity-100"
                  style={{ backgroundImage: `url(${partner.logoUrl})` }}
                >
                  <span className="sr-only">Parceiro {i + 1}</span>
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default ResponsiveHeroBanner;
