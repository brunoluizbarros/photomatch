import { UsersPanel } from '@/components/admin/users-panel';
import { requireUser } from '@/lib/auth/require-admin';
import { notFound } from 'next/navigation';

export default async function UsersPage() {
  const { role } = await requireUser();
  if (role !== 'admin') notFound();

  return <UsersPanel />;
}
