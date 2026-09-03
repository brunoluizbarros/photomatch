import { getDailySeries, getFunnelStats } from '@/actions/analytics';
import { Stat } from '@/components/admin/stat';
import { Button } from '@/components/ui/button';
import { Camera, ScanFace, Users2, Wand2 } from 'lucide-react';
import Link from 'next/link';

const WINDOWS = [7, 30, 90] as const;

function formatPercent(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

// Barras diárias sobrepostas — visitas em cinza atrás, buscas em laranja na
// frente. Como buscas <= visitas sempre, a sobreposição já lê como funil sem
// precisar de duas séries lado a lado. title nativo faz de tooltip, sem JS.
function DailyBars({ series }: { series: Awaited<ReturnType<typeof getDailySeries>> }) {
  const max = Math.max(1, ...series.map((d) => d.visits));
  return (
    <figure className="m-0">
      <div className="flex h-24 items-end gap-[3px]">
        {series.map((d) => (
          <div
            key={d.day}
            className="relative h-full flex-1"
            title={`${d.day} · ${d.visits} visitas · ${d.searches} buscas · ${d.found} com foto`}
          >
            <div
              className="absolute bottom-0 w-full bg-[var(--border)]"
              style={{ height: `${(d.visits / max) * 100}%` }}
            />
            <div
              className="absolute bottom-0 w-full bg-[var(--accent)]"
              style={{ height: `${(d.searches / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex items-center gap-4 text-[var(--muted-foreground)] text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[var(--border)]" /> Visitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[var(--accent)]" /> Buscas
        </span>
      </figcaption>
    </figure>
  );
}

// Painel de analytics reutilizado no /admin (visão geral) e em
// /admin/albums/[id] (visão por evento) — mesmo componente, albumId opcional.
export async function AnalyticsPanel({
  days,
  albumId,
  basePath,
}: {
  days: number;
  albumId?: string;
  basePath: string;
}) {
  const [stats, series] = await Promise.all([
    getFunnelStats(days, albumId),
    getDailySeries(days, albumId),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl uppercase">Analytics</h2>
        <div className="flex gap-2">
          {WINDOWS.map((w) => (
            <Button key={w} asChild size="sm" variant={w === days ? 'default' : 'outline'}>
              <Link href={`${basePath}?d=${w}`}>{w}d</Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={Users2} label="Visitas" value={stats.visits} />
        <Stat
          icon={ScanFace}
          label="Buscas"
          value={stats.searches}
          hint={`${formatPercent(stats.searchRate)} das visitas`}
        />
        <Stat
          icon={Camera}
          label="Encontrou fotos"
          value={stats.found}
          hint={`${formatPercent(stats.successRate)} de sucesso`}
        />
        <Stat icon={Wand2} label="Pessoas únicas" value={stats.people} />
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-4">
        <DailyBars series={series} />
      </div>
    </div>
  );
}
