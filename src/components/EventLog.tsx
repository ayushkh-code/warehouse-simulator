import type { GameNotification } from '../game/types';

interface EventLogProps {
  notifications: GameNotification[];
  onDismiss: (id: string) => void;
}

const TYPE_STYLES: Record<GameNotification['type'], string> = {
  info: 'border-slate-600 bg-slate-800/50',
  warning: 'border-amber-500/40 bg-amber-500/5',
  danger: 'border-red-500/40 bg-red-500/5',
  success: 'border-teal-500/40 bg-teal-500/5',
};

const TYPE_LABEL: Record<GameNotification['type'], string> = {
  info: 'INFO',
  warning: 'WARN',
  danger: 'ALERT',
  success: 'BONUS',
};

export function EventLog({ notifications, onDismiss }: EventLogProps) {
  const active = notifications.filter((n) => !n.dismissed);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex-1 min-h-[140px] max-h-[200px] flex flex-col">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">
        Event Log
      </h2>
      <div className="overflow-y-auto flex-1 space-y-1.5">
        {active.length === 0 ? (
          <p className="text-[11px] text-slate-600">No active events</p>
        ) : (
          active.map((n) => (
            <div
              key={n.id}
              className={`event-enter flex gap-2 p-2 rounded border text-[11px] ${TYPE_STYLES[n.type]}`}
            >
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold shrink-0 w-10 pt-0.5">
                {TYPE_LABEL[n.type]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-200">{n.title}</span>
                  <span className="text-slate-600 tabular-nums text-[10px]">Wk {n.week}</span>
                </div>
                <p className="text-slate-400 mt-0.5 leading-snug">{n.message}</p>
              </div>
              <button
                onClick={() => onDismiss(n.id)}
                className="text-slate-600 hover:text-slate-400 shrink-0 text-xs"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
