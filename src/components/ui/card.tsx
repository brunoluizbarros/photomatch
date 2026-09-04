import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Cartão branco distinto do fundo de página (--surface vs
        // --background) + sombra suave — receita do design system portado
        // do ticketeria-techstage.
        'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm',
        className,
      )}
      {...props}
    />
  );
}
