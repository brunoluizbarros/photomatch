import { getDashboardStats } from '@/actions/albums';
import { getStatsByAlbum } from '@/actions/analytics';
import { AlbumCreateWizard } from '@/components/admin/album-create-wizard';
import { AnalyticsPanel } from '@/components/admin/analytics-panel';
import { Stat } from '@/components/admin/stat';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Camera, CheckCircle2, FolderOpen, ScanFace } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_WINDOW_DAYS = 30;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const days = Number(d) || DEFAULT_WINDOW_DAYS;

  const [stats, albumStats] = await Promise.all([getDashboardStats(), getStatsByAlbum(days)]);
  const maxSearches = Math.max(1, ...albumStats.map((a) => a.searches));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--foreground)] uppercase">Painel</h1>
        <AlbumCreateWizard />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={FolderOpen} label="Álbuns" value={stats.albums.total} />
        <Stat icon={CheckCircle2} label="Publicados" value={stats.albums.published} />
        <Stat icon={Camera} label="Fotos" value={stats.photos.total} />
        <Stat icon={ScanFace} label="Indexadas" value={stats.photos.indexed} />
      </div>

      <AnalyticsPanel days={days} basePath="/admin" />

      <div className="space-y-3">
        <h2 className="font-display text-[var(--foreground)] text-xl uppercase">Álbuns</h2>
        {albumStats.length === 0 && (
          <p className="text-[var(--muted-foreground)] text-sm">Nenhum álbum criado ainda.</p>
        )}
        <div className="space-y-3">
          {albumStats.map((album) => (
            <Link key={album.albumId} href={`/admin/albums/${album.albumId}`}>
              <Card className="flex items-center justify-between gap-4 transition-colors hover:border-[var(--accent)]">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--foreground)]">{album.name}</p>
                    <Badge variant={album.isPublished ? 'success' : 'default'}>
                      {album.isPublished ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </div>
                  <p className="text-[var(--muted-foreground)] text-sm">
                    /{album.slug} · criado em{' '}
                    {format(album.createdAt, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <span className="font-display text-2xl text-[var(--foreground)]">
                    {album.searches}
                  </span>
                  <span className="text-[var(--muted-foreground)]">
                    {' '}
                    buscas · {album.visits} visitas
                  </span>
                  <div className="mt-1 h-1 w-32 bg-[var(--border)]">
                    <div
                      className="h-full bg-[var(--accent)]"
                      style={{ width: `${(album.searches / maxSearches) * 100}%` }}
                    />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
