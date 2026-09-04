import { getDailySeries, getFunnelStats } from '@/actions/analytics';
import { DailyChart } from '@/components/admin/daily-chart';
import { Stat } from '@/components/admin/stat';
import { Button } from '@/components/ui/button';
import { Camera, ScanFace, Users2, Wand2 } from 'lucide-react';
import Link from 'next/link';

const WINDOWS = [7, 30, 90] as const;

function formatPercent(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

// Painel de analytics reutilizado no /admin (visão geral) e em
// /admin/events/[id] (visão por evento) — mesmo componente, eventId opcional.
export async function AnalyticsPanel({
  days,
  eventId,
  basePath,
}: {
  days: number;
  eventId?: string;
  basePath: string;
}) {
  const [stats, series] = await Promise.all([
    getFunnelStats(days, eventId),
    getDailySeries(days, eventId),
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

      <DailyChart series={series} />
    </div>
  );
}
