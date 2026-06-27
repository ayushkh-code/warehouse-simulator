import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/types';
import { formatScore } from '../game/utils';

interface WeekTickerProps {
  state: GameState;
}

export function WeekTicker({ state }: WeekTickerProps) {
  const prevWeek = useRef(state.week);
  const [flash, setFlash] = useState(false);
  const [pointsFlash, setPointsFlash] = useState(false);

  useEffect(() => {
    if (state.week !== prevWeek.current) {
      prevWeek.current = state.week;
      setFlash(true);
      setPointsFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      const t2 = setTimeout(() => setPointsFlash(false), 1400);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
  }, [state.week]);

  const elapsed = state.week - 1;

  return (
    <div className="game-week-strip px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-5 min-w-0">
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[8px] uppercase tracking-[0.3em] text-[#8b5cf6] font-bold">
            Week
          </span>
          <span
            className={`tabular-nums text-4xl font-bold tracking-tight text-[#22d3ee] drop-shadow-[0_0_12px_rgba(34,211,238,0.3)] ${
              flash ? 'week-tick' : ''
            }`}
          >
            {String(state.week).padStart(3, '0')}
          </span>
        </div>

        <div className="h-10 w-px bg-[#243052]" />

        <div>
          <div className="tabular-nums text-sm font-semibold text-slate-300">
            {elapsed} week{elapsed !== 1 ? 's' : ''} survived
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Longer runs earn escalating points each week
          </div>
        </div>

        {state.lastWeekPoints > 0 && pointsFlash && (
          <span className="points-float tabular-nums text-sm font-bold text-[#f0c14b]">
            +{formatScore(state.lastWeekPoints)} pts
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-end gap-0.5 h-8">
          {Array.from({ length: Math.min(elapsed, 20) }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 rounded-t-sm bg-gradient-to-t from-[#8b5cf6]/40 to-[#22d3ee]/70"
              style={{ height: `${20 + (i / 20) * 80}%` }}
            />
          ))}
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${
            !state.gameStarted
              ? 'bg-[#f0c14b]/10 border border-[#f0c14b]/40 text-[#f0c14b]'
              : state.paused
                ? 'bg-[#1a2540] border border-[#243052] text-slate-500'
                : 'bg-[#22d3ee]/10 border border-[#22d3ee]/40 text-[#22d3ee]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              !state.gameStarted
                ? 'bg-[#f0c14b]'
                : state.paused
                  ? 'bg-slate-600'
                  : 'bg-[#22d3ee] animate-pulse shadow-[0_0_8px_#22d3ee]'
            }`}
          />
          {!state.gameStarted
            ? 'Ready'
            : state.paused
              ? 'Paused'
              : `Running ${state.speed}×`}
        </div>
      </div>
    </div>
  );
}
