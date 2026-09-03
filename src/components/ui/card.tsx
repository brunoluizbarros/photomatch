import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-md border-2 border-[var(--foreground)] bg-[var(--background)] p-5 shadow-[4px_4px_0_0_var(--foreground)]',
        className,
      )}
      {...props}
    />
  );
}
