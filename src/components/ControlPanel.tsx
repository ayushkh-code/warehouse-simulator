import { useState } from 'react';
import {
  MARKET_WAGE,
  laborPool,
  previewBuyInventory,
  previewEquipment,
  previewFire,
  previewHire,
  previewRepair,
  previewTraining,
  previewWage,
} from '../game/engine';
import {
  EQUIPMENT_COST_PER_STEP,
  TRAINING_COST_PER_STEP,
} from '../game/constants';
import type { GameState, InventorySource } from '../game/types';
import { formatCurrency } from '../game/utils';

interface ControlPanelProps {
  state: GameState;
  actions: {
    buyInventory: (qty: number, source: InventorySource) => void;
    hireLabor: (count: number) => void;
    fireLabor: (count: number) => void;
    setWage: (wage: number) => void;
    buyTraining: (amount: number) => void;
    buyEquipment: (amount: number) => void;
    payRepair: () => void;
  };
}

function Badge({ type }: { type: 'CAPEX' | 'VARIABLE' }) {
  return (
    <span
      className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold ${
        type === 'CAPEX'
          ? 'bg-[#f0c14b]/15 text-[#f0c14b] border border-[#f0c14b]/30'
          : 'bg-[#8b5cf6]/15 text-[#c4b5fd] border border-[#8b5cf6]/30'
      }`}
    >
      {type}
    </span>
  );
}

function PreviewDelta({
  before,
  after,
  keys,
}: {
  before: Record<string, number>;
  after: Record<string, number>;
  keys: string[];
}) {
  return (
    <div className="text-[11px] space-y-0.5 mt-2 tabular-nums">
      {keys.map((key) => {
        const b = before[key];
        const a = after[key];
        if (b === undefined || a === undefined) return null;
        const delta = a - b;
        return (
          <div key={key} className="flex justify-between text-slate-500">
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            <span>
              {typeof b === 'number' && b % 1 !== 0 ? b.toFixed(2) : b}
              <span className="text-slate-600"> → </span>
              <span className={delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-slate-300'}>
                {typeof a === 'number' && a % 1 !== 0 ? a.toFixed(2) : a}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Card({
  title,
  badge,
  accent = 'cyan',
  children,
}: {
  title: string;
  badge: 'CAPEX' | 'VARIABLE';
  accent?: 'cyan' | 'gold' | 'violet' | 'coral';
  children: React.ReactNode;
}) {
  const accentClass = {
    cyan: 'game-panel-accent-cyan',
    gold: 'game-panel-accent-gold',
    violet: 'game-panel-accent-violet',
    coral: 'game-panel-accent-coral',
  }[accent];

  return (
    <div className={`game-panel ${accentClass} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          {title}
        </h3>
        <Badge type={badge} />
      </div>
      {children}
    </div>
  );
}

