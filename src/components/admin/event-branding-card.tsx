'use client';

import { updateEventBranding } from '@/actions/events';
import { EventBrandingFields } from '@/components/admin/event-branding-fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
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

// Card com resumo do que está salvo + botão "Editar" que abre um diálogo —
// mesmo padrão do card de planos (event-sales-card.tsx): nada salva sozinho
// aqui, o rodapé fixo do diálogo tem o botão + aviso de edição pendente.
export function EventBrandingCard({
  event,
  heroPreviewUrl,
  logoPreviewUrl,
}: {
  event: Event;
  heroPreviewUrl: string | null;
  logoPreviewUrl: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [heroImageKey, setHeroImageKey] = useState(event.heroImageKey);
  const [logoImageKey, setLogoImageKey] = useState(event.logoImageKey);
  const [primaryColor, setPrimaryColor] = useState(getAccentPreset(event.primaryColor).id);
  const [fontId, setFontId] = useState(getFontPreset(event.fontId).id);
  const [bodyColor, setBodyColor] = useState(getBodyPreset(event.bodyColor).id);
  const [welcomeMessage, setWelcomeMessage] = useState(event.welcomeMessage ?? '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const accent = getAccentPreset(event.primaryColor);
  const font = getFontPreset(event.fontId);
  const body = getBodyPreset(event.bodyColor);

  function resetFields() {
    setHeroImageKey(event.heroImageKey);
    setLogoImageKey(event.logoImageKey);
    setPrimaryColor(getAccentPreset(event.primaryColor).id);
    setFontId(getFontPreset(event.fontId).id);
    setBodyColor(getBodyPreset(event.bodyColor).id);
    setWelcomeMessage(event.welcomeMessage ?? '');
    setDirty(false);
  }

  function openDialog() {
    resetFields();
    setOpen(true);
  }

  // Envolve cada setter de campo pra marcar "edição pendente" — mesmo padrão
  // do diálogo de plano (event-sales-card.tsx).
  function field<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setDirty(true);
    };
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    await updateEventBranding(event.id, {
      heroImageKey,
      logoImageKey,
      primaryColor,
      fontId,
      bodyColor,
      welcomeMessage: welcomeMessage.trim() || null,
    });
    setSaving(false);
    setDirty(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display uppercase">Personalizar página pública</h2>
        <p className="text-[var(--muted-foreground)] text-sm">
          Template editorial (foto de capa full-bleed, tipografia serifada, superfície dia/noite).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          {heroPreviewUrl ? (
            <img
              src={heroPreviewUrl}
              alt="Foto de capa"
              className="h-10 w-16 rounded-md border border-[var(--border)] object-cover"
            />
          ) : (
            <div
              className="h-10 w-16 rounded-md border border-[var(--border)]"
              style={{ background: accent.gradient }}
            />
          )}
          {logoPreviewUrl && (
            <img
              src={logoPreviewUrl}
              alt="Logo"
              className="h-10 w-10 rounded-md border border-[var(--border)] object-cover"
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-4 shrink-0 rounded-full border border-[var(--border)]"
            style={{ background: accent.solid }}
          />
          <span className="text-[var(--muted-foreground)]">{accent.label}</span>
        </div>
        <span style={{ fontFamily: `var(${font.cssVar})` }}>{font.label}</span>
        <span className="text-[var(--muted-foreground)]">{body.label}</span>
      </div>

      <p className="text-[var(--muted-foreground)] text-sm italic">
        {event.welcomeMessage ? `“${event.welcomeMessage}”` : 'Nenhuma mensagem personalizada.'}
      </p>

      <Button variant="outline" size="sm" onClick={openDialog}>
        Editar
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Editar personalização"
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-amber-600 text-xs" aria-live="polite">
              {dirty && !saving ? 'Você tem edições não salvas.' : ''}
            </p>
            <Button type="submit" form="branding-form" variant="accent" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        }
      >
        <form id="branding-form" onSubmit={handleSubmit}>
          <EventBrandingFields
            eventId={event.id}
            heroPreviewUrl={heroPreviewUrl}
            logoPreviewUrl={logoPreviewUrl}
            heroImageKey={heroImageKey}
            onHeroImageKeyChange={field(setHeroImageKey)}
            logoImageKey={logoImageKey}
            onLogoImageKeyChange={field(setLogoImageKey)}
            primaryColor={primaryColor}
            onPrimaryColorChange={field(setPrimaryColor)}
            fontId={fontId}
            onFontIdChange={field(setFontId)}
            bodyColor={bodyColor}
            onBodyColorChange={field(setBodyColor)}
            welcomeMessage={welcomeMessage}
            onWelcomeMessageChange={field(setWelcomeMessage)}
          />
        </form>
      </Dialog>
    </Card>
  );
}
