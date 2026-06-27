import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GameState } from '../game/types';
import { effectiveCapacity, formatNumber, stressColor } from '../game/utils';

interface ForecastChartProps {
  state: GameState;
}

const STRESS_COLORS = {
  green: '#14b8a6',
  amber: '#f59e0b',
  red: '#ef4444',
};

export function ForecastChart({ state }: ForecastChartProps) {
  const cap = effectiveCapacity(state);

  const data = state.forecast.map((demand, i) => ({
    week: `W${state.forecastWeeks[i]}`,
    demand,
    capacity: cap,
    stress: stressColor(demand, cap),
  }));

  return (
    <div className="game-panel game-panel-accent-violet p-4 flex-1 min-h-[280px]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-[#8b5cf6] font-bold">
            Demand Forecast
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Next 10 weeks · Effective capacity:{' '}
            <span className="text-teal-400 tabular-nums">{formatNumber(cap)}/wk</span>
          </p>
        </div>
        <div className="flex gap-3 text-[10px] uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-teal-500" /> Under
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-500" /> Near
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-red-500" /> Over
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2532" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#5c6b7e', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            axisLine={{ stroke: '#2a3544' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#5c6b7e', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: '#111820',
              border: '1px solid #2a3544',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'IBM Plex Mono',
            }}
            formatter={(value) => [
              formatNumber(Number(value ?? 0)),
              'Forecast',
            ]}
          />
          <Bar dataKey="demand" radius={[2, 2, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={index} fill={STRESS_COLORS[entry.stress]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
