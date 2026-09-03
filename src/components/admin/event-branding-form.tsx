'use client';

import { updateEventBranding } from '@/actions/events';
import { ImageUploadField } from '@/components/admin/image-upload-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ACCENT_PRESETS, getAccentPreset } from '@/lib/theme/accent-presets';
import { BODY_PRESETS, getBodyPreset } from '@/lib/theme/body-presets';
import { FONT_PRESETS, getFontPreset } from '@/lib/theme/font-presets';
import { cn } from '@/lib/utils/cn';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

// Coleção fixa de degradês (bkcuradoria/GradientPicker) — o admin escolhe um
// preset, nunca digita hex ou CSS de gradiente na mão.
function AccentPresetPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = getAccentPreset(value).id;
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {ACCENT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          title={preset.label}
          className={cn(
            'overflow-hidden rounded-xl border-2 transition-all',
            selected === preset.id
              ? 'scale-[1.06] border-[var(--foreground)] shadow'
              : 'border-transparent hover:border-[var(--border)]',
          )}
        >
          <div className="h-10 w-full" style={{ background: preset.gradient }} />
          <p className="truncate bg-[var(--muted)] px-1 py-1 text-center text-[10px] text-[var(--muted-foreground)] leading-tight">
            {preset.label}
          </p>
        </button>
      ))}
    </div>
  );
}

// Seletor de fonte de exibição — cada opção mostra o próprio nome já
// renderizado na fonte real (as variáveis vêm do admin/layout.tsx, que
// carrega todas as fontes da coleção pro preview funcionar aqui).
function FontPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const selected = getFontPreset(value).id;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {FONT_PRESETS.map((font) => (
        <button
          key={font.id}
          type="button"
          onClick={() => onChange(font.id)}
          className={cn(
            'rounded-xl border-2 px-3 py-3 text-center transition-all',
            selected === font.id
              ? 'border-[var(--foreground)] shadow'
              : 'border-[var(--border)] hover:border-[var(--foreground)]/40',
          )}
        >
          <span className="block truncate text-lg" style={{ fontFamily: `var(${font.cssVar})` }}>
            {font.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// Coleção fixa de fundos pro corpo da página (abaixo do hero) — mesmo
// padrão do AccentPresetPicker, cor sólida ou degradê, sem campo livre.
function BodyPresetPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const selected = getBodyPreset(value).id;
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {BODY_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          title={preset.label}
          className={cn(
            'overflow-hidden rounded-xl border-2 transition-all',
            selected === preset.id
              ? 'scale-[1.06] border-[var(--foreground)] shadow'
              : 'border-transparent hover:border-[var(--border)]',
          )}
        >
          <div className="h-10 w-full" style={{ background: preset.swatch }} />
          <p className="truncate bg-[var(--muted)] px-1 py-1 text-center text-[10px] text-[var(--muted-foreground)] leading-tight">
            {preset.label}
          </p>
        </button>
      ))}
    </div>
  );
}

type Event = {
  id: string;
  heroImageKey: string | null;
  logoImageKey: string | null;
  primaryColor: string;
  fontId: string;
  bodyColor: string;
  welcomeMessage: string | null;
};

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
        <div className="space-y-1">
          <Label htmlFor="welcomeMessage">Texto de boas-vindas</Label>
          <Input
            id="welcomeMessage"
            placeholder="Tire uma selfie e encontre suas fotos do evento."
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
        </div>
        <ImageUploadField
          label="Foto de capa"
          hint="Sem foto, a capa usa um gradiente com a cor de destaque."
          eventId={event.id}
          kind="hero"
          aspect="wide"
          initialPreviewUrl={heroPreviewUrl}
          value={heroImageKey}
          onChange={setHeroImageKey}
        />
        <ImageUploadField
          label="Logo"
          eventId={event.id}
          kind="logo"
          aspect="square"
          initialPreviewUrl={logoPreviewUrl}
          value={logoImageKey}
          onChange={setLogoImageKey}
        />
        <div className="space-y-1">
          <Label>Cor de destaque</Label>
          <AccentPresetPicker value={primaryColor} onChange={setPrimaryColor} />
        </div>
        <div className="space-y-1">
          <Label>Fonte dos títulos</Label>
          <FontPicker value={fontId} onChange={setFontId} />
        </div>
        <div className="space-y-1">
          <Label>Cor do corpo (fundo abaixo da capa)</Label>
          <BodyPresetPicker value={bodyColor} onChange={setBodyColor} />
        </div>
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
