'use client';

import { setPublished } from '@/actions/albums';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function PublishToggle({
  albumId,
  slug,
  initialIsPublished,
}: { albumId: string; slug: string; initialIsPublished: boolean }) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [loading, setLoading] = useState(false);
  // Começa relativo (bate com o SSR) e só vira absoluto depois de montar no
  // client — ler window.location durante a renderização causa mismatch de
  // hidratação (React #418), já que o servidor nunca tem "window".
  const [publicUrl, setPublicUrl] = useState(`/e/${slug}`);

  useEffect(() => {
    setPublicUrl(`${window.location.origin}/e/${slug}`);
  }, [slug]);

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
