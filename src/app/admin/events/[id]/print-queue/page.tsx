import { getEvent } from '@/actions/events';
import { PrintQueuePanel } from '@/components/admin/print-queue-panel';
import { requireAdmin } from '@/lib/auth/require-admin';
import { notFound } from 'next/navigation';

export default async function EventPrintQueuePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return <PrintQueuePanel eventId={event.id} />;
}
