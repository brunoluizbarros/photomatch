'use client';

import { AlbumProgress } from '@/components/admin/album-progress';
import { BulkUploader } from '@/components/admin/bulk-uploader';
import { useState } from 'react';

export function AlbumDetail({ albumId }: { albumId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <BulkUploader albumId={albumId} onDone={() => setRefreshKey((k) => k + 1)} />
      <AlbumProgress albumId={albumId} refreshKey={refreshKey} />
    </div>
  );
}
