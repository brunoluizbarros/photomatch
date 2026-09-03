'use client';

import { searchPhotosBySelfiePublic } from '@/actions/public-search';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getDeviceId } from '@/lib/analytics/device-id';
import { cn } from '@/lib/utils/cn';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Expand,
  ImageOff,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type Result = Awaited<ReturnType<typeof searchPhotosBySelfiePublic>>;

const STEPS = ['consent', 'capture', 'results'] as const;
type Step = (typeof STEPS)[number];

// Chaves fixas pro grid de skeleton (sempre 6 blocos, nunca reordena) — só
// pra não usar índice de array como key.
const SKELETON_TILES = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'];

// Botão pílula e painel do template editorial — mantidos como overrides de
// className em cima do Button/Checkbox/Label compartilhados (que o painel
// /admin usa sem essa skin), como no port original do app-carneiros.
const EVENT_BUTTON =
  'h-12 w-full rounded-full bg-event-accent text-[15px] text-event-cream shadow-[0_12px_32px_-14px_rgba(20,16,10,0.55)] transition-[opacity,transform] hover:opacity-90 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-event-accent focus-visible:ring-offset-2 focus-visible:ring-offset-event-surface';
const EVENT_BUTTON_OUTLINE =
  'h-12 w-full rounded-full border-event-accent bg-transparent text-[15px] text-event-accent shadow-none transition-colors hover:bg-event-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-event-accent focus-visible:ring-offset-2 focus-visible:ring-offset-event-surface';
const EVENT_PANEL =
  'rounded-[14px] border border-event-line bg-event-surface p-6 shadow-[0_24px_60px_-32px_rgba(20,16,10,0.55)] sm:p-7';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Indicador de passo — porta do padrão dots/dotActive do AgoraScreen
// (mobile-carneiros). Fica fora do wrapper com key= de propósito: transiciona
// entre estados em vez de remontar junto com o conteúdo.
function StepDots({ step }: { step: Step }) {
  const active = STEPS.indexOf(step);
  return (
    <div aria-hidden className="mb-5 flex items-center justify-center gap-1.5">
      {STEPS.map((s, i) => (
        <span
          key={s}
          className={cn(
            'h-[5px] rounded-full transition-all duration-500',
            i === active ? 'w-5 bg-event-accent' : 'w-[5px] bg-event-text-mute/50',
          )}
        />
      ))}
    </div>
  );
}

// Visualizador em tela cheia — abre por cima do fluxo em vez de navegar pra
// outra página/aba. Fecha com Escape, clique no fundo, ou no X; setas do
// teclado (ou os botões) andam entre as fotos do resultado.
function PhotoModal({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Result;
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, photos.length, onClose, onNavigate]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: fechar no clique do fundo é reforço do botão X e do Escape, não a única forma de fechar
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Fechar"
      >
        <X className="size-5" />
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index - 1);
          }}
          className="absolute left-2 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index + 1);
          }}
          className="absolute right-2 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
          aria-label="Próxima foto"
        >
          <ChevronRight className="size-5" />
        </button>
      )}

      <img
        src={photos[index].url}
        alt="Foto do evento"
        className="max-h-[85svh] max-w-[92vw] rounded-[10px] object-contain"
      />
    </div>
  );
}