export function ControlPanel({ state, actions }: ControlPanelProps) {
  const [invQty, setInvQty] = useState(500);
  const [invSource, setInvSource] = useState<InventorySource>('domestic');
  const [hireCount, setHireCount] = useState(2);
  const [fireCount, setFireCount] = useState(1);
  const [wageInput, setWageInput] = useState(state.wage);
  const pool = laborPool(state.wage, MARKET_WAGE);

  const invPreview = previewBuyInventory(state, invQty, invSource);
  const hirePreview = previewHire(state, hireCount);
  const firePreview = previewFire(state, fireCount);
  const wagePreview = previewWage(state, wageInput);
  const trainPreview = previewTraining(state, TRAINING_COST_PER_STEP);
  const equipPreview = previewEquipment(state, EQUIPMENT_COST_PER_STEP);
  const repairPreview = previewRepair(state);

  const btnClass = (enabled: boolean) =>
    `w-full mt-2 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
      enabled
        ? 'game-btn-primary cursor-pointer'
        : 'bg-[#1a2540] border border-[#243052] text-slate-600 cursor-not-allowed'
    }`;

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-120px)]">
      <div className="text-[9px] uppercase tracking-[0.2em] text-[#8b5cf6] font-bold px-1">
        Command Panel
      </div>
      <Card title="Buy Inventory" badge="CAPEX" accent="gold">
        <div className="flex gap-2 mb-2">
          {(['domestic', 'international'] as const).map((src) => (
            <button
              key={src}
              onClick={() => setInvSource(src)}
              className={`flex-1 py-1 text-[10px] uppercase tracking-wider rounded border ${
                invSource === src
                  ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                  : 'border-slate-700 text-slate-500'
              }`}
            >
              {src === 'domestic' ? 'Domestic $6' : 'Intl $3.50'}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={100}
          max={5000}
          step={100}
          value={invQty}
          onChange={(e) => setInvQty(Number(e.target.value))}
          className="w-full accent-teal-500"
        />
        <div className="flex justify-between text-[11px] tabular-nums text-slate-400 mt-1">
          <span>{invQty} units</span>
          <span>{formatCurrency(invPreview.cost)}</span>
        </div>
        {invPreview.message && (
          <p className="text-[10px] text-slate-500 mt-1">{invPreview.message}</p>
        )}
        <button
          className={btnClass(invPreview.canAfford)}
          disabled={!invPreview.canAfford}
          onClick={() => actions.buyInventory(invQty, invSource)}
        >
          Place Order
        </button>
      </Card>

      <Card title="Labor" badge="VARIABLE" accent="violet">
        <p className="text-[10px] text-slate-500 mb-2">
          Pool: <span className="text-slate-300 tabular-nums">{pool}</span> available ·{' '}
          <span className="tabular-nums">{state.laborForce}</span> hired
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500">Hire</label>
            <input
              type="number"
              min={1}
              max={pool}
              value={hireCount}
              onChange={(e) => setHireCount(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm tabular-nums text-slate-200"
            />
            <PreviewDelta
              before={hirePreview.before}
              after={hirePreview.after}
              keys={['laborForce']}
            />
            <button
              className={btnClass(hirePreview.canAfford)}
              disabled={!hirePreview.canAfford}
              onClick={() => actions.hireLabor(hireCount)}
            >
              Hire {hirePreview.after.laborForce - hirePreview.before.laborForce}
            </button>
          </div>
          <div>
            <label className="text-[10px] text-slate-500">Fire</label>
            <input
              type="number"
              min={1}
              max={state.laborForce}
              value={fireCount}
              onChange={(e) => setFireCount(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm tabular-nums text-slate-200"
            />
            <PreviewDelta
              before={firePreview.before}
              after={firePreview.after}
              keys={['laborForce', 'morale']}
            />
            <button
              className={`${btnClass(firePreview.canAfford)} !border-red-500/50 !text-red-400 !bg-red-500/10 hover:!bg-red-500/20`}
              disabled={!firePreview.canAfford}
              onClick={() => actions.fireLabor(fireCount)}
            >
              Fire
            </button>
          </div>
        </div>
      </Card>

      <Card title="Set Wage" badge="VARIABLE" accent="violet">
        <p className="text-[10px] text-slate-500 mb-1">
          Market wage: {formatCurrency(MARKET_WAGE)}/wk
        </p>
        <input
          type="range"
          min={600}
          max={1400}
          step={25}
          value={wageInput}
          onChange={(e) => setWageInput(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex justify-between text-[11px] tabular-nums text-slate-400">
          <span>{formatCurrency(wageInput)}/wk</span>
          <span>
            Labor: {formatCurrency(wageInput * state.laborForce)}/wk
          </span>
        </div>
        <PreviewDelta
          before={wagePreview.before}
          after={wagePreview.after}
          keys={['wage', 'morale']}
        />
        {wagePreview.message && (
          <p className="text-[10px] text-amber-400/80 mt-1">{wagePreview.message}</p>
        )}
        <button
          className={btnClass(wagePreview.canAfford && wageInput !== state.wage)}
          disabled={!wagePreview.canAfford || wageInput === state.wage}
          onClick={() => actions.setWage(wageInput)}
        >
          Apply Wage
        </button>
      </Card>

      <Card title="Training" badge="CAPEX" accent="gold">
        <p className="text-[10px] text-slate-500">
          {formatCurrency(TRAINING_COST_PER_STEP)} · permanent productivity boost
        </p>
        <PreviewDelta
          before={trainPreview.before}
          after={trainPreview.after}
          keys={['productivityMultiplier']}
        />
        {trainPreview.message && (
          <p className="text-[10px] text-teal-400/80">{trainPreview.message}</p>
        )}
        <button
          className={btnClass(trainPreview.canAfford)}
          disabled={!trainPreview.canAfford}
          onClick={() => actions.buyTraining(TRAINING_COST_PER_STEP)}
        >
          Train — {formatCurrency(TRAINING_COST_PER_STEP)}
        </button>
      </Card>

      <Card title="Equipment" badge="CAPEX" accent="gold">
        <p className="text-[10px] text-slate-500">
          {formatCurrency(EQUIPMENT_COST_PER_STEP)} · +500 units/wk capacity
        </p>
        <PreviewDelta
          before={equipPreview.before}
          after={equipPreview.after}
          keys={['throughputCapacity']}
        />
        {equipPreview.message && (
          <p className="text-[10px] text-teal-400/80">{equipPreview.message}</p>
        )}
        <button
          className={btnClass(equipPreview.canAfford)}
          disabled={!equipPreview.canAfford}
          onClick={() => actions.buyEquipment(EQUIPMENT_COST_PER_STEP)}
        >
          Install — {formatCurrency(EQUIPMENT_COST_PER_STEP)}
        </button>
      </Card>

      {state.equipmentBreakdown && (
        <Card title="Emergency Repair" badge="CAPEX" accent="coral">
          <p className="text-[10px] text-red-400">Equipment breakdown active — throughput -25%</p>
          <button
            className={btnClass(repairPreview.canAfford)}
            disabled={!repairPreview.canAfford}
            onClick={() => actions.payRepair()}
          >
            Repair — {formatCurrency(repairPreview.cost)}
          </button>
        </Card>
      )}

      {state.strikeWeeksLeft > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-[11px] text-red-400">
          ⚠ Strike active ({state.strikeWeeksLeft}wk). Raise wage above market +10% to negotiate end.
        </div>
      )}
    </aside>
  );
}
