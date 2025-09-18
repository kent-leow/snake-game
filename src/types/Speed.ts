/**
 * Speed system types for progressive speed management
 * Provides type safety for speed progression based on combo completion
 */

/**
 * Configuration for speed progression system
 */
export interface SpeedConfig {
  /** Initial movement speed (ms between moves) */
  baseSpeed: number;
  /** Speed decrease per combo completion (makes snake faster) */
  speedIncrement: number;
  /** Maximum speed cap (minimum ms between moves) */
  maxSpeed: number;
  /** Minimum speed limit (maximum ms between moves) */
  minSpeed: number;
  /** Duration for smooth speed transitions (ms) */
  transitionDuration: number;
}

/**
 * Current state of the speed system
 */
export interface SpeedState {
  /** Current movement speed (ms between moves) */
  currentSpeed: number;
  /** Number of completed combos affecting speed */
  speedLevel: number;
  /** Whether speed is currently transitioning */
  isTransitioning: boolean;
  /** Target speed being transitioned to */
  targetSpeed: number;
  /** Starting speed when transition began */
  transitionStartSpeed: number;
  /** Timestamp when current transition started */
  transitionStartTime: number;
}

/**
 * Event fired when speed changes
 */
export interface SpeedChangeEvent {
  /** Previous speed value */
  previousSpeed: number;
  /** New speed value */
  newSpeed: number;
  /** Speed level that triggered the change */
  speedLevel: number;
  /** Reason for speed change */
  reason: 'combo_completed' | 'combo_broken' | 'reset' | 'manual';
  /** Timestamp of the change */
  timestamp: number;
}

/**
 * Callback function type for speed change notifications
 */
export type SpeedChangeCallback = (event: SpeedChangeEvent) => void;

/**
 * Statistics about speed progression during gameplay
 */
export interface SpeedStatistics {
  /** Current speed level */
  currentLevel: number;
  /** Maximum speed level reached */
  maxLevelReached: number;
  /** Total speed increases */
  totalIncreases: number;
  /** Total speed resets */
  totalResets: number;
  /** Time spent at maximum speed (ms) */
  timeAtMaxSpeed: number;
  /** Average speed level during session */
  averageSpeedLevel: number;
}

/**
 * Speed transition calculation result
 */
export interface SpeedTransition {
  /** Current interpolated speed value */
  currentSpeed: number;
  /** Progress of transition (0-1) */
  progress: number;
  /** Whether transition is complete */
  isComplete: boolean;
  /** Remaining transition time (ms) */
  remainingTime: number;
}

/**
 * Configuration for different speed presets
 */
export interface SpeedPreset {
  /** Name of the preset */
  name: string;
  /** Description of difficulty level */
  description: string;
  /** Speed configuration for this preset */
  config: SpeedConfig;
}

/**
 * Speed manager export data for persistence
 */
export interface SpeedManagerData {
  /** Current speed state */
  state: SpeedState;
  /** Speed configuration */
  config: SpeedConfig;
  /** Speed statistics */
  statistics: SpeedStatistics;
  /** Timestamp of export */
  timestamp: number;
}

/**
 * Easing function type for speed transitions
 */
export type EasingFunction = (t: number) => number;

/**
 * Predefined easing functions for smooth speed transitions
 */
export const SpeedEasing = {
  /** Linear transition */
  linear: (t: number): number => t,
  
  /** Ease out cubic for smooth deceleration */
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  
  /** Ease in out cubic for smooth acceleration and deceleration */
  easeInOutCubic: (t: number): number => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    
  /** Ease out exponential for quick initial change then slow */
  easeOutExpo: (t: number): number => 
    t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
} as const;