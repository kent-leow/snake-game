/**
 * Speed system configuration constants and presets
 * Defines default speed progression curves and difficulty presets
 */

import type { SpeedConfig, SpeedPreset } from '../types/Speed';

/**
 * Default speed configuration for balanced gameplay
 * Based on task specifications: 150ms base, 15ms increment, 60ms max
 */
export const DEFAULT_SPEED_CONFIG: SpeedConfig = {
  baseSpeed: 150,           // Initial movement speed (moderate pace)
  speedIncrement: 15,       // Decrease by 15ms per combo (faster movement)
  maxSpeed: 60,            // Maximum speed cap (fastest playable)
  minSpeed: 300,           // Minimum speed limit (slowest)
  transitionDuration: 500, // 500ms smooth transition
};

/**
 * Speed presets for different difficulty levels
 */
export const SPEED_PRESETS: Record<string, SpeedPreset> = {
  beginner: {
    name: 'Beginner',
    description: 'Slow progression for new players',
    config: {
      baseSpeed: 200,
      speedIncrement: 10,
      maxSpeed: 100,
      minSpeed: 400,
      transitionDuration: 750,
    },
  },
  
  normal: {
    name: 'Normal',
    description: 'Balanced speed progression',
    config: DEFAULT_SPEED_CONFIG,
  },
  
  expert: {
    name: 'Expert',
    description: 'Fast progression for experienced players',
    config: {
      baseSpeed: 120,
      speedIncrement: 20,
      maxSpeed: 40,
      minSpeed: 250,
      transitionDuration: 300,
    },
  },
  
  insane: {
    name: 'Insane',
    description: 'Extreme speed for masochists',
    config: {
      baseSpeed: 100,
      speedIncrement: 25,
      maxSpeed: 25,
      minSpeed: 200,
      transitionDuration: 200,
    },
  },
};

/**
 * Calculate target speed based on combo level and configuration
 * Ensures speed stays within configured bounds
 */
export const calculateSpeedCurve = (
  comboLevel: number,
  config: SpeedConfig
): number => {
  const rawSpeed = config.baseSpeed - (comboLevel * config.speedIncrement);
  return Math.max(rawSpeed, config.maxSpeed);
};

/**
 * Calculate speed level from current speed and configuration
 * Used to determine how many combos were completed to reach current speed
 */
export const calculateSpeedLevel = (
  currentSpeed: number,
  config: SpeedConfig
): number => {
  if (currentSpeed >= config.baseSpeed) return 0;
  if (currentSpeed <= config.maxSpeed) {
    return Math.floor((config.baseSpeed - config.maxSpeed) / config.speedIncrement);
  }
  return Math.floor((config.baseSpeed - currentSpeed) / config.speedIncrement);
};

/**
 * Validate speed configuration for consistency
 * Returns validation result with any errors found
 */
export const validateSpeedConfig = (config: SpeedConfig): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (config.baseSpeed <= 0) {
    errors.push('baseSpeed must be greater than 0');
  }

  if (config.speedIncrement <= 0) {
    errors.push('speedIncrement must be greater than 0');
  }

  if (config.maxSpeed <= 0) {
    errors.push('maxSpeed must be greater than 0');
  }

  if (config.minSpeed <= 0) {
    errors.push('minSpeed must be greater than 0');
  }

  if (config.transitionDuration < 0) {
    errors.push('transitionDuration cannot be negative');
  }

  if (config.maxSpeed >= config.baseSpeed) {
    errors.push('maxSpeed must be less than baseSpeed');
  }

  if (config.baseSpeed >= config.minSpeed) {
    errors.push('baseSpeed must be less than minSpeed');
  }

  if (config.maxSpeed >= config.minSpeed) {
    errors.push('maxSpeed must be less than minSpeed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get speed preset by name with fallback to default
 */
export const getSpeedPreset = (presetName: string): SpeedPreset => {
  return SPEED_PRESETS[presetName] || SPEED_PRESETS.normal;
};

/**
 * List all available speed preset names
 */
export const getSpeedPresetNames = (): string[] => {
  return Object.keys(SPEED_PRESETS);
};

/**
 * Speed progression milestones for UI feedback
 */
export const SPEED_MILESTONES = [
  { level: 0, description: 'Starting Speed', emoji: '🐌' },
  { level: 2, description: 'Getting Faster', emoji: '🚶' },
  { level: 5, description: 'Speeding Up', emoji: '🏃' },
  { level: 8, description: 'Very Fast', emoji: '🚀' },
  { level: 12, description: 'Lightning Fast', emoji: '⚡' },
  { level: 15, description: 'Maximum Speed!', emoji: '💨' },
] as const;

/**
 * Get milestone for current speed level
 */
export const getSpeedMilestone = (speedLevel: number) => {
  // Find the highest milestone that doesn't exceed the current level
  const milestone = SPEED_MILESTONES
    .slice()
    .reverse()
    .find(m => speedLevel >= m.level);
  
  return milestone || SPEED_MILESTONES[0];
};

/**
 * Calculate percentage of maximum speed reached
 */
export const getSpeedProgress = (
  currentSpeed: number,
  config: SpeedConfig
): number => {
  const totalRange = config.baseSpeed - config.maxSpeed;
  const currentProgress = config.baseSpeed - currentSpeed;
  return Math.max(0, Math.min(1, currentProgress / totalRange));
};