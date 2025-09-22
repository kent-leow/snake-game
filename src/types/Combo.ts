import type { Position } from '../lib/game/types';

/**
 * Represents the current state of a combo sequence
 */
export interface ComboState {
  /** Numbers eaten in current attempt */
  currentSequence: number[];
  /** Next number needed for combo */
  expectedNext: number;
  /** How far through sequence (0-5) */
  comboProgress: 0 | 1 | 2 | 3 | 4 | 5;
  /** Total combos completed this game */
  totalCombos: number;
  /** Cumulative count of foods eaten in sequence (1,2,3,4,5,6,7,8...) */
  cumulativeComboCount: number;
  /** Whether player is in middle of sequence */
  isComboActive: boolean;
}

/**
 * Result of processing a food consumption for combo tracking
 */
export interface ComboResult {
  /** Type of result */
  type: 'progress' | 'complete' | 'broken';
  /** New combo state after processing */
  newState: ComboState;
  /** Points awarded (combo bonus or 0) */
  pointsAwarded: number;
  /** Optional message for UI feedback */
  message?: string;
}

/**
 * Event representing food consumption for combo tracking
 */
export interface FoodConsumptionEvent {
  /** The number of the food block consumed (any positive number) */
  foodNumber: number;
  /** Position where food was consumed */
  position: Position;
  /** Timestamp of consumption */
  timestamp: number;
}

/**
 * Event representing combo state changes
 */
export interface ComboEvent {
  /** Type of combo event */
  type: 'started' | 'progress' | 'completed' | 'broken';
  /** Current sequence at time of event */
  sequence: number[];
  /** Progress through combo (0-5) */
  progress: number;
  /** Total points awarded for this event */
  totalPoints: number;
  /** Timestamp of event */
  timestamp: number;
}

/**
 * State machine states for combo tracking
 */
export enum ComboStateType {
  /** Waiting for sequence to start with number 1 */
  WAITING_FOR_ONE = 'WAITING_FOR_ONE',
  /** In progress through sequence */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Just completed a combo */
  COMPLETED = 'COMPLETED',
}

/**
 * Configuration for combo system
 */
export interface ComboConfig {
  /** Bonus points awarded for completing a combo */
  comboBonusPoints: number;
  /** Base points awarded for each food */
  baseFoodPoints: number;
  /** The required sequence for a combo */
  comboSequence: readonly [1, 2, 3, 4, 5];
  /** Length of the combo sequence */
  sequenceLength: number;
}

/**
 * Callback function type for combo state changes
 */
export type ComboChangeCallback = (event: ComboEvent) => void;

/**
 * Statistics about combo performance
 */
export interface ComboStatistics {
  /** Total combos completed */
  totalCombos: number;
  /** Total combo bonus points earned */
  totalBonusPoints: number;
  /** Current combo progress */
  currentProgress: number;
  /** Longest sequence achieved (may be incomplete) */
  longestSequence: number;
  /** Total food blocks consumed */
  totalFoodConsumed: number;
  /** Percentage of food that contributed to combos */
  comboEfficiency: number;
}