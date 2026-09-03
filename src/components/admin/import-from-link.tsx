'use client';

import { importFromShareLink } from '@/actions/photos';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type FormEvent, useState } from 'react';

export function ImportFromLink({ albumId, onDone }: { albumId: string; onDone: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setImported(null);
    try {
      const { count } = await importFromShareLink({ albumId, url });
      setImported(count);
      setUrl('');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível importar esse link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-display uppercase">Importar de link</h2>
      <p className="text-[var(--muted-foreground)] text-sm">
        Link público do Google Drive (arquivo ou pasta) ou do Dropbox (arquivo). A pasta precisa
        estar compartilhada como "qualquer pessoa com o link".
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 space-y-1">
          <Label htmlFor="import-url">URL</Label>
          <Input
            id="import-url"
            type="url"
            required
            placeholder="https://drive.google.com/drive/folders/..."
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
