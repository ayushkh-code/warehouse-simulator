import { DIFFICULTY_CONFIG } from '../game/constants';
import type { GameState } from '../game/types';

interface StartGameOverlayProps {
  state: GameState;
  onStart: () => void;
}

export function StartGameOverlay({ state, onStart }: StartGameOverlayProps) {
  const cfg = DIFFICULTY_CONFIG[state.difficulty];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080c18]/70 backdrop-blur-[2px]">
      <div className="game-panel game-panel-accent-cyan px-8 py-7 text-center max-w-sm mx-4 shadow-2xl">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#8b5cf6] font-bold mb-2">
          {cfg.label} · Ready
        </p>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Set up your ops</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Review the forecast and command panel, place orders, then start the clock when
          you&apos;re ready.
        </p>
        <button
          onClick={onStart}
          className="w-full py-3 game-btn-primary rounded-xl text-sm font-bold uppercase tracking-[0.15em]"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}

interface PauseButtonProps {
  paused: boolean;
  onToggle: () => void;
}

export function PauseButton({ paused, onToggle }: PauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? 'Resume game' : 'Pause game'}
      className="fixed top-3 right-3 z-50 w-11 h-11 rounded-xl bg-[#141e36]/95 border border-[#243052] flex items-center justify-center text-base leading-none shadow-lg backdrop-blur-sm transition-all hover:border-[#22d3ee]/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] active:scale-95"
    >
      <span className="select-none text-[#22d3ee]">
        {paused ? (
          <span className="text-lg leading-none">▶</span>
        ) : (
          <span className="flex gap-[3px] items-center justify-center">
            <span className="w-[3px] h-3.5 bg-[#22d3ee] rounded-[1px]" />
            <span className="w-[3px] h-3.5 bg-[#22d3ee] rounded-[1px]" />
          </span>
        )}
      </span>
    </button>
  );
}
