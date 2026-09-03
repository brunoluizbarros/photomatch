'use client';

import { importFromShareLink } from '@/actions/photos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PROVIDER_LABELS, type ShareProvider, detectShareProvider } from '@/lib/import/share-link';
import { type FormEvent, useState } from 'react';

const PLACEHOLDERS: Record<ShareProvider, string> = {
  drive: 'https://drive.google.com/drive/folders/...',
  dropbox: 'https://www.dropbox.com/scl/fi/...',
};

// Formulário de import por link, fixo pra um provedor — o AddPhotosPanel é
// quem decide qual (aba selecionada), então aqui não existe mais toggle.
export function ImportFromLink({
  eventId,
  albumId,
  provider,
  onDone,
}: {
  eventId: string;
  albumId?: string | null;
  provider: ShareProvider;
  onDone: () => void;
}) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setImported(null);

    // Valida o host contra o provedor da aba ativa antes de chamar o
    // servidor — resolveShareLink detecta o provedor pelo link de qualquer
    // forma, mas essa checagem dá feedback imediato se o link colado não
    // bate com a aba escolhida (ex: colou um link do Dropbox na aba do Drive).
    const detected = detectShareProvider(url);
    if (detected !== provider) {
      setError(
        detected
          ? `Esse link é do ${PROVIDER_LABELS[detected]}, não do ${PROVIDER_LABELS[provider]}. Troque de aba ou cole outro link.`
          : `Isso não parece um link do ${PROVIDER_LABELS[provider]}.`,
      );
      return;
    }

    setLoading(true);
    const result = await importFromShareLink({ eventId, albumId, url });
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
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 space-y-1">
          <Label htmlFor="import-url">URL</Label>
          <Input
            id="import-url"
            type="url"
            required
            placeholder={PLACEHOLDERS[provider]}
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
    </div>
  );
}
