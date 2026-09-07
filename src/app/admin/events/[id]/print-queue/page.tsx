import { getEvent } from '@/actions/events';
import { PrintQueuePanel } from '@/components/admin/print-queue-panel';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/auth/require-admin';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EventPrintQueuePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/events/${id}`}>
          <ArrowLeft className="size-4" />
          Voltar para o evento
        </Link>
      </Button>

      <PrintQueuePanel eventId={event.id} />
    </div>
  );
}
