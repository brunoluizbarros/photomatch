import { getEvent } from '@/actions/events';
import { ThresholdTestPanel } from '@/components/admin/threshold-test-panel';
import { requireUser } from '@/lib/auth/require-admin';
import { notFound } from 'next/navigation';

export default async function EventTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role } = await requireUser();
  if (role !== 'admin') notFound();
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Testar reconhecimento — {event.name}</h1>
      <p className="text-[var(--muted-foreground)] text-sm">
        Sobe uma selfie e mostra todos os scores de similaridade, sem aplicar o threshold
        configurado — use para calibrar REKOGNITION_FACE_MATCH_THRESHOLD.
      </p>
      <ThresholdTestPanel eventId={event.id} />
    </div>
  );
}
