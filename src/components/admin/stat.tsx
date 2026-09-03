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
    <Card className="p-3">
      <div className="flex items-center gap-2.5">
        <Icon className="size-5 shrink-0 text-[var(--accent)]" />
        <div className="min-w-0">
          <p className="font-display text-2xl text-[var(--foreground)] leading-none">{value}</p>
          <p className="truncate text-[var(--muted-foreground)] text-xs">{label}</p>
        </div>
      </div>
      {hint && <p className="mt-1.5 text-[var(--muted-foreground)] text-[11px]">{hint}</p>}
    </Card>
  );
}
