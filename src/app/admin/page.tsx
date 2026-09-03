import { getDashboardStats, listAlbums } from '@/actions/albums';
import { AlbumCreateForm } from '@/components/admin/album-create-form';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Camera, CheckCircle2, FolderOpen, ScanFace } from 'lucide-react';
import Link from 'next/link';

// Cards de estatística — porta o padrão de dashboard do ticketeria-techstage
// (ícone + número grande + label), adaptado pro domínio de álbuns/fotos.
function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderOpen;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <Icon className="size-6 text-[var(--accent)]" />
      <p className="mt-2 font-display text-4xl text-[var(--foreground)]">{value}</p>
      <p className="text-[var(--muted-foreground)] text-sm">{label}</p>
    </Card>
  );
}

export default async function AdminPage() {
  const [albums, stats] = await Promise.all([listAlbums(), getDashboardStats()]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-[var(--foreground)] uppercase">Painel</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={FolderOpen} label="Álbuns" value={stats.albums.total} />
        <Stat icon={CheckCircle2} label="Publicados" value={stats.albums.published} />
        <Stat icon={Camera} label="Fotos" value={stats.photos.total} />
        <Stat icon={ScanFace} label="Indexadas" value={stats.photos.indexed} />
      </div>

      <AlbumCreateForm />

      <div className="space-y-3">
        <h2 className="font-display text-[var(--foreground)] text-xl uppercase">Álbuns</h2>
        {albums.length === 0 && (
          <p className="text-[var(--muted-foreground)] text-sm">Nenhum álbum criado ainda.</p>
        )}
        <div className="space-y-3">
          {albums.map((album) => (
            <Link key={album.id} href={`/admin/albums/${album.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:border-[var(--accent)]">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{album.name}</p>
                  <p className="text-[var(--muted-foreground)] text-sm">
                    /{album.slug} · criado em{' '}
                    {format(album.createdAt, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <Badge variant={album.isPublished ? 'success' : 'default'}>
                  {album.isPublished ? 'Publicado' : 'Rascunho'}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
