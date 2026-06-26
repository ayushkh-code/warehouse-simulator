import type { GameState } from '../game/types';
import { formatCurrency } from '../game/utils';

interface InventoryOrdersProps {
  state: GameState;
}

export function InventoryOrders({ state }: InventoryOrdersProps) {
  const orders = [...state.purchaseOrders].sort(
    (a, b) => a.arrivalWeek - b.arrivalWeek,
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">
        In-Transit Orders
      </h2>
      {orders.length === 0 ? (
        <p className="text-[11px] text-slate-600 py-2">No pending purchase orders</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider text-[9px] border-b border-slate-800">
                <th className="text-left py-1.5 font-medium">Source</th>
                <th className="text-right py-1.5 font-medium">Qty</th>
                <th className="text-right py-1.5 font-medium">Unit</th>
                <th className="text-right py-1.5 font-medium">Total</th>
                <th className="text-right py-1.5 font-medium">ETA</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr
                  key={po.id}
                  className="border-b border-slate-800/50 text-slate-300 tabular-nums"
                >
                  <td className="py-1.5 capitalize">
                    <span
                      className={
                        po.source === 'domestic' ? 'text-teal-400' : 'text-amber-400'
                      }
                    >
                      {po.source}
                    </span>
                  </td>
                  <td className="text-right py-1.5">{po.quantity.toLocaleString()}</td>
                  <td className="text-right py-1.5">{formatCurrency(po.unitCost)}</td>
                  <td className="text-right py-1.5">{formatCurrency(po.totalCost)}</td>
                  <td className="text-right py-1.5 text-slate-400">
                    Wk {po.arrivalWeek}
                    {po.arrivalWeek === state.week && (
                      <span className="text-teal-400 ml-1">now</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
