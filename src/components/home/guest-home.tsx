'use client';

import { requestEventAccess, searchPublishedEventsByName } from '@/actions/access-requests';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Search } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

const INK = '#2a2620';
const ORANGE = '#e8491d';

type SearchResult = Awaited<ReturnType<typeof searchPublishedEventsByName>>[number];

function RequestForm({ event, onSent }: { event: SearchResult; onSent: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setLoading(true);
    setError(null);
    const result = await requestEventAccess({ eventId: event.id, name, email, phone });
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    onSent();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-2 p-5" style={{ borderColor: INK }}>
      <p className="font-display text-lg uppercase">{event.name}</p>
      <div className="space-y-1">
        <Label htmlFor="guest-name">Seu nome</Label>
        <Input id="guest-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="guest-email">E-mail</Label>
        <Input
          id="guest-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="guest-phone">WhatsApp</Label>
        <Input
          id="guest-phone"
          type="tel"
          required
          placeholder="(11) 91234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <Label
        htmlFor="guest-consent"
        className="flex cursor-pointer items-start gap-2.5 text-[13px]"
      >
        <Checkbox
          id="guest-consent"
          checked={consented}
          onCheckedChange={(v) => setConsented(!!v)}
          className="mt-0.5"
          required
        />
        Autorizo o organizador do evento a entrar em contato comigo por e-mail e WhatsApp.
      </Label>
      {error && (
        <p className="text-sm" style={{ color: '#b3261e' }}>
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={!consented || loading}
        className="h-11 w-full rounded-none text-white uppercase"
        style={{ background: ORANGE }}
      >
        {loading ? 'Enviando...' : 'Pedir acesso'}
      </Button>
    </form>
  );
}

export function GuestHome() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setResults(await searchPublishedEventsByName(query));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mx-auto max-w-lg px-5 py-10 sm:py-16">
      {sent ? (
        <div
          className="flex flex-col items-center gap-3 border-2 p-8 text-center"
          style={{ borderColor: INK }}
        >
          <CheckCircle2 className="size-10" style={{ color: ORANGE }} />
          <h1 className="font-display text-xl uppercase">Pedido enviado!</h1>
          <p className="text-[14px] opacity-70">
            Assim que o organizador aprovar, você recebe o link por e-mail e WhatsApp.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mb-1 font-display text-2xl uppercase sm:text-3xl">Encontre seu evento</h1>
          <p className="mb-6 text-[14px] opacity-70">
            Não tem o link? Busque pelo nome do evento e peça acesso.
          </p>

          <div className="relative mb-4">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 opacity-50" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome do evento..."
              className="h-12 rounded-none border-2 pl-10"
              style={{ borderColor: INK }}
            />
          </div>

          {selected ? (
            <RequestForm event={selected} onSent={() => setSent(true)} />
          ) : (
            <div className="space-y-2">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelected(r)}
                  className="flex w-full items-center justify-between border-2 p-4 text-left transition-colors hover:bg-black/5"
                  style={{ borderColor: INK }}
                >
                  <span className="font-semibold">{r.name}</span>
                  {r.eventDate && (
                    <span className="text-[12px] opacity-60">
                      {format(r.eventDate, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  )}
                </button>
              ))}
              {query.trim().length >= 2 && results.length === 0 && (
                <p className="text-[13px] opacity-60">Nenhum evento encontrado com esse nome.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
