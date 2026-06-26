import type { GameSpeed, GameState } from '../game/types';
import {
  BACKLOG_HARD_THRESHOLD,
  NEGATIVE_CASH_LIMIT,
} from '../game/constants';
import {
  backlogRatio,
  backlogStress,
  BACKLOG_STRESS_COLORS,
  formatBacklogRatio,
  formatCurrency,
  formatNumber,
} from '../game/utils';

interface TopBarProps {
  state: GameState;
  onTogglePause: () => void;
  onSetSpeed: (speed: GameSpeed) => void;
}

function Stat({
  label,
  value,
  sub,
  alert,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col min-w-[100px]">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
        {label}
      </span>
      <span
        className={`tabular-nums text-lg font-semibold leading-tight ${
          valueClass ?? (alert ? 'text-amber-400 stat-flash' : 'text-slate-100')
        }`}
      >
        {value}
      </span>
      {sub && (
        <span className="tabular-nums text-[11px] text-slate-500">{sub}</span>
      )}
    </div>
  );
}

function MoraleGauge({ morale }: { morale: number }) {
  const color =
    morale >= 70 ? 'bg-teal-500' : morale >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex flex-col min-w-[120px]">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
        Morale
      </span>
      <div className="flex items-center gap-2 mt-0.5">
        <div className="flex-1 h-2 bg-slate-800 rounded-sm overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500`}
            style={{ width: `${morale}%` }}
          />
        </div>
        <span className="tabular-nums text-sm font-semibold text-slate-200 w-8 text-right">
          {Math.round(morale)}
        </span>
      </div>
    </div>
  );
}

export function TopBar({ state, onTogglePause, onSetSpeed }: TopBarProps) {
  const cashAlert = state.cash < 0;
  const ratio = backlogRatio(state.backlog, state.throughputCapacity);
  const stress = backlogStress(ratio);
  const backlogAlert = stress === 'churn' || stress === 'critical';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
        <h1 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
          Warehouse Simulator
        </h1>
        <span className="text-slate-600">|</span>
        <span className="tabular-nums text-teal-400 font-semibold">
          WK {state.week}
        </span>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <Stat
          label="Cash"
          value={formatCurrency(state.cash)}
          alert={cashAlert}
          valueClass={cashAlert ? 'text-red-400 stat-flash' : undefined}
          sub={
            state.negativeCashWeeks > 0
              ? `${state.negativeCashWeeks}/${NEGATIVE_CASH_LIMIT}wk deficit`
              : undefined
          }
        />
        <Stat label="Net Worth" value={formatCurrency(state.netWorth)} />
        <Stat
          label="Backlog"
          value={formatBacklogRatio(ratio)}
          valueClass={BACKLOG_STRESS_COLORS[stress]}
          alert={backlogAlert}
          sub={`${formatNumber(state.backlog)} units · fail ${BACKLOG_HARD_THRESHOLD}×`}
        />
        <Stat label="Inventory" value={formatNumber(state.inventory)} />
        <MoraleGauge morale={state.morale} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePause}
          className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 transition-colors"
        >
          {state.paused ? '▶ Play' : '⏸ Pause'}
        </button>
        {([1, 2, 4] as const).map((spd) => (
          <button
            key={spd}
            onClick={() => onSetSpeed(spd)}
            className={`px-2.5 py-1.5 text-xs tabular-nums font-medium rounded border transition-colors ${
              state.speed === spd
                ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {spd}×
          </button>
        ))}
      </div>
    </header>
  );
}
