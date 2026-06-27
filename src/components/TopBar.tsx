import type { GameSpeed, GameState } from '../game/types';
import {
  BACKLOG_HARD_THRESHOLD,
  NEGATIVE_CASH_LIMIT,
} from '../game/constants';
import {
  backlogRatio,
  backlogStress,
  formatBacklogRatio,
  formatCurrency,
  formatNumber,
  formatScore,
} from '../game/utils';

interface TopBarProps {
  state: GameState;
  onSetSpeed: (speed: GameSpeed) => void;
}

const STRESS_COLORS = {
  ok: 'text-[#34d399]',
  watch: 'text-[#f0c14b]',
  churn: 'text-[#fb923c]',
  critical: 'text-[#fb7185]',
};

function Stat({
  label,
  value,
  sub,
  valueClass,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col min-w-[90px] px-2 py-1 rounded-md ${
        highlight ? 'game-score-badge' : ''
      }`}
    >
      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">
        {label}
      </span>
      <span
        className={`tabular-nums text-lg font-semibold leading-tight ${
          valueClass ?? 'text-slate-100'
        }`}
      >
        {value}
      </span>
      {sub && (
        <span className="tabular-nums text-[10px] text-slate-500">{sub}</span>
      )}
    </div>
  );
}

function MoraleGauge({ morale }: { morale: number }) {
  const color =
    morale >= 70 ? 'bg-[#34d399]' : morale >= 40 ? 'bg-[#f0c14b]' : 'bg-[#fb7185]';
  return (
    <div className="flex flex-col min-w-[110px] px-2">
      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">
        Morale
      </span>
      <div className="flex items-center gap-2 mt-0.5">
        <div className="flex-1 h-2 bg-[#1a2540] rounded-full overflow-hidden border border-[#243052]">
          <div
            className={`h-full ${color} transition-all duration-500 rounded-full`}
            style={{ width: `${morale}%` }}
          />
        </div>
        <span className="tabular-nums text-sm font-semibold text-slate-200 w-7 text-right">
          {Math.round(morale)}
        </span>
      </div>
    </div>
  );
}

export function TopBar({ state, onSetSpeed }: TopBarProps) {
  const cashAlert = state.cash < 0;
  const ratio = backlogRatio(state.backlog, state.throughputCapacity);
  const stress = backlogStress(ratio);

  return (
    <header className="game-hud-bar px-4 py-2.5 pr-16 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#22d3ee]/30 to-[#8b5cf6]/30 border border-[#22d3ee]/30 flex items-center justify-center">
          <span className="text-sm">📦</span>
        </div>
        <div>
          <h1 className="text-xs font-bold tracking-[0.15em] text-[#22d3ee] uppercase">
            Warehouse Simulator
          </h1>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">
            {state.difficulty} mode
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <Stat
          label="Score"
          value={formatScore(state.score)}
          highlight
          valueClass="text-[#f0c14b]"
          sub={state.lastWeekPoints > 0 ? `+${formatScore(state.lastWeekPoints)} last wk` : undefined}
        />
        <Stat
          label="Cash"
          value={formatCurrency(state.cash)}
          valueClass={cashAlert ? 'text-[#fb7185] stat-flash' : 'text-[#34d399]'}
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
          valueClass={STRESS_COLORS[stress]}
          sub={`fail ${BACKLOG_HARD_THRESHOLD}×`}
        />
        <Stat label="Stock" value={formatNumber(state.inventory)} />
        <MoraleGauge morale={state.morale} />
      </div>

      {state.gameStarted && (
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-600 mr-1 hidden sm:inline">
            Speed
          </span>
          {([1, 2, 4] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSpeed(spd)}
              className={`px-2 py-1 text-xs tabular-nums font-bold rounded-md border transition-all ${
                state.speed === spd
                  ? 'bg-[#8b5cf6]/25 border-[#8b5cf6]/60 text-[#c4b5fd]'
                  : 'bg-[#1a2540] border-[#243052] text-slate-500 hover:text-slate-300'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
