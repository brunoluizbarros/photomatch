'use client';

import { getDeviceId } from '@/lib/analytics/device-id';
import { useEffect } from 'react';

// Módulo-level: sobrevive ao double-effect do StrictMode e a remontagens
// dentro do mesmo carregamento de página. Zera num hard navigation, que é o
// que queremos — cada visita real conta uma vez.
const pinged = new Set<string>();

// Ping de visita da página pública do evento, fora do fluxo de busca — não
// bloqueia nada e não afeta a renderização.
export function VisitTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (pinged.has(slug)) return;
    pinged.add(slug);

    const body = JSON.stringify({ slug, deviceId: getDeviceId() });
    // keepalive é o fallback pra quando sendBeacon não existe ou a fila está cheia.
    if (!navigator.sendBeacon?.('/api/t', body)) {
      fetch('/api/t', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  }, [slug]);

  return null;
}
