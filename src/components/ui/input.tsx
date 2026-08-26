import { cn } from '@/lib/utils/cn';
import type { InputHTMLAttributes } from 'react';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]',
        className,
      )}
      {...props}
    />
  );
}
