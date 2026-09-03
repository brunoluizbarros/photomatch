import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { ArrowRight, ScanFace } from 'lucide-react';
import Link from 'next/link';

// Cores fixas da marca PhotoMatch — não vêm do sistema de preset por álbum
// (essa página não pertence a nenhum evento), então ficam hardcoded aqui em
// vez de token global, já que é a única página que usa essa paleta.
const INK = '#2a2620';
const CREAM = '#f1ece3';
const ORANGE = '#e8491d';

const STEPS = [
  {
    n: '01',
    title: 'Peça o link',
    body: 'O organizador do evento compartilha o link ou o QR code da galeria com você.',
  },
  {
    n: '02',
    title: 'Tire uma selfie',
    body: 'Sem cadastro, sem senha. A selfie não é salva — só usada no momento da busca.',
  },
  {
    n: '03',
    title: 'Baixe suas fotos',
    body: 'O reconhecimento facial encontra todas as fotos onde você aparece, na hora.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh font-sans" style={{ background: CREAM, color: INK }}>
      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
        <div className="border-2" style={{ borderColor: INK }}>
          {/* marca + proposta */}
          <div className="grid sm:grid-cols-2">
            <div
              className="flex flex-col justify-between gap-8 border-b p-6 sm:border-r sm:border-b-0 sm:p-10"
              style={{ borderColor: `${INK}26` }}
            >
              <div
                className="grid size-16 place-items-center rounded-full border-2"
                style={{ borderColor: ORANGE, color: ORANGE }}
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
                style={{ color: ORANGE }}
              >
                *
              </span>
              <h1 className="font-display text-[15vw] uppercase leading-[0.85] tracking-[-0.01em] sm:text-[72px]">
                <span className="block">Photo</span>
                <span className="block" style={{ color: ORANGE }}>
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
                <p className="mb-3 font-display text-2xl" style={{ color: ORANGE }}>
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
              Sem app · sem cadastro · sem senha
            </p>
            <Button
              asChild
              className="h-12 rounded-full px-6 text-[13px] font-bold uppercase tracking-wide text-white hover:opacity-90"
              style={{ background: ORANGE }}
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
      </div>
    </div>
  );
}
