'use client';

import type { CartItemInput } from '@/actions/orders';
import { getPhotoDownloadUrl, searchPhotosBySelfiePublic } from '@/actions/public-search';
import { CartBar } from '@/components/public/cart-bar';
import { CheckoutDialog } from '@/components/public/checkout-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getDeviceId } from '@/lib/analytics/device-id';
import { type Plan, quoteCart } from '@/lib/pricing';
import { cn } from '@/lib/utils/cn';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  ImageOff,
  Loader2,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type SearchResult = Awaited<ReturnType<typeof searchPhotosBySelfiePublic>>;
type Result = Extract<SearchResult, { ok: true }>['photos'];

const STEPS = ['consent', 'capture', 'results'] as const;
type Step = (typeof STEPS)[number];

// Mesmo teto do servidor (src/actions/public-search.ts) — mantido em sincronia
// só pra travar o botão "Adicionar" na UI antes de gastar uma chamada.
const MAX_SELFIES = 3;

type Selfie = { base64: string; previewUrl: string };

export type SalesConfig = {
  plans: Plan[];
};

type CartEntry = { digital: boolean; print: boolean };
type Cart = Record<string, CartEntry>;

// Reset entre pessoas no totem: fecha o carrinho de quem acabou de sair sem
// esperar clique — sem isso, a próxima pessoa herdaria o carrinho e os dados
// de checkout de quem usou antes. Só roda quando há venda ligada (é o único
// modo que acumula estado sensível pra limpar).
const INACTIVITY_RESET_MS = 3 * 60 * 1000;

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
  slug,
  accessToken,
  photos,
  index,
  sales,
  cart,
  onToggleCart,
  onClose,
  onNavigate,
}: {
  slug: string;
  accessToken: string | null;
  photos: Result;
  index: number;
  sales: SalesConfig | null;
  cart: Cart;
  onToggleCart: (photoId: string, kind: 'digital' | 'print') => void;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [broken, setBroken] = useState(false);
  const photoId = photos[index].id;
  const entry = cart[photoId];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, photos.length, onClose, onNavigate]);

  // A troca de foto reseta o estado de "imagem quebrada" — cada URL
  // presignada tem sua própria chance.
  // biome-ignore lint/correctness/useExhaustiveDependencies: setBroken é estável (setState), o efeito só precisa rodar de novo quando o index muda
  useEffect(() => setBroken(false), [index]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const result = await getPhotoDownloadUrl(slug, photos[index].id, accessToken);
      if (result.ok) window.location.assign(result.url);
    } finally {
      setDownloading(false);
    }
  }

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

      {broken ? (
        <div className="flex flex-col items-center gap-2 text-white">
          <ImageOff className="size-8" strokeWidth={1.5} />
          <p className="text-sm">Essa foto expirou. Recarregue a página.</p>
        </div>
      ) : (
        <img
          src={photos[index].url}
          alt="Foto do evento"
          onError={() => setBroken(true)}
          className="max-h-[85svh] max-w-[92vw] rounded-[10px] object-contain"
        />
      )}

      {sales ? (
        // biome-ignore lint/a11y/useKeyWithClickEvents: só barra o clique subir pro backdrop (que fecharia o modal) — os botões dentro já são navegáveis/acionáveis por teclado
        <div className="absolute bottom-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onToggleCart(photoId, 'digital')}
            className={cn(
              'flex h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors',
              entry?.digital
                ? 'bg-event-accent text-event-cream'
                : 'bg-white/10 text-white hover:bg-white/20',
            )}
          >
            {entry?.digital ? <Check className="size-4" /> : <Download className="size-4" />}
            Digital
          </button>
          <button
            type="button"
            onClick={() => onToggleCart(photoId, 'print')}
            className={cn(
              'flex h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors',
              entry?.print
                ? 'bg-event-accent text-event-cream'
                : 'bg-white/10 text-white hover:bg-white/20',
            )}
          >
            {entry?.print ? <Check className="size-4" /> : <Printer className="size-4" />}
            Impressa
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          disabled={broken || downloading}
          className="absolute bottom-4 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          aria-label="Baixar foto"
        >
          {downloading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Download className="size-5" />
          )}
        </button>
      )}
    </div>
  );
}

