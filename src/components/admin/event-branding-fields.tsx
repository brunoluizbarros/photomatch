'use client';

import { ImageUploadField } from '@/components/admin/image-upload-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ACCENT_PRESETS, getAccentPreset } from '@/lib/theme/accent-presets';
import { BODY_PRESETS, getBodyPreset } from '@/lib/theme/body-presets';
import { FONT_PRESETS, getFontPreset } from '@/lib/theme/font-presets';
import { cn } from '@/lib/utils/cn';

// Coleção fixa de degradês (bkcuradoria/GradientPicker) — o admin escolhe um
// preset, nunca digita hex ou CSS de gradiente na mão.
export function AccentPresetPicker({
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
export function FontPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
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
export function BodyPresetPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
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

// Só os campos, controlados de fora — sem <form>, sem botão de salvar, sem
// Card. Usado tanto pelo passo 2 do wizard de criação (event-branding-form.tsx)
// quanto pelo diálogo de edição na página do evento (event-branding-card.tsx),
// pra não duplicar os seis campos e os três pickers em dois lugares.
export function EventBrandingFields({
  eventId,
  heroPreviewUrl,
  logoPreviewUrl,
  heroImageKey,
  onHeroImageKeyChange,
  logoImageKey,
  onLogoImageKeyChange,
  primaryColor,
  onPrimaryColorChange,
  fontId,
  onFontIdChange,
  bodyColor,
  onBodyColorChange,
  welcomeMessage,
  onWelcomeMessageChange,
}: {
  eventId: string;
  heroPreviewUrl: string | null;
  logoPreviewUrl: string | null;
  heroImageKey: string | null;
  onHeroImageKeyChange: (key: string | null) => void;
  logoImageKey: string | null;
  onLogoImageKeyChange: (key: string | null) => void;
  primaryColor: string;
  onPrimaryColorChange: (id: string) => void;
  fontId: string;
  onFontIdChange: (id: string) => void;
  bodyColor: string;
  onBodyColorChange: (id: string) => void;
  welcomeMessage: string;
  onWelcomeMessageChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="welcomeMessage">Texto de boas-vindas</Label>
        <Input
          id="welcomeMessage"
          placeholder="Tire uma selfie e encontre suas fotos do evento."
          value={welcomeMessage}
          onChange={(e) => onWelcomeMessageChange(e.target.value)}
        />
      </div>
      <ImageUploadField
        label="Foto de capa"
        hint="Sem foto, a capa usa um gradiente com a cor de destaque."
        eventId={eventId}
        kind="hero"
        aspect="wide"
        initialPreviewUrl={heroPreviewUrl}
        value={heroImageKey}
        onChange={onHeroImageKeyChange}
      />
      <ImageUploadField
        label="Logo"
        eventId={eventId}
        kind="logo"
        aspect="square"
        initialPreviewUrl={logoPreviewUrl}
        value={logoImageKey}
        onChange={onLogoImageKeyChange}
      />
      <div className="space-y-1">
        <Label>Cor de destaque</Label>
        <AccentPresetPicker value={primaryColor} onChange={onPrimaryColorChange} />
      </div>
      <div className="space-y-1">
        <Label>Fonte dos títulos</Label>
        <FontPicker value={fontId} onChange={onFontIdChange} />
      </div>
      <div className="space-y-1">
        <Label>Cor do corpo (fundo abaixo da capa)</Label>
        <BodyPresetPicker value={bodyColor} onChange={onBodyColorChange} />
      </div>
    </div>
  );
}
