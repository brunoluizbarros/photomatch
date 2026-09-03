'use client';

import { setPublished } from '@/actions/albums';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PublishToggle({
  albumId,
  slug,
  initialIsPublished,
}: { albumId: string; slug: string; initialIsPublished: boolean }) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [loading, setLoading] = useState(false);
  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/e/${slug}` : `/e/${slug}`;

  async function toggle() {
    setLoading(true);
    await setPublished(albumId, !isPublished);
    setIsPublished(!isPublished);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant={isPublished ? 'outline' : 'accent'} onClick={toggle} disabled={loading}>
        {isPublished ? 'Despublicar' : 'Publicar página pública'}
      </Button>
      {isPublished && (
        <a href={publicUrl} target="_blank" rel="noreferrer" className="text-sm underline">
          {publicUrl}
        </a>
      )}
    </div>
  );
}