export function SelfieSearch({
  slug,
  welcomeMessage,
  sales = null,
  accessToken = null,
}: {
  slug: string;
  welcomeMessage: string;
  sales?: SalesConfig | null;
  // Token pessoal do link enviado na aprovação de pedido de acesso — só
  // existe (e só é necessário) pra evento privado (events.isPublic=false).
  // Repassado em toda action que toca o evento (busca, download, checkout):
  // são endpoints de rede chamáveis direto, não só gateados pela renderização
  // da página (ver src/app/e/[slug]/page.tsx e src/actions/access-requests.ts).
  accessToken?: string | null;
}) {
  const [step, setStep] = useState<Step>('consent');
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [results, setResults] = useState<Result>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Presigned URL expira em 1h — quem deixa a aba aberta vê tiles quebrados
  // sem isso. Guarda quais IDs falharam pra trocar por um estado explícito.
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAddFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const base64 = await fileToBase64(file);
    setSelfies((prev) =>
      [...prev, { base64, previewUrl: URL.createObjectURL(file) }].slice(0, MAX_SELFIES),
    );
  }

  function removeSelfie(index: number) {
    setSelfies((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSearch() {
    if (selfies.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const found = await searchPhotosBySelfiePublic(
        slug,
        selfies.map((s) => s.base64),
        getDeviceId(),
        accessToken,
      );
      if (!found.ok) {
        setError(found.error);
        return;
      }
      setResults(found.photos);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível buscar suas fotos.');
    } finally {
      setLoading(false);
    }
  }

  function backToCapture() {
    for (const selfie of selfies) URL.revokeObjectURL(selfie.previewUrl);
    setSelfies([]);
    setStep('capture');
  }

  // Reset completo pra próxima pessoa no totem — some com selfies, resultados,
  // carrinho e volta pro consentimento. Usado depois de um pedido concluído e
  // pelo timeout de inatividade (ambos abaixo).
  function resetAll() {
    for (const selfie of selfies) URL.revokeObjectURL(selfie.previewUrl);
    setSelfies([]);
    setResults([]);
    setCart({});
    setSelectedIndex(null);
    setCheckoutOpen(false);
    setConsented(false);
    setError(null);
    setStep('consent');
  }

  function toggleCartItem(photoId: string, kind: 'digital' | 'print') {
    setCart((prev) => {
      const current = prev[photoId] ?? { digital: false, print: false };
      const next = { ...current, [kind]: !current[kind] };
      const updated = { ...prev };
      if (!next.digital && !next.print) {
        delete updated[photoId];
      } else {
        updated[photoId] = next;
      }
      return updated;
    });
  }

  const cartItems: CartItemInput[] = Object.entries(cart).map(([photoId, entry]) => ({
    photoId,
    digital: entry.digital,
    print: entry.print,
  }));
  const digitalCount = cartItems.filter((i) => i.digital).length;
  const printCount = cartItems.filter((i) => i.print).length;
  // Sempre calculado (nunca null) pra não precisar de fallback nos
  // componentes — quando sales é null, CartBar/CheckoutDialog simplesmente
  // não renderizam, então os valores default (sem planos/preço) nunca aparecem.
  const quote = quoteCart({ digitalCount, printCount, plans: sales?.plans ?? [] });

  // Totem compartilhado: se ninguém mexer por um tempo com o carrinho aberto,
  // limpa tudo sozinho — sem isso a próxima pessoa herdaria o carrinho e o
  // link de pedido de quem usou antes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetAll/backToCapture recriam a cada render (fecham sobre estado), incluí-las reiniciaria o timer a cada tecla
  useEffect(() => {
    if (!sales || step !== 'results') return;
    let timer = setTimeout(resetAll, INACTIVITY_RESET_MS);
    function bump() {
      clearTimeout(timer);
      timer = setTimeout(resetAll, INACTIVITY_RESET_MS);
    }
    window.addEventListener('pointerdown', bump);
    window.addEventListener('keydown', bump);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', bump);
      window.removeEventListener('keydown', bump);
    };
  }, [sales, step]);

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
              onChange={(e) => {
                handleAddFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <div className={cn(EVENT_PANEL, 'event-stagger text-center')}>
              <div className="mt-0 mx-auto grid size-14 place-items-center rounded-full border border-event-accent/30 bg-event-accent/10 text-event-accent">
                <Camera className="size-6" strokeWidth={1.5} />
              </div>
              <h2 className="mt-4 font-display font-semibold text-[26px] text-event-text leading-[1.05] tracking-[-0.01em]">
                Hora da selfie
              </h2>
              <p className="mt-2 text-[14px] text-event-text-soft">
                {selfies.length === 0
                  ? 'Enquadre o rosto com boa luz. A selfie não é salva — some assim que a busca termina.'
                  : `Buscando por ${selfies.length} ${selfies.length === 1 ? 'pessoa' : 'pessoas'}. Adicione mais alguém do grupo, se quiser.`}
              </p>

              {selfies.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {selfies.map((selfie, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: lista muda só por push/remove no fim, ordem estável
                    <div key={i} className="group relative size-16 overflow-hidden rounded-[10px]">
                      <img
                        src={selfie.previewUrl}
                        alt={`Selfie ${i + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeSelfie(i)}
                        className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remover selfie"
                      >
                        <Trash2 className="size-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                {selfies.length < MAX_SELFIES && (
                  <Button
                    variant={selfies.length === 0 ? 'default' : 'outline'}
                    className={selfies.length === 0 ? EVENT_BUTTON : EVENT_BUTTON_OUTLINE}
                    onClick={() => inputRef.current?.click()}
                  >
                    {selfies.length === 0 ? (
                      <Camera className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {selfies.length === 0 ? 'Tirar selfie' : 'Adicionar outra pessoa'}
                  </Button>
                )}
                {selfies.length > 0 && (
                  <Button className={EVENT_BUTTON} onClick={handleSearch}>
                    Buscar fotos
                  </Button>
                )}
              </div>

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
                    {brokenIds.has(photo.id) ? (
                      <div className="grid aspect-square w-full place-items-center bg-event-surface-2">
                        <ImageOff className="size-5 text-event-text-mute" strokeWidth={1.5} />
                      </div>
                    ) : (
                      <Image
                        src={photo.url}
                        alt="Foto do evento"
                        width={300}
                        height={300}
                        onError={() => setBrokenIds((prev) => new Set(prev).add(photo.id))}
                        className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      />
                    )}
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(12,10,6,0.55))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <Expand className="pointer-events-none absolute right-2 bottom-2 size-4 text-event-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {(cart[photo.id]?.digital || cart[photo.id]?.print) && (
                      <span className="absolute top-2 left-2 flex gap-1">
                        {cart[photo.id]?.digital && (
                          <span className="grid size-6 place-items-center rounded-full bg-event-accent text-event-cream">
                            <Download className="size-3.5" />
                          </span>
                        )}
                        {cart[photo.id]?.print && (
                          <span className="grid size-6 place-items-center rounded-full bg-event-accent text-event-cream">
                            <Printer className="size-3.5" />
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {sales && (
              <CartBar
                digitalCount={digitalCount}
                printCount={printCount}
                quote={quote}
                onCheckout={() => setCheckoutOpen(true)}
              />
            )}

            <div className="flex flex-wrap gap-3 border-event-line border-t pt-5">
              <Button variant="outline" className={EVENT_BUTTON_OUTLINE} onClick={backToCapture}>
                <Camera className="size-4" />
                Tirar outra selfie
              </Button>
              {sales && (
                <Button variant="outline" className={EVENT_BUTTON_OUTLINE} onClick={resetAll}>
                  Concluir / próxima pessoa
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedIndex !== null && (
        <PhotoModal
          slug={slug}
          accessToken={accessToken}
          photos={results}
          index={selectedIndex}
          sales={sales}
          cart={cart}
          onToggleCart={toggleCartItem}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}

      {sales && (
        <CheckoutDialog
          open={checkoutOpen}
          slug={slug}
          accessToken={accessToken}
          items={cartItems}
          quote={quote}
          onClose={() => setCheckoutOpen(false)}
          onDone={resetAll}
        />
      )}
    </div>
  );
}
