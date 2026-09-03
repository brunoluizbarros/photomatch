import { getPendingAccessRequestCount } from '@/actions/access-requests';
import { getStatsByEvent } from '@/actions/analytics';
import { getDashboardStats, listEvents } from '@/actions/events';
import { AnalyticsPanel } from '@/components/admin/analytics-panel';
import { EventCreateWizard } from '@/components/admin/event-create-wizard';
import { Stat } from '@/components/admin/stat';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/require-admin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Camera, CheckCircle2, FolderOpen, Inbox, ScanFace } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_WINDOW_DAYS = 30;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const days = Number(d) || DEFAULT_WINDOW_DAYS;
  const { role } = await requireUser();
  const isAdmin = role === 'admin';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--foreground)] uppercase">Painel</h1>
        {isAdmin && <EventCreateWizard />}
      </div>

      {isAdmin ? <AdminOverview days={days} /> : <NonAdminOverview />}
    </div>
  );
}

// Visão completa: estatísticas, analytics e lista de eventos com número de
// buscas/visitas — só o admin administra eventos e vê essas métricas.
async function AdminOverview({ days }: { days: number }) {
  const [stats, eventStats, pendingRequests] = await Promise.all([
    getDashboardStats(),
    getStatsByEvent(days),
    getPendingAccessRequestCount(),
  ]);
  const maxSearches = Math.max(1, ...eventStats.map((e) => e.searches));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat icon={FolderOpen} label="Eventos" value={stats.events.total} />
        <Stat icon={CheckCircle2} label="Publicados" value={stats.events.published} />
        <Stat icon={Camera} label="Fotos" value={stats.photos.total} />
        <Stat icon={ScanFace} label="Indexadas" value={stats.photos.indexed} />
        <Stat icon={Inbox} label="Pedidos pendentes" value={pendingRequests} />
      </div>

      <AnalyticsPanel days={days} basePath="/admin" />

      <div className="space-y-3">
        <h2 className="font-display text-[var(--foreground)] text-xl uppercase">Eventos</h2>
        {eventStats.length === 0 && (
          <p className="text-[var(--muted-foreground)] text-sm">Nenhum evento criado ainda.</p>
        )}
        <div className="space-y-3">
          {eventStats.map((event) => (
            <Link key={event.eventId} href={`/admin/events/${event.eventId}`}>
              <Card className="flex items-center justify-between gap-4 transition-colors hover:border-[var(--accent)]">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--foreground)]">{event.name}</p>
                    <Badge variant={event.isPublished ? 'success' : 'default'}>
                      {event.isPublished ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </div>
                  <p className="text-[var(--muted-foreground)] text-sm">
                    /{event.slug} · criado em{' '}
                    {format(event.createdAt, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <span className="font-display text-2xl text-[var(--foreground)]">
                    {event.searches}
                  </span>
                  <span className="text-[var(--muted-foreground)]">
                    {' '}
                    buscas · {event.visits} visitas
                  </span>
                  <div className="mt-1 h-1 w-32 bg-[var(--border)]">
                    <div
                      className="h-full bg-[var(--accent)]"
                      style={{ width: `${(event.searches / maxSearches) * 100}%` }}
                    />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

// Fotógrafo e atendimento: sem métricas de negócio, só a lista de eventos
// pra navegar até a galeria de fotos.
async function NonAdminOverview() {
  const eventList = await listEvents();

  return (
    <div className="space-y-3">
      <h2 className="font-display text-[var(--foreground)] text-xl uppercase">Eventos</h2>
      {eventList.length === 0 && (
        <p className="text-[var(--muted-foreground)] text-sm">Nenhum evento criado ainda.</p>
      )}
      <div className="space-y-3">
        {eventList.map((event) => (
          <Link key={event.id} href={`/admin/events/${event.id}`}>
            <Card className="flex items-center justify-between gap-4 transition-colors hover:border-[var(--accent)]">
              <div>
                <p className="font-semibold text-[var(--foreground)]">{event.name}</p>
                <p className="text-[var(--muted-foreground)] text-sm">
                  criado em {format(event.createdAt, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
