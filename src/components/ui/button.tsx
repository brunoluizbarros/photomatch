import { cn } from '@/lib/utils/cn';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  // Sombra dura (offset sólido, sem blur) e cantos retos — mesmo motivo
  // brutalista da página pública, aplicado aqui pros botões cheios (default/
  // accent/destructive) saírem consistentes em todo o produto.
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-bold transition-[opacity,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[3px_3px_0_0_var(--foreground)] hover:opacity-90',
        accent:
          'bg-[var(--accent)] text-[var(--accent-foreground)] uppercase tracking-wide shadow-[3px_3px_0_0_var(--foreground)] hover:bg-[var(--accent-dark)]',
        outline: 'border-2 border-[var(--foreground)] hover:bg-[var(--muted)]',
        ghost: 'hover:bg-[var(--muted)]',
        destructive:
          'bg-[var(--destructive)] text-white shadow-[3px_3px_0_0_var(--foreground)] hover:opacity-90',
      },
      size: {
        default: 'h-11 px-5 text-sm',
        sm: 'h-9 px-3.5 text-sm',
        lg: 'h-14 px-6 text-base',
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
