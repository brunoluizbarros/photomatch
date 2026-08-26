'use client';

import { cn } from '@/lib/utils/cn';
import * as LabelPrimitive from '@radix-ui/react-label';

export function Label({ className, ...props }: LabelPrimitive.LabelProps) {
  return <LabelPrimitive.Root className={cn('text-sm font-medium', className)} {...props} />;
}
