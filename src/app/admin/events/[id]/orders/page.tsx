import { getEvent } from '@/actions/events';
import { OrdersPanel } from '@/components/admin/orders-panel';
import { requireAdmin } from '@/lib/auth/require-admin';
import { notFound } from 'next/navigation';

export default async function EventOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return <OrdersPanel eventId={event.id} />;
}
