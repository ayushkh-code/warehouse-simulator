import { DIFFICULTY_CONFIG } from './constants';
import type { GameNotification, GameState } from './types';

function eventRoll(seed: number): number {
  return (Math.sin(seed * 93.17 + 41.3) * 10000) % 1;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addNotification(
  state: GameState,
  type: GameNotification['type'],
  title: string,
  message: string,
): GameNotification[] {
  const note: GameNotification = {
    id: uid(),
    week: state.week,
    type,
    title,
    message,
    dismissed: false,
  };
  return [note, ...state.notifications].slice(0, 30);
}

export function rollRandomEvents(state: GameState): Partial<GameState> {
  if (state.gameOver) return {};

  const { eventMultiplier } = DIFFICULTY_CONFIG[state.difficulty];
  const roll = eventRoll(state.week * 7 + state.cash);
  const strikeRoll = eventRoll(state.week * 13 + state.morale);
  const updates: Partial<GameState> = {};
  let notifications = [...state.notifications];
  let demandModifiers = [...state.demandModifiers];

  const baseChance = 0.12 * eventMultiplier;

  // Strike — scales inversely with morale
  const strikeChance = Math.max(0.02, (0.25 - state.morale / 400) * eventMultiplier);
  if (state.strikeWeeksLeft === 0 && strikeRoll < strikeChance) {
    updates.strikeWeeksLeft = 1 + Math.floor(eventRoll(state.week) * 3);
    notifications = addNotification(
      { ...state, notifications },
      'danger',
      'Labor Strike',
      `Workers walk out for ${updates.strikeWeeksLeft} weeks. Productivity drops to 20%. Raise wages to end early.`,
    );
  }

  // Demand spike
  if (roll < baseChance) {
    const duration = 1 + Math.floor(eventRoll(state.week + 1) * 3);
    const boost = 1.4 + eventRoll(state.week + 2) * 0.4;
    for (let i = 1; i <= duration; i++) {
      demandModifiers.push({ targetWeek: state.week + i, multiplier: boost });
    }
    notifications = addNotification(
      { ...state, notifications },
      'warning',
      'Demand Spike',
      `Promo viral! Demand +${Math.round((boost - 1) * 100)}% for next ${duration} week(s). Check forecast.`,
    );
    updates.demandModifiers = demandModifiers;
  } else if (roll < baseChance * 2) {
    // Demand slump
    const duration = 2 + Math.floor(eventRoll(state.week + 3) * 2);
    const drop = 0.5 + eventRoll(state.week + 4) * 0.2;
    for (let i = 1; i <= duration; i++) {
      demandModifiers.push({ targetWeek: state.week + i, multiplier: drop });
    }
    notifications = addNotification(
      { ...state, notifications },
      'info',
      'Demand Slump',
      `Market softens. Demand -${Math.round((1 - drop) * 100)}% for ${duration} weeks.`,
    );
    updates.demandModifiers = demandModifiers;
  } else if (roll < baseChance * 3) {
    // Supply shortage
    updates.supplyShortageWeeksLeft = 3 + Math.floor(eventRoll(state.week + 5) * 2);
    updates.internationalLeadTimeMultiplier = 2;
    updates.internationalCostMultiplier = 1.5;
    notifications = addNotification(
      { ...state, notifications },
      'warning',
      'Supply Shortage',
      'Global supply chain disruption. International lead times doubled, costs +50%.',
    );
  } else if (roll < baseChance * 3.8 && !state.equipmentBreakdown) {
    updates.equipmentBreakdown = true;
    notifications = addNotification(
      { ...state, notifications },
      'danger',
      'Equipment Breakdown',
      'Conveyor failure! Throughput -25%. Pay repair fee to restore.',
    );
  } else if (roll < baseChance * 4.5) {
    updates.tariffWeeksLeft = 4 + Math.floor(eventRoll(state.week + 6) * 3);
    updates.internationalCostMultiplier = Math.max(
      state.internationalCostMultiplier,
      1.8,
    );
    notifications = addNotification(
      { ...state, notifications },
      'warning',
      'Tariff Shock',
      `New tariffs on imports for ${updates.tariffWeeksLeft} weeks. International costs surge.`,
    );
  } else if (roll > 0.92) {
    // Good event
    const grant = 15_000 + Math.floor(eventRoll(state.week + 7) * 25_000);
    updates.cash = state.cash + grant;
    updates.productivityMultiplier = Math.min(
      1.8,
      state.productivityMultiplier + 0.03,
    );
    notifications = addNotification(
      { ...state, notifications },
      'success',
      'Efficiency Grant',
      `Government logistics grant: +$${grant.toLocaleString()} and minor productivity boost.`,
    );
  } else if (roll > 0.88) {
    const bonus = 8_000 + Math.floor(eventRoll(state.week + 8) * 12_000);
    updates.cash = state.cash + bonus;
    notifications = addNotification(
      { ...state, notifications },
      'success',
      'Premium Bulk Order',
      `Enterprise client rush order fulfilled at premium: +$${bonus.toLocaleString()}.`,
    );
  }

  if (notifications !== state.notifications) {
    updates.notifications = notifications;
  }

  return updates;
}

export function decayEventModifiers(state: GameState): Partial<GameState> {
  const updates: Partial<GameState> = {};

  if (state.strikeWeeksLeft > 0) {
    updates.strikeWeeksLeft = state.strikeWeeksLeft - 1;
  }

  if (state.supplyShortageWeeksLeft > 0) {
    const remaining = state.supplyShortageWeeksLeft - 1;
    updates.supplyShortageWeeksLeft = remaining;
    if (remaining === 0) {
      updates.internationalLeadTimeMultiplier = 1;
      updates.internationalCostMultiplier = state.tariffWeeksLeft > 0 ? state.internationalCostMultiplier : 1;
    }
  }

  if (state.tariffWeeksLeft > 0) {
    const remaining = state.tariffWeeksLeft - 1;
    updates.tariffWeeksLeft = remaining;
    if (remaining === 0 && state.supplyShortageWeeksLeft <= 0) {
      updates.internationalCostMultiplier = 1;
    } else if (remaining === 0 && state.supplyShortageWeeksLeft > 0) {
      updates.internationalCostMultiplier = 1.5;
    }
  }

  // Clean old demand modifiers
  updates.demandModifiers = state.demandModifiers.filter(
    (m) => m.targetWeek >= state.week,
  );

  return updates;
}
