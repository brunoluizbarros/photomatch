'use client';

import { AddPhotosPanel } from '@/components/admin/add-photos-panel';
import { EventProgress } from '@/components/admin/event-progress';
import { useState } from 'react';

// albumId opcional: quando a galeria está filtrada por uma pasta, as fotos
// enviadas por aqui já nascem dentro dela.
export function EventDetail({ eventId, albumId }: { eventId: string; albumId?: string | null }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <AddPhotosPanel
        eventId={eventId}
        albumId={albumId}
        onDone={() => setRefreshKey((k) => k + 1)}
      />
      <EventProgress eventId={eventId} refreshKey={refreshKey} />
    </div>
  );
}
