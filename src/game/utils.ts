import {
  BACKLOG_HARD_THRESHOLD,
  BACKLOG_SOFT_THRESHOLD,
  BASE_DEMAND,
  DIFFICULTY_CONFIG,
  FORECAST_HORIZON,
  NEGATIVE_CASH_LIMIT,
} from './constants';
import type { Difficulty, DemandModifier, GameState } from './types';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function baseDemandForWeek(
  week: number,
  difficulty: Difficulty,
  reputationMultiplier: number,
): number {
  const { demandGrowth } = DIFFICULTY_CONFIG[difficulty];
  const growth = BASE_DEMAND * Math.pow(1 + demandGrowth, week);
  const seasonal = 1 + 0.18 * Math.sin((week / 13) * Math.PI);
  return Math.round(growth * seasonal * reputationMultiplier);
}

function applyDemandModifiers(
  week: number,
  base: number,
  modifiers: DemandModifier[],
): number {
  let result = base;
  for (const mod of modifiers) {
    if (mod.targetWeek === week) {
      result = Math.round(result * mod.multiplier);
    }
  }
  return result;
}

export function generateForecastWeek(
  week: number,
  difficulty: Difficulty,
  reputationMultiplier: number,
  demandModifiers: DemandModifier[],
): number {
  const base = baseDemandForWeek(week, difficulty, reputationMultiplier);
  return applyDemandModifiers(week, base, demandModifiers);
}

export function generateForecast(
  startWeek: number,
  difficulty: Difficulty,
  reputationMultiplier: number,
  demandModifiers: DemandModifier[],
): { forecast: number[]; forecastWeeks: number[] } {
  const forecast: number[] = [];
  const forecastWeeks: number[] = [];
  for (let i = 0; i < FORECAST_HORIZON; i++) {
    const w = startWeek + i;
    forecastWeeks.push(w);
    forecast.push(generateForecastWeek(w, difficulty, reputationMultiplier, demandModifiers));
  }
  return { forecast, forecastWeeks };
}

export function realizedDemand(
  forecastValue: number,
  week: number,
): number {
  const jitter = 0.85 + seededRandom(week * 17 + 3) * 0.3;
  return Math.round(forecastValue * jitter);
}

export function laborPool(wage: number, marketWage: number): number {
  const ratio = wage / marketWage;
  if (ratio >= 1.25) return 60;
  if (ratio >= 1.1) return 45;
  if (ratio >= 1.0) return 30;
  if (ratio >= 0.9) return 18;
  if (ratio >= 0.8) return 10;
  return 4;
}

export function moraleTarget(wage: number, marketWage: number): number {
  const ratio = wage / marketWage;
  return Math.max(10, Math.min(95, 50 + (ratio - 1) * 55));
}

export function effectiveCapacity(state: Pick<
  GameState,
  | 'throughputCapacity'
  | 'laborForce'
  | 'productivityMultiplier'
  | 'morale'
  | 'strikeWeeksLeft'
  | 'equipmentBreakdown'
>): number {
  const moraleFactor = state.morale / 100;
  const strikeFactor = state.strikeWeeksLeft > 0 ? 0.2 : 1;
  const laborCapacity =
    state.laborForce * 120 * state.productivityMultiplier * moraleFactor * strikeFactor;
  const equipmentCap = state.equipmentBreakdown
    ? state.throughputCapacity * 0.75
    : state.throughputCapacity;
  return Math.floor(Math.min(equipmentCap, laborCapacity));
}

export function computeNetWorth(state: Pick<
  GameState,
  'cash' | 'inventory' | 'capexInvested'
>): number {
  return Math.round(
    state.cash +
      state.inventory * 5 +
      state.capexInvested * 0.65,
  );
}

export function computeFixedOverhead(
  laborForce: number,
  throughputCapacity: number,
): number {
  return laborForce * 50 + throughputCapacity * 0.4;
}

