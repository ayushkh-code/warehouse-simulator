import {
  BACKLOG_HARD_THRESHOLD,
  BACKLOG_SOFT_THRESHOLD,
  BASE_INVENTORY,
  BASE_LABOR,
  BASE_THROUGHPUT,
  CUSTOMS_DELAY_CHANCE,
  DIFFICULTY_CONFIG,
  DOMESTIC_LEAD_TIME,
  DOMESTIC_UNIT_COST,
  EQUIPMENT_COST_PER_STEP,
  EVENT_COOLDOWN_WEEKS,
  GOOD_EVENT_COOLDOWN_WEEKS,
  HISTORY_LENGTH,
  INTERNATIONAL_LEAD_TIME,
  INTERNATIONAL_UNIT_COST,
  MARKET_WAGE,
  NEGATIVE_CASH_LIMIT,
  RECRUITING_FEE,
  REVENUE_PER_UNIT,
  TRAINING_COST_PER_STEP,
  TRAINING_SOFT_CAP,
} from './constants';
import { decayEventModifiers, rollRandomEvents, advanceEventCooldowns } from './events';
import type {
  ActionPreview,
  Difficulty,
  GameNotification,
  GameState,
  InventorySource,
  PurchaseOrder,
} from './types';
import {
  computeFixedOverhead,
  computeNetWorth,
  computeWeeklyPoints,
  effectiveCapacity,
  equipmentBoost,
  generateForecast,
  laborPool,
  moraleTarget,
  realizedDemand,
  trainingBoost,
} from './utils';

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeNotification(
  week: number,
  type: GameNotification['type'],
  title: string,
  message: string,
): GameNotification {
  return { id: uid(), week, type, title, message, dismissed: false };
}

export function createInitialState(difficulty: Difficulty = 'normal'): GameState {
  const { startingCash } = DIFFICULTY_CONFIG[difficulty];
  const base: GameState = {
    week: 1,
    cash: startingCash,
    backlog: 0,
    inventory: BASE_INVENTORY,
    throughputCapacity: BASE_THROUGHPUT,
    laborForce: BASE_LABOR,
    wage: MARKET_WAGE,
    morale: 65,
    productivityMultiplier: 1.0,
    netWorth: 0,
    forecast: [],
    forecastWeeks: [],
    purchaseOrders: [],
    notifications: [],
    history: [],
    strikeWeeksLeft: 0,
    supplyShortageWeeksLeft: 0,
    equipmentBreakdown: false,
    tariffWeeksLeft: 0,
    demandModifiers: [],
    reputationMultiplier: 1.0,
    negativeCashWeeks: 0,
    gameOver: false,
    gameOverReason: null,
    paused: true,
    gameStarted: false,
    speed: 1,
    difficulty,
    capexInvested: 80_000,
    internationalCostMultiplier: 1,
    internationalLeadTimeMultiplier: 1,
    lastThroughput: 0,
    lastDemand: 0,
    lastEffectiveCapacity: 0,
    lastRevenue: 0,
    lastCosts: 0,
    score: 0,
    lastWeekPoints: 0,
    weeksSinceLastEvent: EVENT_COOLDOWN_WEEKS,
    weeksSinceLastGoodEvent: GOOD_EVENT_COOLDOWN_WEEKS,
  };

  const { forecast, forecastWeeks } = generateForecast(
    base.week,
    difficulty,
    base.reputationMultiplier,
    base.demandModifiers,
  );

  base.forecast = forecast;
  base.forecastWeeks = forecastWeeks;
  base.netWorth = computeNetWorth(base);
  base.lastEffectiveCapacity = effectiveCapacity(base);

  return base;
}

