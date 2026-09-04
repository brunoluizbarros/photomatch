import { eq } from 'drizzle-orm';
import { db } from './client';
import { events } from './schemas';

// Sempre relida do banco dentro da action, nunca aceita como parâmetro vindo
// do cliente: é um booleano que decide quem vê foto de quem, então tem que
// vir da fonte de verdade (o registro do evento), não de um valor repassado.
export async function eventAllowsAllPhotos(eventId: string): Promise<boolean> {
  const [event] = await db
    .select({ photographersSeeAllPhotos: events.photographersSeeAllPhotos })
    .from(events)
    .where(eq(events.id, eventId));
  return event?.photographersSeeAllPhotos ?? false;
}

export async function eventAllowsPhotographerAlbums(eventId: string): Promise<boolean> {
  const [event] = await db
    .select({ photographersCanCreateAlbums: events.photographersCanCreateAlbums })
    .from(events)
    .where(eq(events.id, eventId));
  return event?.photographersCanCreateAlbums ?? false;
}
