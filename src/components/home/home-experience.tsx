'use client';

import { GuestHome } from '@/components/home/guest-home';
import { OrganizerHome } from '@/components/home/organizer-home';
import { Camera, Megaphone, ScanFace } from 'lucide-react';
import { useEffect, useState } from 'react';

// Mesmos valores de src/app/globals.css (--foreground/--background/--accent)
// — duplicados aqui porque o mecanismo de opacidade por sufixo hex (${INK}26)
// só funciona com um literal de 6 dígitos, não com var(--x). Consolidar isso
// num único lugar é um refactor à parte; os valores têm que ser mantidos
// em sincronia manualmente até lá.
const INK = '#111827';
const CREAM = '#f7f7f8';
const ACCENT = '#7a1fe0';
const STORAGE_KEY = 'pm_persona';

type Persona = 'guest' | 'organizer';

function isPersona(value: string | null): value is Persona {
  return value === 'guest' || value === 'organizer';
}

function readPersona(): Persona | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isPersona(stored) ? stored : null;
  } catch {
    return null;
  }
}

function savePersona(persona: Persona) {
  try {
    localStorage.setItem(STORAGE_KEY, persona);
  } catch {
    // ponytail: storage bloqueado — a escolha só dura a sessão da aba atual.
  }
}

// Pergunta em tela cheia antes de qualquer conteúdo: convidado (achar
// fotos) ou organizador (usar a ferramenta pro próprio evento). A escolha
// fica salva no navegador; um seletor no topo deixa trocar quando quiser.
export function HomeExperience() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPersona(readPersona());
    setReady(true);
  }, []);

  function choose(next: Persona) {
    savePersona(next);
    setPersona(next);
  }

  // Evita flash: só decide o que mostrar depois de checar o localStorage.
  if (!ready) return null;

  if (!persona) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-5 py-10 font-sans"
        style={{ background: CREAM, color: INK }}
      >
        <ScanFace className="mb-6 size-10" strokeWidth={1.5} style={{ color: ACCENT }} />
        <h1 className="mb-2 text-center font-display text-3xl uppercase sm:text-4xl">
          Photo<span style={{ color: ACCENT }}>Match</span>
        </h1>
        <p className="mb-10 max-w-[38ch] text-center text-[14px] leading-relaxed opacity-70">
          Reconhecimento facial pra achar fotos de evento em segundos.
        </p>
        <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose('guest')}
            className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <Camera className="size-8" strokeWidth={1.5} />
            <span className="font-display text-lg uppercase">Sou convidado</span>
            <span className="text-[13px] opacity-70">
              Fui num evento e quero achar minhas fotos
            </span>
          </button>
          <button
            type="button"
            onClick={() => choose('organizer')}
            className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center text-white shadow-sm transition-transform hover:-translate-y-0.5"
            style={{ background: INK }}
          >
            <Megaphone className="size-8" strokeWidth={1.5} />
            <span className="font-display text-lg uppercase">Sou organizador</span>
            <span className="text-[13px] opacity-70">Quero usar a ferramenta no meu evento</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh font-sans" style={{ background: CREAM, color: INK }}>
      <div
        className="sticky top-0 z-10 flex items-center justify-center gap-1 border-b py-2"
        style={{ background: CREAM, borderColor: `${INK}26` }}
      >
        {(['guest', 'organizer'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => choose(p)}
            className="rounded-full px-3 py-1 font-display text-[11px] uppercase tracking-wide transition-colors"
            style={
              persona === p
                ? { background: INK, color: CREAM }
                : { background: 'transparent', color: `${INK}99` }
            }
          >
            {p === 'guest' ? 'Sou convidado' : 'Sou organizador'}
          </button>
        ))}
      </div>
      {persona === 'guest' ? <GuestHome /> : <OrganizerHome />}
    </div>
  );
}
