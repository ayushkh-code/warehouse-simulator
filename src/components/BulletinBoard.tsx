import type { GameState } from '../game/types';
import { buildBulletinItems, type BulletinItem } from '../game/utils';

interface BulletinBoardProps {
  state: GameState;
  onDismiss: (id: string) => void;
}

const SEVERITY_STYLES: Record<BulletinItem['severity'], string> = {
  info: 'border-[#243052] bg-[#141e36]/80',
  warning: 'border-[#f0c14b]/30 bg-[#f0c14b]/5',
  danger: 'border-[#fb7185]/40 bg-[#fb7185]/8',
  success: 'border-[#34d399]/30 bg-[#34d399]/5',
};

const SEVERITY_ACCENT: Record<BulletinItem['severity'], string> = {
  info: 'bg-slate-500',
  warning: 'bg-[#f0c14b]',
  danger: 'bg-[#fb7185]',
  success: 'bg-[#34d399]',
};

const KIND_LABEL: Record<BulletinItem['kind'], string> = {
  bottleneck: '⚡ PIN',
  alert: '⚠ ALERT',
  event: '◆ EVENT',
};

export function BulletinBoard({ state, onDismiss }: BulletinBoardProps) {
  const items = buildBulletinItems(state);

  return (
    <div className="game-bulletin">
      <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#8b5cf6] font-bold">
            Ops Bulletin
          </span>
          <span className="text-[9px] text-slate-600">· bottlenecks & events</span>
        </div>
        <span className="tabular-nums text-[10px] text-slate-500">
          {items.length === 0 ? 'All clear' : `${items.length} active`}
        </span>
      </div>
      <div className="px-4 pb-3 flex gap-2.5 overflow-x-auto">
        {items.length === 0 ? (
          <div className="text-[11px] text-[#34d399]/70 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34d399]" />
            Operations nominal — no critical bottlenecks
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className={`event-enter shrink-0 w-[min(100%,300px)] rounded-lg border overflow-hidden ${SEVERITY_STYLES[item.severity]}`}
            >
              <div className={`h-0.5 ${SEVERITY_ACCENT[item.severity]}`} />
              <div className="px-3 py-2.5 flex gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] uppercase tracking-widest font-bold text-slate-400">
                      {KIND_LABEL[item.kind]}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 leading-snug">{item.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.message}</p>
                </div>
                {item.dismissable && item.notificationId && (
                  <button
                    onClick={() => onDismiss(item.notificationId!)}
                    className="text-slate-600 hover:text-slate-300 shrink-0 text-sm"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
