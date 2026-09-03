import { db } from '@/lib/db/client';
import { events, analytics_events } from '@/lib/db/schemas';
import { isRateLimited } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

// Ping de visita da página pública (/e/[slug]), disparado via sendBeacon.
// Responde 204 sempre — sendBeacon ignora a resposta, e nada aqui pode
// quebrar a página do convidado.
export async function POST(request: NextRequest) {
  const noContent = new Response(null, { status: 204 });

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isRateLimited(`visit:${ip}`, 60, 60_000)) return noContent;

    // sendBeacon manda o corpo como text/plain; Request.json() parseia igual.
    const body = await request.json();
    const { slug, deviceId } = body ?? {};
    if (typeof slug !== 'string' || typeof deviceId !== 'string') return noContent;
    if (slug.length > 200 || deviceId.length > 64) return noContent;

    const [event] = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug));
    if (!event) return noContent;

    await db.insert(analytics_events).values({ eventId: event.id, deviceId, type: 'visit' });
  } catch (err) {
    console.error('visit ping failed', err);
  }

  return noContent;
}
