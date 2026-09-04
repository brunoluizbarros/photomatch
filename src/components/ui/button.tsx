import { cn } from '@/lib/utils/cn';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-dark)]',
        accent: 'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-dark)]',
        outline: 'border-2 border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]',
        ghost: 'hover:bg-[var(--muted)]',
        destructive: 'bg-[var(--destructive)] text-white hover:bg-[var(--destructive-dark)]',
      },
      // min-h em vez de h fixo: o mínimo de toque do design system (44/56px)
      // continua garantido mesmo se o conteúdo (ícone + texto) empurrar a
      // altura além da base.
      size: {
        default: 'min-h-11 px-5 text-sm',
        sm: 'min-h-[44px] px-3.5 text-sm',
        lg: 'min-h-14 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
