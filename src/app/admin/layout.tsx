import { SignOutButton } from '@/components/admin/sign-out-button';
import { requireUser } from '@/lib/auth/require-admin';
import { ALL_FONT_VARIABLES } from '@/lib/theme/font-presets';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import type { ReactNode } from 'react';

// Shell do admin — header escuro fixo com wordmark + sair, conteúdo
// centralizado sobre o fundo da marca. ALL_FONT_VARIABLES fica aqui pra o
// seletor de fonte (EventBrandingForm) conseguir mostrar o preview de cada
// opção na fonte real.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { role } = await requireUser();

  return (
    <div className={cn(ALL_FONT_VARIABLES, 'min-h-screen bg-[var(--muted)]')}>
      <header className="bg-[var(--primary)] text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/admin" className="font-display text-lg uppercase">
            PhotoMatch <span className="text-[var(--accent-light)]">admin</span>
          </Link>
          <div className="flex items-center gap-2">
            {role === 'admin' && (
              <Link
                href="/admin/users"
                className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                Usuários
              </Link>
            )}
            <SignOutButton className="text-white/80 hover:bg-white/10 hover:text-white" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
