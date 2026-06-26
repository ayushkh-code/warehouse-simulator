import {
  BACKLOG_HARD_THRESHOLD,
  BACKLOG_SOFT_THRESHOLD,
  NEGATIVE_CASH_LIMIT,
} from '../game/constants';
import type { GameState } from '../game/types';
import {
  backlogRatio,
  backlogStress,
  BACKLOG_STRESS_COLORS,
  diagnoseBottleneck,
  effectiveCapacity,
  formatBacklogRatio,
  formatNumber,
  inventoryRunwayWeeks,
} from '../game/utils';

function ThresholdMeter({
  label,
  value,
  max,
  thresholds,
  formatValue,
  invertStress,
}: {
  label: string;
  value: number;
  max: number;
  thresholds: { at: number; label: string; color: string }[];
  formatValue: (v: number) => string;
  invertStress?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);

  let stress: 'ok' | 'warning' | 'critical' = 'ok';
  if (invertStress) {
    if (value <= thresholds[0]?.at) stress = 'critical';
    else if (value <= thresholds[1]?.at) stress = 'warning';
  } else {
    if (value >= thresholds[thresholds.length - 1]?.at) stress = 'critical';
    else if (value >= thresholds[thresholds.length - 2]?.at) stress = 'warning';
  }

  const barColor =
    stress === 'critical'
      ? 'bg-red-500'
      : stress === 'warning'
        ? 'bg-amber-500'
        : 'bg-teal-500';

  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[9px] uppercase tracking-widest text-slate-500">{label}</span>
        <span
          className={`tabular-nums text-sm font-semibold ${
            stress === 'critical'
              ? 'text-red-400'
              : stress === 'warning'
                ? 'text-amber-400'
                : 'text-slate-200'
          }`}
        >
          {formatValue(value)}
        </span>
      </div>
      <div className="relative h-2.5 bg-slate-800 rounded-sm overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
        {thresholds.map((t) => (
          <div
            key={t.at}
            className="absolute top-0 bottom-0 w-px bg-slate-600/80"
            style={{ left: `${(t.at / max) * 100}%` }}
            title={t.label}
          />
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        {thresholds.map((t) => (
          <span
            key={t.at}
            className="text-[8px] text-slate-600 tabular-nums"
            style={{ marginLeft: t.at === thresholds[0].at ? 0 : undefined }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HealthPanel({ state }: { state: GameState }) {
  const ratio = backlogRatio(state.backlog, state.throughputCapacity);
  const stress = backlogStress(ratio);
  const diag = diagnoseBottleneck(state);
  const cap = effectiveCapacity(state);
  const forecastDemand = state.forecast[0] ?? 0;
  const invRunway = inventoryRunwayWeeks(state.inventory, forecastDemand);
  const last = state.history[state.history.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium">
        Ops Health
      </h2>

      <div className="flex flex-wrap gap-4">
        <ThresholdMeter
          label="Backlog vs Capacity"
          value={ratio}
          max={BACKLOG_HARD_THRESHOLD}
          thresholds={[
            { at: BACKLOG_SOFT_THRESHOLD, label: `${BACKLOG_SOFT_THRESHOLD}× churn`, color: 'amber' },
            { at: BACKLOG_HARD_THRESHOLD, label: `${BACKLOG_HARD_THRESHOLD}× fail`, color: 'red' },
          ]}
          formatValue={formatBacklogRatio}
        />
        <ThresholdMeter
          label="Cash Deficit Streak"
          value={state.negativeCashWeeks}
          max={NEGATIVE_CASH_LIMIT}
          thresholds={[
            { at: 1, label: '1wk', color: 'amber' },
            { at: NEGATIVE_CASH_LIMIT, label: `${NEGATIVE_CASH_LIMIT}wk fail`, color: 'red' },
          ]}
          formatValue={(v) => `${v}/${NEGATIVE_CASH_LIMIT} wk`}
        />
        <ThresholdMeter
          label="Inventory Runway"
          value={invRunway}
          max={6}
          invertStress
          thresholds={[
            { at: 1, label: '1wk', color: 'red' },
            { at: 2, label: '2wk', color: 'amber' },
          ]}
          formatValue={(v) => `${v.toFixed(1)} wk`}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="bg-slate-850 rounded px-2 py-1.5 border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">Backlog</div>
          <div className={`tabular-nums font-semibold ${BACKLOG_STRESS_COLORS[stress]}`}>
            {formatBacklogRatio(ratio)} cap
          </div>
          <div className="text-slate-600 tabular-nums">{formatNumber(state.backlog)} units</div>
        </div>
        <div className="bg-slate-850 rounded px-2 py-1.5 border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">Eff. Capacity</div>
          <div className="tabular-nums font-semibold text-slate-200">
            {formatNumber(cap)}/wk
          </div>
          <div className="text-slate-600">vs {formatNumber(forecastDemand)} forecast</div>
        </div>
        <div className="bg-slate-850 rounded px-2 py-1.5 border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">Constraint</div>
          <div className="font-semibold text-slate-300">{diag.label}</div>
          <div className="text-slate-600 leading-tight">{diag.detail}</div>
        </div>
        <div className="bg-slate-850 rounded px-2 py-1.5 border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase">Last Week</div>
          {last ? (
            <>
              <div className="tabular-nums text-slate-300">
                {formatNumber(last.throughput)} shipped
              </div>
              <div className="text-slate-600 tabular-nums">
                {formatNumber(last.demand)} demand ·{' '}
                <span className={last.throughput < last.demand ? 'text-amber-400' : 'text-teal-400'}>
                  {last.throughput < last.demand ? '+' : ''}
                  {formatNumber(last.demand - last.throughput)} gap
                </span>
              </div>
            </>
          ) : (
            <div className="text-slate-600">Waiting for week 1…</div>
          )}
        </div>
      </div>
    </div>
  );
}
