import { Card } from '@/components/ui/card';
import type { FolderOpen } from 'lucide-react';

// Cards de estatística — porta o padrão de dashboard do ticketeria-techstage
// (ícone + número grande + label), adaptado pro domínio de álbuns/fotos.
export function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof FolderOpen;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <Icon className="size-6 text-[var(--accent)]" />
      <p className="mt-2 font-display text-4xl text-[var(--foreground)]">{value}</p>
      <p className="text-[var(--muted-foreground)] text-sm">{label}</p>
      {hint && <p className="mt-1 text-[var(--muted-foreground)] text-xs">{hint}</p>}
    </Card>
  );
}
