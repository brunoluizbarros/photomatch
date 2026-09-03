import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Linha fina + mesmo fundo da página — igual à grade da home, sem
        // "cartão" destacado (sem sombra, sem borda grossa).
        'rounded-md border border-[var(--border)] bg-[var(--muted)] p-5',
        className,
      )}
      {...props}
    />
  );
}
