import { getEvent } from '@/actions/events';
import { OrdersPanel } from '@/components/admin/orders-panel';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/auth/require-admin';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EventOrdersPage({ params }: { params: Promise<{ id: string }> }) {
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

      <OrdersPanel eventId={event.id} />
    </div>
  );
}
