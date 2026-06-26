import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BACKLOG_HARD_THRESHOLD, BACKLOG_SOFT_THRESHOLD } from '../game/constants';
import type { GameState } from '../game/types';
import { formatBacklogRatio, formatNumber } from '../game/utils';

interface HistoryChartProps {
  state: GameState;
}

export function HistoryChart({ state }: HistoryChartProps) {
  const data = state.history.map((h) => ({
    week: `W${h.week}`,
    demand: h.demand,
    throughput: h.throughput,
    backlogRatio: Number(h.backlogRatio.toFixed(2)),
  }));

  if (data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex-1 min-h-[200px] flex items-center justify-center">
        <p className="text-slate-600 text-sm">Throughput history builds as weeks pass…</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex-1 min-h-[240px]">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-1">
        Throughput vs Demand
      </h2>
      <p className="text-[10px] text-slate-600 mb-2">
        Bottom panel: backlog in ×capacity (fail at {BACKLOG_HARD_THRESHOLD}×)
      </p>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2532" vertical={false} />
          <XAxis dataKey="week" hide />
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
            formatter={(value, name) => [
              formatNumber(Number(value ?? 0)),
              String(name),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: '#8b9bb0' }}
          />
          <Line type="monotone" dataKey="demand" stroke="#f59e0b" strokeWidth={2} dot={false} name="Demand" />
          <Line type="monotone" dataKey="throughput" stroke="#14b8a6" strokeWidth={2} dot={false} name="Throughput" />
        </LineChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2532" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#5c6b7e', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
            axisLine={{ stroke: '#2a3544' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, BACKLOG_HARD_THRESHOLD + 1]}
            tick={{ fill: '#5c6b7e', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => `${v}×`}
          />
          <Tooltip
            contentStyle={{
              background: '#111820',
              border: '1px solid #2a3544',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'IBM Plex Mono',
            }}
            formatter={(value) => [formatBacklogRatio(Number(value ?? 0)), 'Backlog']}
          />
          <ReferenceLine y={BACKLOG_SOFT_THRESHOLD} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'churn', fill: '#f59e0b', fontSize: 9 }} />
          <ReferenceLine y={BACKLOG_HARD_THRESHOLD} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'fail', fill: '#ef4444', fontSize: 9 }} />
          <Line type="monotone" dataKey="backlogRatio" stroke="#f87171" strokeWidth={2} dot={false} name="Backlog ×cap" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
