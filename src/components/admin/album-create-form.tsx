'use client';

import { createAlbum } from '@/actions/albums';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify } from '@/lib/utils/slugify';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export function AlbumCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const album = await createAlbum({ name, slug });
      router.push(`/admin/albums/${album.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o álbum.');
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-display uppercase">Novo álbum</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1 space-y-1">
          <Label htmlFor="name">Nome do evento</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div className="min-w-48 flex-1 space-y-1">
          <Label htmlFor="slug">Slug (URL pública)</Label>
          <Input
            id="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
          />
        </div>
        <Button type="submit" variant="accent" disabled={loading}>
          {loading ? 'Criando...' : 'Criar álbum'}
        </Button>
      </form>
      {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
    </Card>
  );
}
