'use client';

import { updateAlbumBranding } from '@/actions/albums';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

type Album = {
  id: string;
  heroImageUrl: string | null;
  logoUrl: string | null;
  primaryColor: string;
  welcomeMessage: string | null;
};

export function AlbumBrandingForm({ album }: { album: Album }) {
  const router = useRouter();
  const [heroImageUrl, setHeroImageUrl] = useState(album.heroImageUrl ?? '');
  const [logoUrl, setLogoUrl] = useState(album.logoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(album.primaryColor);
  const [welcomeMessage, setWelcomeMessage] = useState(album.welcomeMessage ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateAlbumBranding(album.id, {
      heroImageUrl: heroImageUrl.trim() || null,
      logoUrl: logoUrl.trim() || null,
      primaryColor,
      welcomeMessage: welcomeMessage.trim() || null,
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold">Personalizar página pública</h2>
        <p className="text-[var(--muted-foreground)] text-sm">
          Template editorial (foto de capa full-bleed, tipografia serifada, superfície dia/noite) —
          cada evento pode trocar a foto de capa, o logo, a cor de destaque e o texto de
          boas-vindas.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="heroImageUrl">Foto de capa (URL)</Label>
          <Input
            id="heroImageUrl"
            type="url"
            placeholder="https://..."
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
          />
          <p className="text-[var(--muted-foreground)] text-xs">
            Sem foto, a capa usa um gradiente com a cor de destaque.
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="logoUrl">Logo (URL)</Label>
          <Input
            id="logoUrl"
            type="url"
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="primaryColor">Cor de destaque</Label>
          <div className="flex items-center gap-2">
            <input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 rounded border border-[var(--border)]"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="max-w-32"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="welcomeMessage">Texto de boas-vindas</Label>
          <Input
            id="welcomeMessage"
            placeholder="Tire uma selfie e encontre suas fotos do evento."
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar personalização'}
          </Button>
          {saved && <span className="text-[var(--muted-foreground)] text-sm">Salvo.</span>}
        </div>
      </form>
    </Card>
  );
}
