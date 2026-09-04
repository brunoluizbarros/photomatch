'use client';

import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';

// <dialog> nativo com showModal(): top layer, foco preso, Esc, ::backdrop e
// fundo inerte vêm de graça — nada disso justifica um @radix-ui/react-dialog.
// Bônus: fica na árvore do React (sem portal), então as variáveis de fonte do
// admin/layout.tsx continuam herdando aqui dentro (preview do FontPicker).
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    // Única coisa que o <dialog> não faz sozinho: travar o scroll do fundo.
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: onClick só fecha no clique do backdrop (reforço do X e do Esc nativo do <dialog>, não a única forma de fechar)
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose} // Esc dispara 'close' nativamente
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'm-auto w-[min(44rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--foreground)] shadow-lg backdrop:bg-black/50',
        className,
      )}
    >
      <header className="flex items-center justify-between border-[var(--border)] border-b px-5 py-4">
        <h2 className="font-display uppercase">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="grid size-11 cursor-pointer place-items-center rounded-lg hover:bg-[var(--muted)]"
        >
          <X className="size-5" />
        </button>
      </header>
      <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
