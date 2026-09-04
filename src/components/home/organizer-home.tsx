import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import {
  ArrowRight,
  BarChart3,
  QrCode,
  ScanFace,
  ShieldCheck,
  Smartphone,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';

// Mesmos valores de src/app/globals.css — ver comentário em
// home-experience.tsx sobre por que ficam duplicados aqui.
const INK = '#111827';
const ACCENT = '#7a1fe0';

const STEPS = [
  {
    n: '01',
    title: 'Crie o álbum',
    body: 'Nome, data e cor de destaque — o link e o QR code ficam prontos na hora.',
  },
  {
    n: '02',
    title: 'Suba as fotos',
    body: 'Upload direto ou importe de uma pasta do Google Drive/Dropbox.',
  },
  {
    n: '03',
    title: 'Divulgue o link',
    body: 'Cada convidado tira uma selfie e recebe só as fotos onde aparece.',
  },
];

const BENEFITS = [
  {
    icon: ScanFace,
    title: 'Reconhecimento facial automático',
    body: 'Cada convidado encontra as próprias fotos em segundos, sem vasculhar álbum por álbum.',
  },
  {
    icon: Smartphone,
    title: 'Sem app, sem senha',
    body: 'O convidado só precisa do link ou do QR code — nenhum cadastro pra ele fazer.',
  },
  {
    icon: ShieldCheck,
    title: 'Selfie nunca é salva',
    body: 'A busca usa a selfie só no momento da consulta — ela some assim que a busca termina.',
  },
  {
    icon: QrCode,
    title: 'QR code pronto',
    body: 'Gerado automaticamente pra cada evento, pronto pra imprimir e divulgar no local.',
  },
  {
    icon: UploadCloud,
    title: 'Importação em massa',
    body: 'Suba direto do computador ou importe de uma pasta do Google Drive/Dropbox.',
  },
  {
    icon: BarChart3,
    title: 'Analytics por evento',
    body: 'Veja visitas, buscas e taxa de sucesso de cada evento no painel.',
  },
];

const PLANS = [
  {
    name: 'Grátis',
    price: 'R$0',
    period: '/evento',
    features: ['1 evento ativo', 'Até 200 fotos', 'Busca por selfie', 'QR code'],
  },
  {
    name: 'Pro',
    price: 'R$99',
    period: '/evento',
    highlight: true,
    features: [
      'Eventos ilimitados',
      'Fotos ilimitadas',
      'Importação Drive/Dropbox',
      'Analytics completo',
    ],
  },
  {
    name: 'Empresas',
    price: 'Sob consulta',
    period: '',
    features: ['Múltiplos organizadores', 'Marca personalizada', 'Suporte prioritário'],
  },
];

export function OrganizerHome() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:py-16">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        {/* marca + proposta */}
        <div className="grid sm:grid-cols-2">
          <div
            className="flex flex-col justify-between gap-8 border-b p-6 sm:border-r sm:border-b-0 sm:p-10"
            style={{ borderColor: `${INK}26` }}
          >
            <div
              className="grid size-16 place-items-center rounded-full border-2"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              <ScanFace className="size-8" strokeWidth={1.5} />
            </div>
            <div>
              <div className="mb-3 h-1 w-16" style={{ background: INK }} />
              <p className="max-w-[30ch] text-[13px] leading-relaxed">
                Reconhecimento facial pra achar suas fotos de evento em segundos — sem procurar
                álbum por álbum.
              </p>
            </div>
          </div>
          <div className="relative flex items-center justify-center p-10 sm:p-12">
            <span
              aria-hidden
              className="absolute top-4 right-4 select-none font-display text-xl"
              style={{ color: ACCENT }}
            >
              *
            </span>
            <h1 className="font-display text-[15vw] uppercase leading-[0.85] tracking-[-0.01em] sm:text-[72px]">
              <span className="block">Photo</span>
              <span className="block" style={{ color: ACCENT }}>
                Match
              </span>
            </h1>
          </div>
        </div>

        {/* como funciona */}
        <div className="grid border-t sm:grid-cols-3" style={{ borderColor: `${INK}26` }}>
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={cn('p-6 sm:p-8', i > 0 && 'border-t sm:border-t-0 sm:border-l')}
              style={i > 0 ? { borderColor: `${INK}26` } : undefined}
            >
              <p className="mb-3 font-display text-2xl" style={{ color: ACCENT }}>
                {step.n}
              </p>
              <h2 className="mb-2 font-display text-lg uppercase">{step.title}</h2>
              <p className="text-[13px] leading-relaxed" style={{ color: `${INK}b3` }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="flex flex-col items-center gap-4 border-t p-6 text-center sm:flex-row sm:justify-between sm:p-8"
          style={{ borderColor: `${INK}26` }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: `${INK}99` }}>
            Sem app · sem cadastro pro convidado
          </p>
          <Button
            asChild
            variant="accent"
            className="h-12 rounded-full px-6 text-[13px] uppercase tracking-wide"
          >
            <Link href="/admin">
              Entrar como organizador
              <span className="grid size-6 place-items-center rounded-full bg-white/20">
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          </Button>
        </div>
      </div>

      {/* benefícios */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b p-6 sm:p-8" style={{ borderColor: `${INK}26` }}>
          <h2 className="font-display text-2xl uppercase">Por que usar o PhotoMatch</h2>
        </div>
        <div className="grid sm:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <div
              key={b.title}
              className={cn(
                'p-6 sm:p-8',
                i % 3 !== 0 && 'sm:border-l',
                i >= 3 && 'border-t',
                i > 0 && i % 3 === 0 && 'border-t',
              )}
              style={{ borderColor: `${INK}26` }}
            >
              <b.icon className="mb-3 size-6" style={{ color: ACCENT }} strokeWidth={1.5} />
              <h3 className="mb-1.5 font-display text-base uppercase">{b.title}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: `${INK}b3` }}>
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* planos */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="border-b p-6 sm:p-8" style={{ borderColor: `${INK}26` }}>
          <h2 className="font-display text-2xl uppercase">Planos</h2>
          <p className="mt-1 text-[13px] opacity-70">Comece grátis, cresça quando precisar.</p>
        </div>
        <div className="grid sm:grid-cols-3">
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              className={cn(
                'flex flex-col gap-4 p-6 sm:p-8',
                i > 0 && 'border-t sm:border-t-0 sm:border-l',
              )}
              style={{
                borderColor: `${INK}26`,
                background: plan.highlight ? INK : 'transparent',
                color: plan.highlight ? 'var(--primary-foreground)' : INK,
              }}
            >
              <h3 className="font-display text-lg uppercase">{plan.name}</h3>
              <p className="font-display text-3xl">
                {plan.price}
                <span className="text-sm opacity-60">{plan.period}</span>
              </p>
              <ul className="flex-1 space-y-1.5 text-[13px]">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span style={{ color: ACCENT }}>—</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlight ? 'accent' : 'outline'}
                className="rounded-full uppercase"
              >
                <Link href="/admin">Começar</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
