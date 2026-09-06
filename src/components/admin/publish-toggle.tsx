'use client';

import { setPublished } from '@/actions/events';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function PublishToggle({
  eventId,
  slug,
  initialIsPublished,
}: { eventId: string; slug: string; initialIsPublished: boolean }) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Começa relativo (bate com o SSR) e só vira absoluto depois de montar no
  // client — ler window.location durante a renderização causa mismatch de
  // hidratação (React #418), já que o servidor nunca tem "window".
  const [publicUrl, setPublicUrl] = useState(`/e/${slug}`);

  useEffect(() => {
    setPublicUrl(`${window.location.origin}/e/${slug}`);
  }, [slug]);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      await setPublished(eventId, !isPublished);
      setIsPublished(!isPublished);
      router.refresh();
    } catch {
      // Falha da action: não atualiza o estado, o botão continua refletindo
      // o que está realmente salvo no banco.
      setError('Não foi possível salvar. Tente de novo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
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
      {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
    </div>
  );
}
