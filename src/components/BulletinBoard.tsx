import type { GameState } from '../game/types';
import { buildBulletinItems, type BulletinItem } from '../game/utils';

interface BulletinBoardProps {
  state: GameState;
  onDismiss: (id: string) => void;
}

const SEVERITY_STYLES: Record<BulletinItem['severity'], string> = {
  info: 'border-l-slate-500 bg-slate-800/60',
  warning: 'border-l-amber-500 bg-amber-500/8',
  danger: 'border-l-red-500 bg-red-500/8',
  success: 'border-l-teal-500 bg-teal-500/8',
};

const KIND_LABEL: Record<BulletinItem['kind'], string> = {
  bottleneck: 'PIN',
  alert: 'ALERT',
  event: 'EVENT',
};

export function BulletinBoard({ state, onDismiss }: BulletinBoardProps) {
  const items = buildBulletinItems(state);

  if (items.length === 0) {
    return (
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="text-[9px] uppercase tracking-widest font-semibold text-teal-500/70">
            Bulletin
          </span>
          <span>All clear — no active bottlenecks or events</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-800 bg-slate-900/50">
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
          Ops Bulletin
        </span>
        <span className="tabular-nums text-[10px] text-slate-600">
          {items.length} active
        </span>
      </div>
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-thin">
        {items.map((item) => (
          <article
            key={item.id}
            className={`event-enter shrink-0 w-[min(100%,280px)] border-l-[3px] rounded-r border border-slate-800/80 px-3 py-2 ${SEVERITY_STYLES[item.severity]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-slate-500">
                    {KIND_LABEL[item.kind]}
                  </span>
                  {item.kind === 'bottleneck' && (
                    <span className="text-[8px] uppercase tracking-wider text-amber-400 font-semibold">
                      Priority
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-semibold text-slate-100 leading-snug">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                  {item.message}
                </p>
              </div>
              {item.dismissable && item.notificationId && (
                <button
                  onClick={() => onDismiss(item.notificationId!)}
                  className="text-slate-600 hover:text-slate-300 shrink-0 text-sm leading-none p-0.5"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
