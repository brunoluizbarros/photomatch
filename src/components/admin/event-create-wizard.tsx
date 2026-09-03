'use client';

import { createEvent } from '@/actions/events';
import { EventBrandingForm } from '@/components/admin/event-branding-form';
import { EventDetail } from '@/components/admin/event-detail';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { slugify } from '@/lib/utils/slugify';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

type CreateEventResult = Awaited<ReturnType<typeof createEvent>>;
type CreatedEvent = Extract<CreateEventResult, { ok: true }>['event'];

const STEP_LABELS = ['Dados', 'Design', 'Fotos'] as const;

function StepIndicator({ step }: { step: number }) {
  return (
    <div aria-hidden className="mb-5 flex items-center gap-2">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full font-display text-xs',
              i + 1 <= step
                ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
            )}
          >
            {i + 1}
          </span>
          <span className="text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
            {label}
          </span>
          {i < STEP_LABELS.length - 1 && <span className="h-px flex-1 bg-[var(--border)]" />}
        </div>
      ))}
    </div>
  );
}

// Passo 1 do wizard: mesma lógica de nome/slug do form antigo, mais data do
// evento (createEvent já aceitava eventDate, mas nada enviava até agora).
function StepBasics({ onCreated }: { onCreated: (event: CreatedEvent) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createEvent({ name, slug, eventDate: eventDate || undefined });
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    onCreated(result.event);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="wizard-name">Nome do evento</Label>
        <Input
          id="wizard-name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="wizard-slug">Slug (URL pública)</Label>
        <Input
          id="wizard-slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="wizard-date">Data do evento (opcional)</Label>
        <Input
          id="wizard-date"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
      </div>
      {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
      <Button type="submit" variant="accent" disabled={loading}>
        {loading ? 'Criando...' : 'Criar e continuar'}
      </Button>
    </form>
  );
}

export function EventCreateWizard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [event, setEvent] = useState<CreatedEvent | null>(null);

  function reset() {
    setStep(1);
    setEvent(null);
  }

  function close() {
    setOpen(false);
    router.refresh(); // o evento criado (mesmo em rascunho) já entra na lista
    // Espera o fechamento visual antes de limpar o estado do form.
    setTimeout(reset, 200);
  }

  function finish() {
    setOpen(false);
    if (event) router.push(`/admin/events/${event.id}`);
    setTimeout(reset, 200);
  }

  return (
    <>
      <Button variant="accent" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Novo evento
      </Button>

      <Dialog open={open} onClose={close} title="Novo evento">
        <StepIndicator step={step} />

        {step === 1 && (
          <StepBasics
            onCreated={(created) => {
              setEvent(created);
              setStep(2);
            }}
          />
        )}

        {step === 2 && event && (
          <div className="space-y-4">
            <EventBrandingForm
              event={event}
              heroPreviewUrl={null}
              logoPreviewUrl={null}
              submitLabel="Salvar e continuar"
              onSaved={() => setStep(3)}
            />
            <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
              Pular personalização
            </Button>
          </div>
        )}

        {step === 3 && event && (
          <div className="space-y-4">
            <EventDetail eventId={event.id} />
            <Button variant="accent" onClick={finish}>
              Concluir
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}
