'use client';

import { AddPhotosPanel } from '@/components/admin/add-photos-panel';
import { AlbumProgress } from '@/components/admin/album-progress';
import { useState } from 'react';

export function AlbumDetail({ albumId }: { albumId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <AddPhotosPanel albumId={albumId} onDone={() => setRefreshKey((k) => k + 1)} />
      <AlbumProgress albumId={albumId} refreshKey={refreshKey} />
    </div>
  );
}
