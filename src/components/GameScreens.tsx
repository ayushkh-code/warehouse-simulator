import { DIFFICULTY_CONFIG } from '../game/constants';
import type { Difficulty, GameState } from '../game/types';
import { formatCurrency, formatNumber, score } from '../game/utils';

interface DifficultySelectProps {
  onSelect: (d: Difficulty) => void;
}

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
              Fulfillment Ops
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-100 tracking-tight mb-2">
            Warehouse Simulator
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
            Run a fulfillment warehouse. Balance inventory, labor, and equipment against
            incoming demand. Read the forecast, plan ahead, survive the chaos.
          </p>
        </div>

        <div className="grid gap-3">
          {(['easy', 'normal', 'hard'] as const).map((d) => {
            const cfg = DIFFICULTY_CONFIG[d];
            return (
              <button
                key={d}
                onClick={() => onSelect(d)}
                className="group text-left p-4 rounded-lg border border-slate-800 bg-slate-900 hover:border-teal-500/50 hover:bg-slate-850 transition-all"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200 group-hover:text-teal-400 transition-colors">
                    {cfg.label}
                  </span>
                  <span className="tabular-nums text-sm text-slate-400">
                    {formatCurrency(cfg.startingCash)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Demand growth {(cfg.demandGrowth * 100).toFixed(1)}%/wk · Event freq{' '}
                  {d === 'easy' ? 'low' : d === 'hard' ? 'high' : 'normal'}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface GameOverProps {
  state: GameState;
  onRestart: () => void;
}

export function GameOver({ state, onRestart }: GameOverProps) {
  const finalScore = score(state);
  const won = !state.gameOverReason?.includes('Insolvent') && !state.gameOverReason?.includes('collapsed');

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-semibold text-slate-100 mb-1">
          {won ? 'Operations Halted' : 'Game Over'}
        </h2>
        <p className="text-sm text-red-400 mb-6">{state.gameOverReason}</p>

        <div className="grid grid-cols-2 gap-3 text-left mb-6">
          {[
            ['Weeks Survived', formatNumber(state.week)],
            ['Final Net Worth', formatCurrency(state.netWorth)],
            ['Score', formatNumber(finalScore)],
            ['Peak Backlog', formatNumber(Math.max(...state.history.map((h) => h.backlog), state.backlog))],
            ['Labor Force', formatNumber(state.laborForce)],
            ['Throughput Cap', formatNumber(state.throughputCapacity)],
          ].map(([label, value]) => (
            <div key={label} className="bg-slate-800/50 rounded p-2">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
              <div className="tabular-nums text-sm font-semibold text-slate-200 mt-0.5">
                {value}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="w-full py-2.5 bg-teal-500/20 border border-teal-500 text-teal-300 rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-teal-500/30 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
