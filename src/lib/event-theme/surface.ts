// Superfície editorial "dia/noite" do template público — portado do design
// do Réveillon Carneiros. Troca automaticamente às 18h (fuso do evento) ou
// via ?theme=day|night na URL. Fixo em America/Sao_Paulo por ora — trocável
// por evento exigiria um campo de timezone, não pedido ainda.
const EVENT_TIMEZONE = 'America/Sao_Paulo';

export type EventSurface = 'day' | 'night';

export function resolveSurface(override?: string, now: Date = new Date()): EventSurface {
  if (override === 'day' || override === 'night') return override;
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: EVENT_TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(now),
  );
  return hour >= 18 || hour < 6 ? 'night' : 'day';
}