export function tick(state: GameState): GameState {
  if (state.gameOver || state.paused) return state;

  let s = { ...state };

  // 1. Demand arrives
  const forecastDemand = s.forecast[0] ?? 0;
  const demand = realizedDemand(forecastDemand, s.week);
  s.lastDemand = demand;

  // 2. Effective capacity
  const cap = effectiveCapacity(s);
  s.lastEffectiveCapacity = cap;

  // 3. Fulfillment
  const totalToProcess = s.backlog + demand;
  const processable = Math.min(cap, totalToProcess, s.inventory);
  const fulfilled = processable;
  const revenue = fulfilled * REVENUE_PER_UNIT;
  s.inventory -= fulfilled;
  const remaining = totalToProcess - fulfilled;
  s.backlog = remaining;
  s.lastThroughput = fulfilled;
  s.lastRevenue = revenue;
  s.cash += revenue;

  // 4. Costs
  const laborCost = s.laborForce * s.wage;
  const overhead = computeFixedOverhead(s.laborForce, s.throughputCapacity);
  let totalCosts = laborCost + overhead;

  // Arriving purchase orders
  const arriving = s.purchaseOrders.filter((po) => po.arrivalWeek <= s.week);
  const stillInTransit = s.purchaseOrders.filter((po) => po.arrivalWeek > s.week);
  for (const po of arriving) {
    s.inventory += po.quantity;
  }
  s.purchaseOrders = stillInTransit;

  // Excess inventory carrying cost (slight penalty for overstock during slump)
  if (s.inventory > cap * 4) {
    const carrying = Math.floor((s.inventory - cap * 4) * 0.02);
    totalCosts += carrying;
  }

  s.cash -= totalCosts;
  s.lastCosts = totalCosts;

  // 5. Morale update
  const target = moraleTarget(s.wage, MARKET_WAGE);
  let moraleDelta = (target - s.morale) * 0.15;
  if (s.backlog > s.throughputCapacity) {
    moraleDelta -= 2;
  }
  if (s.backlog > s.throughputCapacity * 2) {
    moraleDelta -= 3;
  }
  s.morale = Math.max(5, Math.min(100, s.morale + moraleDelta));

  // 6. Backlog penalty
  const softCap = s.throughputCapacity * BACKLOG_SOFT_THRESHOLD;
  const hardCap = s.throughputCapacity * BACKLOG_HARD_THRESHOLD;

  if (s.backlog > softCap) {
    const penalty = Math.floor((s.backlog - softCap) * 0.5);
    s.cash -= penalty;
    s.reputationMultiplier = Math.max(0.7, s.reputationMultiplier - 0.005);
    if (s.week % 4 === 0) {
      s.notifications = [
        makeNotification(
          s.week,
          'warning',
          'Customer Churn',
          `Backlog critical. Lost $${penalty.toLocaleString()} in penalties. Reputation damaged.`,
        ),
        ...s.notifications,
      ].slice(0, 30);
    }
  }

  // 7. Cash tracking & game over
  if (s.cash < 0) {
    s.negativeCashWeeks += 1;
  } else {
    s.negativeCashWeeks = 0;
  }

  if (s.negativeCashWeeks >= NEGATIVE_CASH_LIMIT) {
    s.gameOver = true;
    s.gameOverReason = `Cash negative for ${NEGATIVE_CASH_LIMIT} consecutive weeks. Insolvent.`;
    s.paused = true;
  }

  if (s.backlog > hardCap) {
    s.gameOver = true;
    s.gameOverReason = `Backlog exceeded ${BACKLOG_HARD_THRESHOLD}× capacity. Operations collapsed.`;
    s.paused = true;
  }

  const backlogRatioVal = s.backlog / Math.max(1, s.throughputCapacity);
  const weekPoints = computeWeeklyPoints(
    s.week,
    fulfilled,
    demand,
    backlogRatioVal,
    s.morale,
  );
  s.lastWeekPoints = weekPoints;
  s.score += weekPoints;

  // History
  s.history = [
    ...s.history,
    {
      week: s.week,
      demand,
      throughput: fulfilled,
      backlog: s.backlog,
      effectiveCapacity: cap,
      backlogRatio: backlogRatioVal,
      pointsEarned: weekPoints,
    },
  ].slice(-HISTORY_LENGTH);

  // Event modifiers decay
  const decay = decayEventModifiers(s);
  s = { ...s, ...decay };

  // Random events (before advancing forecast)
  const eventUpdates = rollRandomEvents(s);
  s = { ...s, ...eventUpdates, ...advanceEventCooldowns(state, eventUpdates) };

  // Advance week & forecast
  s.week += 1;
  const { forecast, forecastWeeks } = generateForecast(
    s.week,
    s.difficulty,
    s.reputationMultiplier,
    s.demandModifiers,
  );
  s.forecast = forecast;
  s.forecastWeeks = forecastWeeks;
  s.netWorth = computeNetWorth(s);

  return s;
}

