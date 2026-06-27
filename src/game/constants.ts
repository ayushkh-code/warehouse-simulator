import type { Difficulty } from './types';

export const REVENUE_PER_UNIT = 14;
export const UNITS_PER_WORKER = 120;
export const MARKET_WAGE = 850;
export const RECRUITING_FEE = 2500;

export const DOMESTIC_UNIT_COST = 6;
export const DOMESTIC_LEAD_TIME = 1;
export const INTERNATIONAL_UNIT_COST = 3.5;
export const INTERNATIONAL_LEAD_TIME = 4;
export const CUSTOMS_DELAY_CHANCE = 0.1;

export const TRAINING_COST_PER_STEP = 20_000;
export const TRAINING_BOOST_BASE = 0.1;
export const TRAINING_SOFT_CAP = 1.8;

export const EQUIPMENT_COST_PER_STEP = 40_000;
export const EQUIPMENT_BOOST = 500;

export const BACKLOG_SOFT_THRESHOLD = 3;
export const BACKLOG_HARD_THRESHOLD = 6;
export const NEGATIVE_CASH_LIMIT = 3;

export const FORECAST_HORIZON = 10;
export const HISTORY_LENGTH = 20;

export const INVENTORY_VALUE_PER_UNIT = 5;

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    startingCash: number;
    demandGrowth: number;
    eventMultiplier: number;
    label: string;
  }
> = {
  easy: { startingCash: 700_000, demandGrowth: 0.008, eventMultiplier: 0.6, label: 'Easy' },
  normal: { startingCash: 500_000, demandGrowth: 0.008, eventMultiplier: 0.85, label: 'Normal' },
  hard: { startingCash: 360_000, demandGrowth: 0.012, eventMultiplier: 1.4, label: 'Hard' },
};

export const BASE_DEMAND = 500;
export const BASE_THROUGHPUT = 1500;
export const BASE_LABOR = 10;
export const BASE_INVENTORY = 2800;

/** Weeks before disruptive random events can begin. */
export const EVENT_GRACE_WEEKS = 12;
/** Minimum weeks between disruptive events (strike, breakdown, etc.). */
export const EVENT_COOLDOWN_WEEKS = 8;
/** Minimum weeks between positive bonus events. */
export const GOOD_EVENT_COOLDOWN_WEEKS = 6;
