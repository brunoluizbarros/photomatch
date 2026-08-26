import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border)] bg-[var(--background)] p-4',
        className,
      )}
      {...props}
    />
  );
}
