'use client';

import { setEventPublic } from '@/actions/events';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Só governa a DESCOBERTA na busca da home (guest-home.tsx) — não afeta
// /e/[slug] em si, que continua reachable a quem tem o link em ambos os
// casos. Público: resultado da busca leva direto pro evento (seleciona
// fotos, cai no carrinho, dados de contato só no checkout). Privado (default):
// pedido de acesso + aprovação manual, como sempre foi.
export function EventVisibilityToggle({
  eventId,
  initialIsPublic,
}: { eventId: string; initialIsPublic: boolean }) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      await setEventPublic(eventId, !isPublic);
      setIsPublic(!isPublic);
      router.refresh();
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={toggle} disabled={loading}>
          {isPublic
            ? 'Público — buscável na home sem aprovação'
            : 'Privado — exige pedido de acesso'}
        </Button>
      </div>
      {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
    </div>
  );
}