// --- Player Actions ---

export function previewBuyInventory(
  state: GameState,
  quantity: number,
  source: InventorySource,
): ActionPreview {
  const unitCost =
    source === 'domestic'
      ? DOMESTIC_UNIT_COST
      : INTERNATIONAL_UNIT_COST * state.internationalCostMultiplier;
  const totalCost = Math.round(quantity * unitCost);
  const leadTime =
    source === 'domestic'
      ? DOMESTIC_LEAD_TIME
      : Math.round(INTERNATIONAL_LEAD_TIME * state.internationalLeadTimeMultiplier);

  return {
    canAfford: state.cash >= totalCost && quantity > 0,
    cost: totalCost,
    before: { inventory: state.inventory, cash: state.cash },
    after: {
      inventory: state.inventory,
      cash: state.cash - totalCost,
      arrivalWeek: state.week + leadTime,
    },
    message: `${quantity} units via ${source}, arrives week ${state.week + leadTime}`,
  };
}

export function buyInventory(
  state: GameState,
  quantity: number,
  source: InventorySource,
): GameState {
  const preview = previewBuyInventory(state, quantity, source);
  if (!preview.canAfford) return state;

  let leadTime =
    source === 'domestic'
      ? DOMESTIC_LEAD_TIME
      : Math.round(INTERNATIONAL_LEAD_TIME * state.internationalLeadTimeMultiplier);

  if (source === 'international' && Math.random() < CUSTOMS_DELAY_CHANCE) {
    leadTime += 1 + Math.floor(Math.random() * 2);
  }

  const unitCost =
    source === 'domestic'
      ? DOMESTIC_UNIT_COST
      : INTERNATIONAL_UNIT_COST * state.internationalCostMultiplier;
  const totalCost = Math.round(quantity * unitCost);

  const order: PurchaseOrder = {
    id: uid(),
    quantity,
    source,
    unitCost,
    totalCost,
    arrivalWeek: state.week + leadTime,
    orderedWeek: state.week,
  };

  return {
    ...state,
    cash: state.cash - totalCost,
    purchaseOrders: [...state.purchaseOrders, order],
    netWorth: computeNetWorth({ ...state, cash: state.cash - totalCost }),
  };
}

export function previewHire(state: GameState, count: number): ActionPreview {
  const pool = laborPool(state.wage, MARKET_WAGE);
  const maxHire = Math.min(count, pool);
  const recruitingCost =
    state.wage <= MARKET_WAGE ? maxHire * RECRUITING_FEE : 0;
  const totalCost = recruitingCost;

  return {
    canAfford: state.cash >= totalCost && maxHire > 0,
    cost: totalCost,
    before: { laborForce: state.laborForce },
    after: { laborForce: state.laborForce + maxHire },
    message:
      maxHire < count
        ? `Only ${maxHire} available in labor pool`
        : recruitingCost > 0
          ? `Includes $${recruitingCost.toLocaleString()} recruiting fees`
          : undefined,
  };
}

export function hireLabor(state: GameState, count: number): GameState {
  const preview = previewHire(state, count);
  if (!preview.canAfford) return state;
  const hired = preview.after.laborForce - preview.before.laborForce;

  return {
    ...state,
    cash: state.cash - preview.cost,
    laborForce: state.laborForce + hired,
    netWorth: computeNetWorth({ ...state, cash: state.cash - preview.cost }),
  };
}

export function previewFire(state: GameState, count: number): ActionPreview {
  const fired = Math.min(count, state.laborForce);
  return {
    canAfford: fired > 0,
    cost: 0,
    before: { laborForce: state.laborForce, morale: state.morale },
    after: { laborForce: state.laborForce - fired, morale: Math.max(5, state.morale - fired * 3) },
  };
}

export function fireLabor(state: GameState, count: number): GameState {
  const preview = previewFire(state, count);
  if (!preview.canAfford) return state;

  return {
    ...state,
    laborForce: preview.after.laborForce,
    morale: preview.after.morale,
  };
}

export function previewWage(state: GameState, newWage: number): ActionPreview {
  const weeklyDelta = (newWage - state.wage) * state.laborForce;
  return {
    canAfford: newWage > 0,
    cost: 0,
    before: { wage: state.wage, morale: state.morale },
    after: {
      wage: newWage,
      morale: moraleTarget(newWage, MARKET_WAGE),
      weeklyLaborCost: newWage * state.laborForce,
    },
    message:
      weeklyDelta !== 0
        ? `Weekly labor cost change: ${weeklyDelta > 0 ? '+' : ''}$${weeklyDelta.toLocaleString()}`
        : undefined,
  };
}

