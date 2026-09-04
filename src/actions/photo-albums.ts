'use server';

import { ownedBy, requireAdmin, requireUser } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { eventAllowsAllPhotos, eventAllowsPhotographerAlbums } from '@/lib/db/event-scope';
import { albums, photos, user } from '@/lib/db/schemas';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Álbuns = pastas de fotos dentro de um evento. Sem Collection própria — a
// busca por selfie continua escopada ao evento inteiro, álbum é só
// organização visual para quem administra.
export async function listAlbumsByEvent(eventId: string) {
  const { role, userId } = await requireUser();
  const allowAll = await eventAllowsAllPhotos(eventId);
  return db
    .select({
      id: albums.id,
      name: albums.name,
      createdAt: albums.createdAt,
      authorName: user.name,
      photoCount: sql<number>`count(${photos.id}) filter (where ${photos.id} is not null)::int`,
    })
    .from(albums)
    .leftJoin(
      photos,
      and(eq(photos.albumId, albums.id), ownedBy(role, userId, photos.uploadedBy, allowAll)),
    )
    .leftJoin(user, eq(user.id, albums.createdBy))
    .where(eq(albums.eventId, eventId))
    .groupBy(albums.id, user.name)
    .orderBy(albums.createdAt);
}

// Fotos do evento sem álbum atribuído — mesma contagem para o card "Sem álbum".
export async function countPhotosWithoutAlbum(eventId: string) {
  const { role, userId } = await requireUser();
  const allowAll = await eventAllowsAllPhotos(eventId);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(photos)
    .where(
      and(
        eq(photos.eventId, eventId),
        sql`${photos.albumId} is null`,
        ownedBy(role, userId, photos.uploadedBy, allowAll),
      ),
    );
  return row?.count ?? 0;
}

// Admin sempre pode; fotógrafo só se o evento liberar (ver
// events.photographersCanCreateAlbums / setPhotographersCanCreateAlbums).
export async function createAlbum(eventId: string, name: string) {
  const { role, userId } = await requireUser('admin', 'photographer');
  if (role === 'photographer' && !(await eventAllowsPhotographerAlbums(eventId))) {
    return { ok: false as const, error: 'Você não tem permissão para criar álbuns neste evento.' };
  }

  const [album] = await db.insert(albums).values({ eventId, name, createdBy: userId }).returning();
  revalidatePath(`/admin/events/${eventId}/photos`);
  return { ok: true as const, album };
}

export async function renameAlbum(albumId: string, eventId: string, name: string) {
  await requireAdmin();
  await db.update(albums).set({ name }).where(eq(albums.id, albumId));
  revalidatePath(`/admin/events/${eventId}/photos`);
}

// onDelete: 'set null' na FK cuida das fotos — elas caem em "Sem álbum".
export async function deleteAlbum(albumId: string, eventId: string) {
  await requireAdmin();
  await db.delete(albums).where(eq(albums.id, albumId));
  revalidatePath(`/admin/events/${eventId}/photos`);
}

// Move um lote de fotos para um álbum (ou de volta para "Sem álbum", com
// albumId null). Fotógrafo só move as fotos que ele mesmo subiu — mover é
// uma ação de escrita, não segue o "ver todas" do evento (esse controla só
// visibilidade, não passa a autorizar mexer no que é de outro fotógrafo).
export async function movePhotosToAlbum(
  eventId: string,
  photoIds: string[],
  albumId: string | null,
) {
  const { role, userId } = await requireUser('admin', 'photographer');
  await db
    .update(photos)
    .set({ albumId })
    .where(
      and(
        eq(photos.eventId, eventId),
        inArray(photos.id, photoIds),
        ownedBy(role, userId, photos.uploadedBy),
      ),
    );
  revalidatePath(`/admin/events/${eventId}/photos`);
}
