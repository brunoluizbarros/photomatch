'use server';

import { env } from '@/config/env';
import { requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { access_requests, albums, user } from '@/lib/db/schemas';
import { sendEmail } from '@/lib/notify/email';
import { sendWhatsApp } from '@/lib/notify/whatsapp';
import { isRateLimited } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/utils/escape-html';
import { toE164BR } from '@/lib/utils/phone';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getClientIp() {
  const headerList = await headers();
  return headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

// Público, sem login: convidado busca o evento pelo nome na home. Só álbuns
// publicados aparecem — os mesmos que já são acessíveis via /e/[slug].
export async function searchPublishedAlbumsByName(query: string) {
  const ip = await getClientIp();
  if (isRateLimited(`album-search:${ip}`, 30, 60_000)) return [];

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  return db
    .select({ id: albums.id, name: albums.name, slug: albums.slug, eventDate: albums.eventDate })
    .from(albums)
    .where(and(eq(albums.isPublished, true), ilike(albums.name, `%${trimmed}%`)))
    .limit(10);
}

// Público — cria o pedido e notifica todo admin cadastrado (tabela `user`
// do better-auth; projeto é single-tenant, não existe "dono do álbum").
// Falha de notificação nunca derruba o pedido: ele já está salvo, o admin
// vê no painel mesmo se o e-mail não sair.
export async function requestAlbumAccess(input: {
  albumId: string;
  name: string;
  email: string;
  phone: string;
}) {
  const ip = await getClientIp();
  if (isRateLimited(`access-request:${ip}`, 5, 60_000)) {
    return { ok: false as const, error: 'Muitos pedidos em pouco tempo. Espere um minuto.' };
  }

  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  if (!EMAIL_RE.test(email)) return { ok: false as const, error: 'E-mail inválido.' };
  if (!phone) return { ok: false as const, error: 'Telefone inválido.' };
  if (name.length > 200 || email.length > 200 || phone.length > 40) {
    return { ok: false as const, error: 'Dados inválidos.' };
  }

  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.id, input.albumId), eq(albums.isPublished, true)));
  if (!album) return { ok: false as const, error: 'Evento não encontrado.' };

  const [request] = await db
    .insert(access_requests)
    .values({ albumId: album.id, name: name || null, email, phone })
    .returning();

  const admins = await db.select({ email: user.email }).from(user);
  if (admins.length > 0) {
    // Todo dado do convidado é escapado antes de entrar no HTML — o
    // formulário é público, sem login, então nome/e-mail/telefone são
    // entrada não confiável até aqui.
    const safeName = escapeHtml(name || email);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeAlbumName = escapeHtml(album.name);
    const emailResult = await sendEmail({
      to: admins.map((a) => a.email),
      subject: `Novo pedido de acesso — ${safeAlbumName}`,
      html: `<p>${safeName} pediu acesso a "${safeAlbumName}".</p><p>E-mail: ${safeEmail}<br/>Telefone: ${safePhone}</p><p><a href="${env.NEXT_PUBLIC_APP_URL}/admin/albums/${album.id}">Ver pedido</a></p>`,
    });
    if (!emailResult.ok) console.error('organizer notification failed', emailResult.error);
  }

  return { ok: true as const, requestId: request.id };
}

export async function getAccessRequests(albumId: string) {
  await requireAdmin();
  return db
    .select()
    .from(access_requests)
    .where(eq(access_requests.albumId, albumId))
    .orderBy(desc(access_requests.createdAt));
}

export async function getPendingAccessRequestCount() {
  await requireAdmin();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(access_requests)
    .where(eq(access_requests.status, 'pending'));
  return row?.count ?? 0;
}

export async function approveAccessRequest(id: string) {
  await requireAdmin();
  const [request] = await db.select().from(access_requests).where(eq(access_requests.id, id));
  if (!request) return { ok: false as const, error: 'Pedido não encontrado.' };
  const [album] = await db.select().from(albums).where(eq(albums.id, request.albumId));
  if (!album) return { ok: false as const, error: 'Álbum não encontrado.' };

  const link = `${env.NEXT_PUBLIC_APP_URL}/e/${album.slug}`;
  const safeAlbumName = escapeHtml(album.name);
  const emailResult = await sendEmail({
    to: [request.email],
    subject: `Seu acesso a ${safeAlbumName} foi liberado`,
    html: `<p>Seu pedido foi aprovado. Acesse suas fotos:</p><p><a href="${link}">${link}</a></p>`,
  });
  const phone = toE164BR(request.phone);
  const whatsappResult = phone
    ? await sendWhatsApp({
        to: phone,
        body: `Seu acesso a "${album.name}" foi liberado! Acesse: ${link}`,
      })
    : { ok: false as const, error: 'Telefone inválido' };

  await db
    .update(access_requests)
    .set({
      status: 'approved',
      respondedAt: new Date(),
      emailSentAt: emailResult.ok ? new Date() : null,
      whatsappSentAt: whatsappResult.ok ? new Date() : null,
    })
    .where(eq(access_requests.id, id));

  revalidatePath(`/admin/albums/${album.id}`);
  return { ok: true as const, emailResult, whatsappResult };
}

export async function rejectAccessRequest(id: string) {
  await requireAdmin();
  const [request] = await db.select().from(access_requests).where(eq(access_requests.id, id));
  if (!request) return { ok: false as const, error: 'Pedido não encontrado.' };
  await db
    .update(access_requests)
    .set({ status: 'rejected', respondedAt: new Date() })
    .where(eq(access_requests.id, id));
  revalidatePath(`/admin/albums/${request.albumId}`);
  return { ok: true as const };
}
