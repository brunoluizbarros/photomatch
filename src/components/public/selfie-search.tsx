'use client';

import { searchPhotosBySelfiePublic } from '@/actions/public-search';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useRef, useState } from 'react';

type Result = Awaited<ReturnType<typeof searchPhotosBySelfiePublic>>;
type Step = 'consent' | 'capture' | 'results';

// Botão pílula e painel hairline do template editorial — mantidos como
// overrides de className em cima do Button/Card compartilhados (que o
// painel /admin usa sem essa skin), como no app-carneiros original.
const EVENT_BUTTON =
  'h-11 w-full rounded-full bg-event-accent text-event-cream shadow-none hover:opacity-90';
const EVENT_BUTTON_OUTLINE =
  'h-11 w-full rounded-full border-event-accent bg-transparent text-event-accent shadow-none hover:bg-event-accent/10';
const EVENT_PANEL =
  'mx-auto w-full max-w-[560px] rounded-[6px] border border-event-line bg-event-surface p-5';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SelfieSearch({ slug, welcomeMessage }: { slug: string; welcomeMessage: string }) {
  const [step, setStep] = useState<Step>('consent');
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const found = await searchPhotosBySelfiePublic(slug, base64);
      setResults(found);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível buscar suas fotos.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'consent') {
    return (
      <div className={EVENT_PANEL}>
        <p className="mb-4 text-event-text-soft text-sm">{welcomeMessage}</p>
        <div className="mb-4 flex items-start gap-2">
          <Checkbox id="consent" checked={consented} onCheckedChange={(v) => setConsented(!!v)} />
          <Label htmlFor="consent" className="font-normal text-event-text">
            Eu concordo em usar reconhecimento facial pra encontrar minhas fotos.
          </Label>
        </div>
        <Button className={EVENT_BUTTON} disabled={!consented} onClick={() => setStep('capture')}>
          Continuar
        </Button>
      </div>
    );
  }

  if (step === 'capture' || loading) {
    return (
      <div className={`${EVENT_PANEL} space-y-3 text-center`}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          className={EVENT_BUTTON}
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? 'Buscando suas fotos...' : 'Tirar selfie e buscar fotos'}
        </Button>
        {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-4">
      {results.length === 0 ? (
        <div className={`${EVENT_PANEL} text-center`}>
          <p className="mb-2 text-[32px] text-event-text-mute leading-none">·</p>
          <p className="text-event-text-soft text-sm">
            Não encontramos fotos suas ainda. A galeria é atualizada ao longo do evento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-5">
          {results.map((photo) => (
            <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
              <Image
                src={photo.url}
                alt="Foto do evento"
                width={300}
                height={300}
                className="aspect-square rounded-[10px] object-cover"
              />
            </a>
          ))}
        </div>
      )}
      <Button className={EVENT_BUTTON_OUTLINE} variant="outline" onClick={() => setStep('capture')}>
        Tirar outra selfie
      </Button>
    </div>
  );
}
