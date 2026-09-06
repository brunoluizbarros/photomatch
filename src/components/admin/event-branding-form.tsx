'use client';

import { updateEventBranding } from '@/actions/events';
import { EventBrandingFields } from '@/components/admin/event-branding-fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAccentPreset } from '@/lib/theme/accent-presets';
import { getBodyPreset } from '@/lib/theme/body-presets';
import { getFontPreset } from '@/lib/theme/font-presets';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

type Event = {
  id: string;
  heroImageKey: string | null;
  logoImageKey: string | null;
  primaryColor: string;
  fontId: string;
  bodyColor: string;
  welcomeMessage: string | null;
};

// Usado só pelo passo 2 do wizard de criação de evento (event-create-wizard.tsx),
// que já roda dentro do próprio Dialog do wizard — Card + botão inline faz
// sentido aí (avança o passo), diferente da página do evento já criado, que
// usa EventBrandingCard (resumo + diálogo próprio, ver esse arquivo).
export function EventBrandingForm({
  event,
  heroPreviewUrl,
  logoPreviewUrl,
  submitLabel = 'Salvar personalização',
  onSaved,
}: {
  event: Event;
  heroPreviewUrl: string | null;
  logoPreviewUrl: string | null;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [heroImageKey, setHeroImageKey] = useState(event.heroImageKey);
  const [logoImageKey, setLogoImageKey] = useState(event.logoImageKey);
  const [primaryColor, setPrimaryColor] = useState(getAccentPreset(event.primaryColor).id);
  const [fontId, setFontId] = useState(getFontPreset(event.fontId).id);
  const [bodyColor, setBodyColor] = useState(getBodyPreset(event.bodyColor).id);
  const [welcomeMessage, setWelcomeMessage] = useState(event.welcomeMessage ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateEventBranding(event.id, {
      heroImageKey,
      logoImageKey,
      primaryColor,
      fontId,
      bodyColor,
      welcomeMessage: welcomeMessage.trim() || null,
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    onSaved?.();
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display uppercase">Personalizar página pública</h2>
        <p className="text-[var(--muted-foreground)] text-sm">
          Template editorial (foto de capa full-bleed, tipografia serifada, superfície dia/noite) —
          cada evento pode trocar a foto de capa, o logo, a cor de destaque e o texto de
          boas-vindas.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <EventBrandingFields
          eventId={event.id}
          heroPreviewUrl={heroPreviewUrl}
          logoPreviewUrl={logoPreviewUrl}
          heroImageKey={heroImageKey}
          onHeroImageKeyChange={setHeroImageKey}
          logoImageKey={logoImageKey}
          onLogoImageKeyChange={setLogoImageKey}
          primaryColor={primaryColor}
          onPrimaryColorChange={setPrimaryColor}
          fontId={fontId}
          onFontIdChange={setFontId}
          bodyColor={bodyColor}
          onBodyColorChange={setBodyColor}
          welcomeMessage={welcomeMessage}
          onWelcomeMessageChange={setWelcomeMessage}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : submitLabel}
          </Button>
          {saved && <span className="text-[var(--muted-foreground)] text-sm">Salvo.</span>}
        </div>
      </form>
    </Card>
  );
}
