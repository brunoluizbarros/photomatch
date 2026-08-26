import { listAlbums } from '@/actions/albums';
import { AlbumCreateForm } from '@/components/admin/album-create-form';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default async function AdminPage() {
  const albums = await listAlbums();

  return (
    <div className="space-y-8">
      <AlbumCreateForm />

      <div className="space-y-3">
        <h2 className="font-semibold">Álbuns</h2>
        {albums.length === 0 && (
          <p className="text-[var(--muted-foreground)] text-sm">Nenhum álbum criado ainda.</p>
        )}
        {albums.map((album) => (
          <Link key={album.id} href={`/admin/albums/${album.id}`}>
            <Card className="flex items-center justify-between hover:bg-[var(--muted)]">
              <div>
                <p className="font-medium">{album.name}</p>
                <p className="text-[var(--muted-foreground)] text-sm">/{album.slug}</p>
              </div>
              <Badge variant={album.isPublished ? 'success' : 'default'}>
                {album.isPublished ? 'Publicado' : 'Rascunho'}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
