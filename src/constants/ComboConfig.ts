import type { ComboConfig } from '../types/Combo';

/**
 * Default configuration for the combo system
 */
export const DEFAULT_COMBO_CONFIG: ComboConfig = {
  /** Bonus points awarded for completing a combo (1→2→3→4→5) */
  comboBonusPoints: 5,
  
  /** Base points awarded for each food block */
  baseFoodPoints: 10,
  
  /** The required sequence for a combo */
  comboSequence: [1, 2, 3, 4, 5] as const,
  
  /** Length of the combo sequence */
  sequenceLength: 5,
};

/**
 * The exact sequence required for a combo
 */
export const COMBO_SEQUENCE = [1, 2, 3, 4, 5] as const;

/**
 * Length of the combo sequence
 */
export const SEQUENCE_LENGTH = 5;

/**
 * Bonus points awarded for completing a full combo
 */
export const COMBO_BONUS_POINTS = 5;

/**
 * Base points for food consumption (used for reference)
 */
export const BASE_FOOD_POINTS = 10;

/**
 * State machine configuration
 */
export const COMBO_STATE_CONFIG = {
  /** Initial state when starting combo tracking */
  initialState: 'WAITING_FOR_ONE' as const,
  
  /** States in the combo state machine */
  states: {
    WAITING_FOR_ONE: 'WAITING_FOR_ONE',
    IN_PROGRESS: 'IN_PROGRESS', 
    COMPLETED: 'COMPLETED',
  } as const,
  
  /** Valid transitions between states */
  transitions: {
    WAITING_FOR_ONE: ['IN_PROGRESS'],
    IN_PROGRESS: ['IN_PROGRESS', 'COMPLETED', 'WAITING_FOR_ONE'],
    COMPLETED: ['WAITING_FOR_ONE', 'IN_PROGRESS'],
  } as const,
} as const;

/**
 * Validation rules for combo system
 */
export const COMBO_VALIDATION = {
  /** Minimum valid food number */
  minFoodNumber: 1,
  
  /** Maximum valid food number */
  maxFoodNumber: 5,
  
  /** Maximum sequence length before reset */
  maxSequenceLength: 5,
  
  /** Timeout for combo validation (not used in basic implementation) */
  comboTimeoutMs: 30000, // 30 seconds
} as const;