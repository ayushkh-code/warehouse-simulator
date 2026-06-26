export type Difficulty = 'easy' | 'normal' | 'hard';

export type InventorySource = 'domestic' | 'international';

export type GameSpeed = 1 | 2 | 4;

export interface PurchaseOrder {
  id: string;
  quantity: number;
  source: InventorySource;
  unitCost: number;
  totalCost: number;
  arrivalWeek: number;
  orderedWeek: number;
}

export interface GameNotification {
  id: string;
  week: number;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  dismissed: boolean;
}

export interface HistoryEntry {
  week: number;
  demand: number;
  throughput: number;
  backlog: number;
  effectiveCapacity: number;
  backlogRatio: number;
}

export interface DemandModifier {
  targetWeek: number;
  multiplier: number;
}

export interface GameState {
  week: number;
  cash: number;
  backlog: number;
  inventory: number;
  throughputCapacity: number;
  laborForce: number;
  wage: number;
  morale: number;
  productivityMultiplier: number;
  netWorth: number;

  forecast: number[];
  forecastWeeks: number[];

  purchaseOrders: PurchaseOrder[];
  notifications: GameNotification[];
  history: HistoryEntry[];

  strikeWeeksLeft: number;
  supplyShortageWeeksLeft: number;
  equipmentBreakdown: boolean;
  tariffWeeksLeft: number;
  demandModifiers: DemandModifier[];

  reputationMultiplier: number;
  negativeCashWeeks: number;
  gameOver: boolean;
  gameOverReason: string | null;
  paused: boolean;
  speed: GameSpeed;
  difficulty: Difficulty;

  capexInvested: number;
  internationalCostMultiplier: number;
  internationalLeadTimeMultiplier: number;

  lastThroughput: number;
  lastDemand: number;
  lastEffectiveCapacity: number;
  lastRevenue: number;
  lastCosts: number;
}

export interface ActionPreview {
  canAfford: boolean;
  before: Record<string, number>;
  after: Record<string, number>;
  cost: number;
  message?: string;
}
