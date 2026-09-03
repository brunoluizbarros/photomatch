'use client';

import { importFromShareLink } from '@/actions/photos';
import { DropboxIcon, GoogleDriveIcon } from '@/components/icons/brand-icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type ShareProvider, detectShareProvider } from '@/lib/import/share-link';
import { cn } from '@/lib/utils/cn';
import { type FormEvent, useState } from 'react';

const PROVIDERS: {
  id: ShareProvider;
  label: string;
  icon: typeof GoogleDriveIcon;
  placeholder: string;
}[] = [
  {
    id: 'drive',
    label: 'Google Drive',
    icon: GoogleDriveIcon,
    placeholder: 'https://drive.google.com/drive/folders/...',
  },
  {
    id: 'dropbox',
    label: 'Dropbox',
    icon: DropboxIcon,
    placeholder: 'https://www.dropbox.com/scl/fi/...',
  },
];

export function ImportFromLink({ albumId, onDone }: { albumId: string; onDone: () => void }) {
  const [provider, setProvider] = useState<ShareProvider>('drive');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);

  const active = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setImported(null);

    // Valida o host contra o provedor selecionado antes de chamar o servidor
    // — resolveShareLink detecta o provedor pelo link de qualquer forma, mas
    // essa checagem dá feedback imediato se o link colado não bate com o
    // botão escolhido (ex: colou um link do Dropbox com "Google Drive" ativo).
    const detected = detectShareProvider(url);
    if (detected !== provider) {
      setError(
        detected
          ? `Esse link é do ${PROVIDERS.find((p) => p.id === detected)?.label}, não do ${active.label}. Troque o provedor selecionado ou cole outro link.`
          : `Isso não parece um link do ${active.label}.`,
      );
      return;
    }

    setLoading(true);
    const result = await importFromShareLink({ albumId, url });
    if (!result.ok) {
      setError(result.error);
    } else {
      setImported(result.count);
      setUrl('');
      onDone();
    }
    setLoading(false);
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-display uppercase">Importar de link</h2>
      <p className="text-[var(--muted-foreground)] text-sm">
        Link público do Google Drive (arquivo ou pasta) ou do Dropbox (arquivo). A pasta precisa
        estar compartilhada como "qualquer pessoa com o link".
      </p>

      <div className="flex gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={provider === p.id}
            onClick={() => {
              setProvider(p.id);
              setError(null);
            }}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              provider === p.id
                ? 'border-[var(--foreground)] bg-[var(--background)]'
                : 'border-[var(--border)] hover:border-[var(--foreground)]/40',
            )}
          >
            <p.icon className="size-4" />
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 space-y-1">
          <Label htmlFor="import-url">URL</Label>
          <Input
            id="import-url"
            type="url"
            required
            placeholder={active.placeholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Importando...' : 'Importar'}
        </Button>
      </form>
      {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
      {imported !== null && (
        <p className="text-[var(--muted-foreground)] text-sm">
          {imported} foto(s) na fila — acompanhe o progresso abaixo.
        </p>
      )}
    </Card>
  );
}
