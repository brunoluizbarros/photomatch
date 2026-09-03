import { SignOutButton } from '@/components/admin/sign-out-button';
import Link from 'next/link';
import type { ReactNode } from 'react';

// Shell do admin — portado do AdminLayout do ticketeria-techstage (header
// escuro fixo com wordmark + sair, conteúdo centralizado sobre fundo neutro
// claro), trocando o acento roxo da marca original por azul.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <header className="bg-[var(--primary)] text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/admin" className="font-bold text-lg">
            PhotoMatch <span className="text-[var(--accent-light)]">admin</span>
          </Link>
          <SignOutButton className="text-white/80 hover:bg-white/10 hover:text-white" />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
