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
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // Fica fixo embaixo, fora da área que rola — pro botão de ação (e um aviso
  // de edição não salva) continuarem visíveis em formulários compridos, sem
  // precisar rolar até o fim. Opcional: sem footer, o dialog volta a ser um
  // bloco só (comportamento de sempre).
  footer?: ReactNode;
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
        // hidden + open:flex (não só "flex"): o <dialog> fechado não tem o
        // atributo [open], e o reset do Tailwind aqui não reforça o
        // display:none padrão do UA contra uma classe utilitária — "flex" sozinho
        // vencia a especificidade e deixava o modal visível mesmo fechado.
        'm-auto hidden max-h-[85vh] w-[min(44rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--foreground)] shadow-lg open:flex open:flex-col backdrop:bg-black/50',
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between border-[var(--border)] border-b px-5 py-4">
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
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      {footer && (
        <div className="shrink-0 border-[var(--border)] border-t bg-[var(--surface)] px-5 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}
