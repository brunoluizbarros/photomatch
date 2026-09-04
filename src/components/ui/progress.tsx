'use client';

import { cn } from '@/lib/utils/cn';
import * as ProgressPrimitive from '@radix-ui/react-progress';

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <ProgressPrimitive.Root
      className={cn('h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]', className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-[var(--accent)] transition-transform"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
