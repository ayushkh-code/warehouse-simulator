import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/types';

interface WeekTickerProps {
  state: GameState;
}

export function WeekTicker({ state }: WeekTickerProps) {
  const prevWeek = useRef(state.week);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (state.week !== prevWeek.current) {
      prevWeek.current = state.week;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [state.week]);

  const elapsed = state.week - 1;

  return (
    <div className="border-b border-slate-800 bg-slate-850 px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-medium shrink-0">
          Sim Time
        </span>
        <div className="flex items-baseline gap-3">
          <span
            className={`tabular-nums text-3xl font-bold tracking-tight text-teal-400 ${
              flash ? 'week-tick' : ''
            }`}
          >
            {String(state.week).padStart(3, '0')}
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">
              Current Week
            </span>
            <span className="tabular-nums text-xs text-slate-400">
              {elapsed} week{elapsed !== 1 ? 's' : ''} elapsed
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 tabular-nums text-[11px] text-slate-500">
          {Array.from({ length: Math.min(elapsed, 24) }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-3 rounded-sm bg-teal-500/40"
              style={{ opacity: 0.3 + (i / 24) * 0.7 }}
            />
          ))}
          {elapsed > 24 && (
            <span className="text-slate-600 ml-1">+{elapsed - 24}</span>
          )}
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] uppercase tracking-wider font-semibold ${
            state.paused
              ? 'border-slate-700 bg-slate-800 text-slate-400'
              : 'border-teal-500/40 bg-teal-500/10 text-teal-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              state.paused ? 'bg-slate-500' : 'bg-teal-400 animate-pulse'
            }`}
          />
          {state.paused ? 'Paused' : `Live · ${state.speed}×`}
        </div>
      </div>
    </div>
  );
}
