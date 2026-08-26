import { SignOutButton } from '@/components/admin/sign-out-button';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-[var(--border)] border-b px-6 py-4">
        <Link href="/admin" className="font-bold">
          PhotoMatch admin
        </Link>
        <SignOutButton />
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