export function SelfieSearch({ slug, welcomeMessage }: { slug: string; welcomeMessage: string }) {
  const [step, setStep] = useState<Step>('consent');
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const found = await searchPhotosBySelfiePublic(slug, base64, getDeviceId());
      setResults(found);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível buscar suas fotos.');
    } finally {
      setLoading(false);
    }
  }

  // "loading" é uma view própria em vez de sobrepor o rótulo do botão de
  // "capture" — dá uma tela de espera de verdade (skeleton) em vez de só
  // trocar o texto do botão.
  const view = loading ? 'loading' : step;

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <StepDots step={step} />
      {/* A troca de key= remonta o painel e a animação CSS (event-rise /
          event-stagger) toca de novo sozinha — é todo o motor de transição
          entre passos, sem useEffect nem lib de animação. */}
      <div key={view}>
        {view === 'consent' && (
          <div className={cn(EVENT_PANEL, 'event-stagger')}>
            <div className="mt-0 flex items-center gap-1.5 text-[10.5px] text-event-accent uppercase tracking-[0.18em]">
              <ShieldCheck className="size-4" strokeWidth={1.75} />
              <span>Privacidade</span>
            </div>
            <h2 className="mt-3 font-display font-semibold text-[26px] text-event-text leading-[1.05] tracking-[-0.01em]">
              Encontre suas fotos
            </h2>
            <p className="mt-2 text-[15px] text-event-text-soft leading-relaxed">
              {welcomeMessage}
            </p>
            <Label
              htmlFor="consent"
              className="mt-4 flex cursor-pointer items-start gap-3 rounded-[10px] border border-event-line bg-event-surface-2/60 p-3.5 font-normal text-[13.5px] text-event-text transition-colors hover:border-event-accent/40"
            >
              <Checkbox
                id="consent"
                checked={consented}
                onCheckedChange={(v) => setConsented(!!v)}
                className="mt-0.5 border-event-line data-[state=checked]:border-event-accent data-[state=checked]:bg-event-accent data-[state=checked]:text-event-cream"
              />
              Eu concordo em usar reconhecimento facial pra encontrar minhas fotos.
            </Label>
            <Button
              className={cn(EVENT_BUTTON, 'mt-4')}
              disabled={!consented}
              onClick={() => setStep('capture')}
            >
              Continuar
            </Button>
          </div>
        )}

        {view === 'capture' && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="user"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className={cn(EVENT_PANEL, 'event-stagger text-center')}>
              <div className="mt-0 mx-auto grid size-14 place-items-center rounded-full border border-event-accent/30 bg-event-accent/10 text-event-accent">
                <Camera className="size-6" strokeWidth={1.5} />
              </div>
              <h2 className="mt-4 font-display font-semibold text-[26px] text-event-text leading-[1.05] tracking-[-0.01em]">
                Hora da selfie
              </h2>
              <p className="mt-2 text-[14px] text-event-text-soft">
                Enquadre o rosto com boa luz. A selfie não é salva — some assim que a busca termina.
              </p>
              <Button
                className={cn(EVENT_BUTTON, 'mt-4')}
                onClick={() => inputRef.current?.click()}
              >
                <Camera className="size-4" />
                Tirar selfie e buscar fotos
              </Button>
              {error && (
                <p className="mt-4 rounded-[8px] border border-[var(--destructive)]/25 bg-[var(--destructive)]/10 px-3 py-2 text-[var(--destructive)] text-sm">
                  {error}
                </p>
              )}
            </div>
          </>
        )}

        {view === 'loading' && (
          <div className={cn(EVENT_PANEL, 'event-stagger text-center')}>
            <div className="mt-0 mx-auto grid size-14 place-items-center rounded-full border border-event-accent/30 bg-event-accent/10 text-event-accent">
              <Loader2 className="size-6 animate-spin" strokeWidth={1.5} />
            </div>
            <p className="mt-4 font-display font-semibold text-[22px] text-event-text">
              Procurando você nas fotos…
            </p>
            <p className="mt-1.5 text-[13px] text-event-text-mute">Isso leva alguns segundos.</p>
            <div className="mt-5 grid grid-cols-3 gap-1.5">
              {SKELETON_TILES.map((key, i) => (
                <div
                  key={key}
                  className="aspect-square animate-pulse rounded-[10px] bg-event-surface-2"
                  style={{ animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {view === 'results' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <h2 className="font-display font-semibold text-[24px] text-event-text">
                {results.length === 0
                  ? 'Nada ainda'
                  : `${results.length} ${results.length === 1 ? 'foto encontrada' : 'fotos encontradas'}`}
              </h2>
              {results.length > 0 && (
                <span className="text-[11px] text-event-text-mute uppercase tracking-[0.16em]">
                  Toque para ampliar
                </span>
              )}
            </div>
            <p aria-live="polite" className="sr-only">
              {results.length === 0
                ? 'Nada ainda'
                : `${results.length} ${results.length === 1 ? 'foto encontrada' : 'fotos encontradas'}`}
            </p>

            {results.length === 0 ? (
              <div
                className={cn(EVENT_PANEL, 'flex flex-col items-center gap-3 py-10 text-center')}
              >
                <ImageOff className="size-6 text-event-text-mute" strokeWidth={1.5} />
                <p className="max-w-[38ch] text-event-text-soft text-sm">
                  Não encontramos fotos suas ainda. A galeria é atualizada ao longo do evento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {results.map((photo, i) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    className="event-rise group relative block overflow-hidden rounded-[10px] bg-event-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-event-accent"
                    style={{ animationDelay: `${Math.min(i, 14) * 45}ms` }}
                  >
                    <Image
                      src={photo.url}
                      alt="Foto do evento"
                      width={300}
                      height={300}
                      className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(12,10,6,0.55))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <Expand className="pointer-events-none absolute right-2 bottom-2 size-4 text-event-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}

            <div className="border-event-line border-t pt-5">
              <Button
                variant="outline"
                className={EVENT_BUTTON_OUTLINE}
                onClick={() => setStep('capture')}
              >
                <Camera className="size-4" />
                Tirar outra selfie
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedIndex !== null && (
        <PhotoModal
          photos={results}
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </div>
  );
}
