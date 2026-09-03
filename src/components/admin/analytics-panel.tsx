import { getDailySeries, getFunnelStats } from '@/actions/analytics';
import { Stat } from '@/components/admin/stat';
import { Button } from '@/components/ui/button';
import { Camera, ScanFace, Users2, Wand2 } from 'lucide-react';
import Link from 'next/link';

const WINDOWS = [7, 30, 90] as const;

function formatPercent(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

// Arredonda o teto do eixo Y pra um valor "redondo" (1/2/5 x potência de 10)
// acima do máximo real — sem isso a grade rotularia com números quebrados.
function niceCeil(n: number): number {
  if (n <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(n));
  const normalized = n / magnitude;
  const step = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function formatDayLabel(day: string): string {
  const [, month, date] = day.split('-');
  return `${date}/${month}`;
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 150;
const MARGIN = { top: 8, right: 8, bottom: 20, left: 30 };
const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

// Barras diárias sobrepostas — visitas em cinza atrás, buscas em laranja na
// frente. Como buscas <= visitas sempre, a sobreposição já lê como funil sem
// precisar de duas séries lado a lado. Eixo Y com escala numérica (0, meio,
// topo) e eixo X com algumas datas, pra parar de ler como "uma barra solta".
// <title> nativo faz de tooltip por barra, sem JS.
function DailyBars({ series }: { series: Awaited<ReturnType<typeof getDailySeries>> }) {
  const maxRaw = Math.max(1, ...series.map((d) => d.visits));
  const yMax = niceCeil(maxRaw);
  const yMid = Math.round(yMax / 2);

  function y(value: number) {
    return MARGIN.top + PLOT_HEIGHT - (value / yMax) * PLOT_HEIGHT;
  }

  const slotWidth = PLOT_WIDTH / series.length;
  const barWidth = Math.max(1, slotWidth - 2);
  const xLabelEvery = Math.max(1, Math.ceil(series.length / 6));

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Visitas e buscas por dia, de ${series[0]?.day} a ${series[series.length - 1]?.day}`}
      >
        {[0, yMid, yMax].map((v) => (
          <g key={v}>
            <line
              x1={MARGIN.left}
              x2={CHART_WIDTH - MARGIN.right}
              y1={y(v)}
              y2={y(v)}
              className="stroke-[var(--border)]"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 6}
              y={y(v)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-[var(--muted-foreground)]"
              fontSize={9}
            >
              {v}
            </text>
          </g>
        ))}

        {series.map((d, i) => {
          const x = MARGIN.left + i * slotWidth + (slotWidth - barWidth) / 2;
          const isLabeled = i % xLabelEvery === 0 || i === series.length - 1;
          return (
            <g key={d.day}>
              <title>{`${d.day} · ${d.visits} visitas · ${d.searches} buscas · ${d.found} com foto`}</title>
              <rect
                x={x}
                y={y(d.visits)}
                width={barWidth}
                height={y(0) - y(d.visits)}
                className="fill-[var(--border)]"
              />
              <rect
                x={x}
                y={y(d.searches)}
                width={barWidth}
                height={y(0) - y(d.searches)}
                className="fill-[var(--accent)]"
              />
              {isLabeled && (
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 4}
                  textAnchor="middle"
                  className="fill-[var(--muted-foreground)]"
                  fontSize={8}
                >
                  {formatDayLabel(d.day)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex items-center gap-4 text-[var(--muted-foreground)] text-xs">
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
