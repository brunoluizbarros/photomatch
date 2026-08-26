'use client';

import { cn } from '@/lib/utils/cn';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

export function Checkbox({ className, ...props }: CheckboxPrimitive.CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'flex h-5 w-5 items-center justify-center rounded border border-[var(--border)] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:text-[var(--primary-foreground)]',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