export function setWage(state: GameState, newWage: number): GameState {
  if (newWage <= 0) return state;

  let s: GameState = {
    ...state,
    wage: newWage,
    morale: Math.min(100, state.morale + (moraleTarget(newWage, MARKET_WAGE) - state.morale) * 0.3),
  };

  // End strike early if wage raised significantly above market
  if (s.strikeWeeksLeft > 0 && newWage >= MARKET_WAGE * 1.1) {
    const settlementCost = s.laborForce * 500;
    if (s.cash >= settlementCost) {
      s.cash -= settlementCost;
      s.strikeWeeksLeft = 0;
      s.notifications = [
        makeNotification(
          s.week,
          'info',
          'Strike Ended',
          `Wage increase accepted. Settlement cost: $${settlementCost.toLocaleString()}.`,
        ),
        ...s.notifications,
      ].slice(0, 30);
    }
  }

  return { ...s, netWorth: computeNetWorth(s) };
}

export function previewTraining(state: GameState, amount: number): ActionPreview {
  const boost = trainingBoost(amount, state.productivityMultiplier);
  return {
    canAfford: state.cash >= amount && amount >= TRAINING_COST_PER_STEP,
    cost: amount,
    before: { productivityMultiplier: state.productivityMultiplier },
    after: { productivityMultiplier: boost },
    message: `+${(boost - state.productivityMultiplier).toFixed(2)}× productivity (cap ${TRAINING_SOFT_CAP})`,
  };
}

export function buyTraining(state: GameState, amount: number): GameState {
  const preview = previewTraining(state, amount);
  if (!preview.canAfford) return state;

  return {
    ...state,
    cash: state.cash - amount,
    productivityMultiplier: preview.after.productivityMultiplier,
    capexInvested: state.capexInvested + amount,
    netWorth: computeNetWorth({
      ...state,
      cash: state.cash - amount,
      capexInvested: state.capexInvested + amount,
    }),
  };
}

export function previewEquipment(state: GameState, amount: number): ActionPreview {
  const boost = equipmentBoost(amount);
  return {
    canAfford: state.cash >= amount && amount >= EQUIPMENT_COST_PER_STEP,
    cost: amount,
    before: { throughputCapacity: state.throughputCapacity },
    after: { throughputCapacity: state.throughputCapacity + boost },
    message: `+${boost} units/week capacity`,
  };
}

export function buyEquipment(state: GameState, amount: number): GameState {
  const preview = previewEquipment(state, amount);
  if (!preview.canAfford) return state;

  const newCash = state.cash - amount;
  const newCapex = state.capexInvested + amount;
  return {
    ...state,
    cash: newCash,
    throughputCapacity: preview.after.throughputCapacity,
    capexInvested: newCapex,
    netWorth: computeNetWorth({
      cash: newCash,
      inventory: state.inventory,
      capexInvested: newCapex,
    }),
  };
}

export function previewRepair(state: GameState): ActionPreview {
  const cost = 25_000;
  return {
    canAfford: state.equipmentBreakdown && state.cash >= cost,
    cost,
    before: { throughputCapacity: state.throughputCapacity },
    after: { throughputCapacity: state.throughputCapacity },
    message: 'Restore full equipment throughput',
  };
}

export function payRepair(state: GameState): GameState {
  const preview = previewRepair(state);
  if (!preview.canAfford) return state;

  return {
    ...state,
    cash: state.cash - preview.cost,
    equipmentBreakdown: false,
    notifications: [
      makeNotification(
        state.week,
        'success',
        'Equipment Repaired',
        `Paid $${preview.cost.toLocaleString()} for emergency repair.`,
      ),
      ...state.notifications,
    ].slice(0, 30),
    netWorth: computeNetWorth({ ...state, cash: state.cash - preview.cost }),
  };
}

export function dismissNotification(state: GameState, id: string): GameState {
  return {
    ...state,
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, dismissed: true } : n,
    ),
  };
}

export { laborPool, effectiveCapacity, MARKET_WAGE };