export function trainingBoost(
  amount: number,
  currentMultiplier: number,
): number {
  const steps = amount / 20_000;
  const headroom = Math.max(0, TRAINING_SOFT_CAP - currentMultiplier);
  const diminishing = Math.max(0.03, 0.1 * (headroom / 0.8));
  return Math.min(TRAINING_SOFT_CAP, currentMultiplier + steps * diminishing);
}

const TRAINING_SOFT_CAP = 1.8;

export function equipmentBoost(amount: number): number {
  return Math.floor((amount / 40_000) * 500);
}

export function formatCurrency(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  return n < 0 ? `-${formatted}` : formatted;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function stressColor(
  forecastDemand: number,
  effectiveCap: number,
): 'green' | 'amber' | 'red' {
  if (forecastDemand > effectiveCap * 1.05) return 'red';
  if (forecastDemand > effectiveCap * 0.85) return 'amber';
  return 'green';
}

export function score(state: GameState): number {
  return state.score;
}

/** Points earned each survived week — scales with longevity and performance. */
export function computeWeeklyPoints(
  week: number,
  fulfilled: number,
  demand: number,
  ratio: number,
  morale: number,
): number {
  const survival = 120 + week * 25;
  const throughputBonus = Math.round(fulfilled * 1.2);
  const keepUpBonus = demand > 0 && fulfilled >= demand * 0.9 ? 100 : 0;
  const backlogPenalty = Math.round(Math.max(0, ratio - 2) * 100);
  const moraleBonus = morale >= 75 ? 50 : morale >= 55 ? 20 : 0;
  return Math.max(25, survival + throughputBonus + keepUpBonus + moraleBonus - backlogPenalty);
}

export function formatScore(n: number): string {
  return n.toLocaleString('en-US');
}

/** Backlog as multiple of equipment throughput capacity (fail at BACKLOG_HARD_THRESHOLD×). */
export function backlogRatio(backlog: number, throughputCapacity: number): number {
  return backlog / Math.max(1, throughputCapacity);
}

export function formatBacklogRatio(ratio: number): string {
  return `${ratio.toFixed(1)}×`;
}

export type BacklogStress = 'ok' | 'watch' | 'churn' | 'critical';

export function backlogStress(ratio: number): BacklogStress {
  if (ratio >= BACKLOG_HARD_THRESHOLD - 0.5) return 'critical';
  if (ratio >= BACKLOG_SOFT_THRESHOLD) return 'churn';
  if (ratio >= 2) return 'watch';
  return 'ok';
}

export const BACKLOG_STRESS_COLORS: Record<BacklogStress, string> = {
  ok: 'text-teal-400',
  watch: 'text-amber-400',
  churn: 'text-amber-500',
  critical: 'text-red-400',
};

export type Bottleneck = 'inventory' | 'labor' | 'equipment' | 'balanced';

export function diagnoseBottleneck(
  state: Pick<
    GameState,
    | 'inventory'
    | 'laborForce'
    | 'throughputCapacity'
    | 'productivityMultiplier'
    | 'morale'
    | 'strikeWeeksLeft'
    | 'equipmentBreakdown'
    | 'backlog'
    | 'forecast'
  >,
): { bottleneck: Bottleneck; label: string; detail: string } {
  const moraleFactor = state.morale / 100;
  const strikeFactor = state.strikeWeeksLeft > 0 ? 0.2 : 1;
  const laborCap = Math.floor(
    state.laborForce * 120 * state.productivityMultiplier * moraleFactor * strikeFactor,
  );
  const equipCap = Math.floor(
    state.equipmentBreakdown ? state.throughputCapacity * 0.75 : state.throughputCapacity,
  );
  const effCap = Math.min(laborCap, equipCap);
  const incoming = state.forecast[0] ?? 0;
  const need = state.backlog + incoming;

  if (state.inventory < effCap && state.inventory < need) {
    const weeks = state.inventory / Math.max(1, incoming);
    return {
      bottleneck: 'inventory',
      label: 'INVENTORY',
      detail: `~${weeks.toFixed(1)} wk of stock left at forecast demand`,
    };
  }
  if (laborCap < equipCap * 0.9) {
    return {
      bottleneck: 'labor',
      label: 'LABOR',
      detail: `Labor cap ${laborCap.toLocaleString()} vs equip ${equipCap.toLocaleString()}/wk`,
    };
  }
  if (equipCap < laborCap * 0.9) {
    return {
      bottleneck: 'equipment',
      label: 'EQUIPMENT',
      detail: `Equip cap ${equipCap.toLocaleString()} vs labor ${laborCap.toLocaleString()}/wk`,
    };
  }
  return {
    bottleneck: 'balanced',
    label: 'BALANCED',
    detail: `Processing ${effCap.toLocaleString()} units/wk`,
  };
}

export function inventoryRunwayWeeks(inventory: number, weeklyDemand: number): number {
  return inventory / Math.max(1, weeklyDemand);
}

export interface BulletinItem {
  id: string;
  kind: 'bottleneck' | 'alert' | 'event';
  severity: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  dismissable: boolean;
  notificationId?: string;
}

export function buildBulletinItems(state: GameState): BulletinItem[] {
  const items: BulletinItem[] = [];
  const diag = diagnoseBottleneck(state);
  const ratio = backlogRatio(state.backlog, state.throughputCapacity);
  const stress = backlogStress(ratio);
  const forecastDemand = state.forecast[0] ?? 0;
  const invRunway = inventoryRunwayWeeks(state.inventory, forecastDemand);

  if (diag.bottleneck !== 'balanced') {
    items.push({
      id: 'bottleneck',
      kind: 'bottleneck',
      severity: diag.bottleneck === 'labor' ? 'danger' : 'warning',
      title: `Bottleneck: ${diag.label}`,
      message: diag.detail,
      dismissable: false,
    });
  }

  if (state.strikeWeeksLeft > 0) {
    items.push({
      id: 'strike',
      kind: 'alert',
      severity: 'danger',
      title: 'Labor Strike',
      message: `Productivity at 20% for ${state.strikeWeeksLeft} more week(s). Raise wages above market +10% to negotiate.`,
      dismissable: false,
    });
  }

  if (state.equipmentBreakdown) {
    items.push({
      id: 'breakdown',
      kind: 'alert',
      severity: 'danger',
      title: 'Equipment Breakdown',
      message: 'Throughput reduced 25%. Pay the repair fee in the control panel.',
      dismissable: false,
    });
  }

  if (stress === 'critical') {
    items.push({
      id: 'backlog-critical',
      kind: 'alert',
      severity: 'danger',
      title: `Backlog ${formatBacklogRatio(ratio)}`,
      message: `Game over at ${BACKLOG_HARD_THRESHOLD}× capacity. Clear backlog or scale up immediately.`,
      dismissable: false,
    });
  } else if (stress === 'churn') {
    items.push({
      id: 'backlog-churn',
      kind: 'alert',
      severity: 'warning',
      title: `Backlog ${formatBacklogRatio(ratio)}`,
      message: `Above ${BACKLOG_SOFT_THRESHOLD}× — customer churn penalties are active.`,
      dismissable: false,
    });
  }

  if (state.cash < 0) {
    items.push({
      id: 'cash-negative',
      kind: 'alert',
      severity: 'warning',
      title: 'Cash Negative',
      message: `${NEGATIVE_CASH_LIMIT - state.negativeCashWeeks} week(s) left before insolvency (${state.negativeCashWeeks}/${NEGATIVE_CASH_LIMIT} deficit streak).`,
      dismissable: false,
    });
  }

  if (invRunway < 2 && diag.bottleneck !== 'inventory') {
    items.push({
      id: 'inventory-low',
      kind: 'alert',
      severity: 'warning',
      title: 'Low Inventory',
      message: `~${invRunway.toFixed(1)} weeks of stock at forecast demand. Place a purchase order.`,
      dismissable: false,
    });
  }

  for (const n of state.notifications.filter((x) => !x.dismissed)) {
    items.push({
      id: n.id,
      kind: 'event',
      severity: n.type,
      title: n.title,
      message: n.message,
      dismissable: true,
      notificationId: n.id,
    });
  }

  return items;
}

