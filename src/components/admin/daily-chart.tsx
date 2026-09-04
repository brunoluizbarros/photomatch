'use client';

import type { getDailySeries } from '@/actions/analytics';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';

type DailyPoint = Awaited<ReturnType<typeof getDailySeries>>[number];

// recharts desenha em SVG (fill/stroke), não dá pra usar classe Tailwind
// aqui — mesmo hex dos tokens em src/app/globals.css (--border, --muted-
// foreground, --accent).
const GRID_COLOR = '#e5e7eb';
const AXIS_COLOR = '#6b7280';
const VISITS_COLOR = '#e5e7eb';
const SEARCHES_COLOR = '#7a1fe0';

// Mais de ~14 rótulos no eixo X (ex: janela de 90 dias) começam a se
// sobrepor — mostra só um a cada N pra período longo não quebrar o layout.
const MAX_X_LABELS = 14;

function formatDayLabel(day: string): string {
  const [, month, date] = day.split('-');
  return `${date}/${month}`;
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-[var(--foreground)]">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[var(--muted-foreground)]">
          {p.name}: <span className="font-semibold text-[var(--foreground)]">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// Gráfico diário via recharts — troca o SVG feito à mão. O original
// sobrepunha visitas (atrás) e buscas (na frente) na mesma barra, como um
// funil; recharts sem stackId agrupa lado a lado por padrão, então o
// resultado aqui é duas barras por dia (visitas | buscas) em vez de
// sobrepostas — mais robusto que forçar sobreposição via barGap negativo.
export function DailyChart({ series }: { series: DailyPoint[] }) {
  const chartData = series.map((d) => ({ ...d, label: formatDayLabel(d.day) }));
  const xInterval = series.length > MAX_X_LABELS ? Math.ceil(series.length / MAX_X_LABELS) : 0;

  return (
    <div className="h-64 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: -20, top: 4 }}>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} />
          <XAxis
            dataKey="label"
            interval={xInterval}
            tick={{ fontSize: 11, fill: AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={ChartTooltip} cursor={{ fill: '#f4f5f7' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="visits"
            name="Visitas"
            fill={VISITS_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="searches"
            name="Buscas"
            fill={SEARCHES_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
