import { DIFFICULTY_CONFIG } from '../game/constants';
import type { Difficulty, GameState } from '../game/types';
import { formatCurrency, formatNumber, formatScore, score } from '../game/utils';

interface DifficultySelectProps {
  onSelect: (d: Difficulty) => void;
}

export function DifficultySelect({ onSelect }: DifficultySelectProps) {
  return (
    <div className="min-h-screen flex items-center justify-center game-shell p-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30">
            <span className="text-lg">📦</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#8b5cf6] font-bold">
              Fulfillment Tycoon
            </span>
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] via-[#c4b5fd] to-[#f0c14b] tracking-tight mb-3">
            Warehouse Simulator
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
            Balance inventory, labor, and equipment. Survive longer to rack up points.
            Read the forecast, dodge curveballs, grow net worth.
          </p>
        </div>

        <div className="grid gap-3">
          {(['easy', 'normal', 'hard'] as const).map((d) => {
            const cfg = DIFFICULTY_CONFIG[d];
            const accent =
              d === 'easy'
                ? 'hover:border-[#34d399]/50'
                : d === 'hard'
                  ? 'hover:border-[#fb7185]/50'
                  : 'hover:border-[#22d3ee]/50';
            return (
              <button
                key={d}
                onClick={() => onSelect(d)}
                className={`game-panel text-left p-4 transition-all ${accent} hover:scale-[1.01]`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-100">{cfg.label}</span>
                  <span className="tabular-nums text-sm text-[#f0c14b]">
                    {formatCurrency(cfg.startingCash)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Demand {(cfg.demandGrowth * 100).toFixed(1)}%/wk · Events{' '}
                  {d === 'easy' ? 'sparse' : d === 'hard' ? 'frequent' : 'normal'}
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

  return (
    <div className="fixed inset-0 bg-[#080c18]/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="game-panel game-panel-accent-violet p-8 max-w-md w-full text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8b5cf6] font-bold mb-2">
          Run Complete
        </p>
        <div className="tabular-nums text-5xl font-bold text-[#f0c14b] mb-1 score-pop">
          {formatScore(finalScore)}
        </div>
        <p className="text-xs text-slate-500 mb-1">final score</p>
        <p className="text-sm text-[#fb7185] mb-6">{state.gameOverReason}</p>

        <div className="grid grid-cols-2 gap-3 text-left mb-6">
          {[
            ['Weeks Survived', formatNumber(state.week)],
            ['Net Worth', formatCurrency(state.netWorth)],
            ['Peak Backlog', formatNumber(Math.max(...state.history.map((h) => h.backlog), state.backlog))],
            ['Throughput Cap', formatNumber(state.throughputCapacity)],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#1a2540]/60 rounded-lg p-2.5 border border-[#243052]">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
              <div className="tabular-nums text-sm font-semibold text-slate-200 mt-0.5">
                {value}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3 game-btn-gold rounded-lg text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
