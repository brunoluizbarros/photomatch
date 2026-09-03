'use server';

import { funnelRates } from '@/lib/analytics/funnel-rates';
import { requireAdmin } from '@/lib/auth/require-admin';
import { db } from '@/lib/db/client';
import { albums, analytics_events } from '@/lib/db/schemas';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

// ponytail: timezone fixa. O produto é 100% pt-BR; um evento fora do fuso
// erraria o corte do dia, não o total. Vira coluna no álbum se aparecer demanda.
const TZ = 'America/Sao_Paulo';

function windowStart(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

export type FunnelStats = Awaited<ReturnType<typeof getFunnelStats>>;

// Totais + taxas do funil visita -> busca -> resultado. Serve tanto a view
// geral (sem albumId) quanto a view por evento (com albumId) — mesma query.
export async function getFunnelStats(days = 30, albumId?: string) {
  await requireAdmin();
  const conditions = [gte(analytics_events.createdAt, windowStart(days))];
  if (albumId) conditions.push(eq(analytics_events.albumId, albumId));

  const [row] = await db
    .select({
      visits: sql<number>`count(*) filter (where ${analytics_events.type} = 'visit')::int`,
      searches: sql<number>`count(*) filter (where ${analytics_events.type} = 'search')::int`,
      found: sql<number>`count(*) filter (where ${analytics_events.type} = 'search' and ${analytics_events.photoCount} > 0)::int`,
      people: sql<number>`count(distinct ${analytics_events.deviceId})::int`,
    })
    .from(analytics_events)
    .where(and(...conditions));

  const stats = row ?? { visits: 0, searches: 0, found: 0, people: 0 };
  return { ...stats, ...funnelRates(stats) };
}

export type AlbumStats = Awaited<ReturnType<typeof getStatsByAlbum>>[number];

// Lista de álbuns já com os números do funil — substitui listAlbums() no
// /admin. O filtro de data fica no ON do leftJoin, não no WHERE: senão
// álbuns sem tráfego no período desaparecem da lista.
export async function getStatsByAlbum(days = 30) {
  await requireAdmin();
  const searches = sql`count(*) filter (where ${analytics_events.type} = 'search')`;
  return db
    .select({
      albumId: albums.id,
      name: albums.name,
      slug: albums.slug,
      isPublished: albums.isPublished,
      createdAt: albums.createdAt,
      visits: sql<number>`count(*) filter (where ${analytics_events.type} = 'visit')::int`,
      searches: sql<number>`${searches}::int`,
      found: sql<number>`count(*) filter (where ${analytics_events.type} = 'search' and ${analytics_events.photoCount} > 0)::int`,
      people: sql<number>`count(distinct ${analytics_events.deviceId})::int`,
    })
    .from(albums)
    .leftJoin(
      analytics_events,
      and(
        eq(analytics_events.albumId, albums.id),
        gte(analytics_events.createdAt, windowStart(days)),
      ),
    )
    .groupBy(albums.id)
    .orderBy(desc(searches), desc(albums.createdAt));
}

export type DailyPoint = { day: string; visits: number; searches: number; found: number };

// Série diária, janela em dias (padrão 30). generate_series preenche os dias
// sem tráfego — sem isso o gráfico "pula" dias vazios e engana visualmente.
export async function getDailySeries(days = 30, albumId?: string): Promise<DailyPoint[]> {
  await requireAdmin();
  const albumFilter = albumId ? sql`and e.album_id = ${albumId}` : sql``;
  const result = await db.execute<DailyPoint>(sql`
    select
      to_char(d.day, 'YYYY-MM-DD') as day,
      count(e.id) filter (where e.type = 'visit')::int as visits,
      count(e.id) filter (where e.type = 'search')::int as searches,
      count(e.id) filter (where e.type = 'search' and e.photo_count > 0)::int as found
    from generate_series(
      (now() at time zone ${TZ})::date - ${days - 1}::int,
      (now() at time zone ${TZ})::date,
      '1 day'
    ) as d(day)
    left join analytics_events e
      on e.created_at >= ${windowStart(days)}
      and (e.created_at at time zone ${TZ})::date = d.day
      ${albumFilter}
    group by d.day
    order by d.day
  `);
  return result.rows;
}
