import { getEvent } from '@/actions/events';
import { getPhotosForPrint } from '@/actions/photos';
import { PrintPhotos } from '@/components/admin/print-photos';
import { notFound } from 'next/navigation';

const MAX_PRINT_PHOTOS = 30; // ponytail: originais em resolução cheia, todos
// rasterizados de uma vez no preview — mais que isso trava o browser. Add
// thumbnails de impressão gerados no worker se esse teto virar problema real.

export default async function EventPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { id } = await params;
  const { ids } = await searchParams;
  const photoIds = (ids ?? '').split(',').filter(Boolean).slice(0, MAX_PRINT_PHOTOS);
  if (photoIds.length === 0) notFound();

  const event = await getEvent(id);
  if (!event) notFound();

  // Assina as URLs aqui, no servidor — nunca a partir de uma URL vinda do
  // cliente — e já aplica o mesmo escopo de dono da galeria (ver
  // src/actions/photos.ts:getPhotosForPrint).
  const photos = await getPhotosForPrint(id, photoIds);
  if (photos.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="no-print mb-4 font-display text-2xl uppercase">Imprimir — {event.name}</h1>
      <PrintPhotos photos={photos} />
    </div>
  );
}
