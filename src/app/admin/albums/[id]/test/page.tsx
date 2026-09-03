import { getAlbum } from '@/actions/albums';
import { ThresholdTestPanel } from '@/components/admin/threshold-test-panel';
import { notFound } from 'next/navigation';

export default async function AlbumTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Testar reconhecimento — {album.name}</h1>
      <p className="text-[var(--muted-foreground)] text-sm">
        Sobe uma selfie e mostra todos os scores de similaridade, sem aplicar o threshold
        configurado — use para calibrar REKOGNITION_FACE_MATCH_THRESHOLD.
      </p>
      <ThresholdTestPanel albumId={album.id} />
    </div>
  );
}
