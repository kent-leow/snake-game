import type { Position } from './types';

/**
 * Interface for numbered food blocks in the multiple food system
 */
export interface NumberedFood {
  id: string;
  number: number; // Now supports any positive number, not just 1-5
  position: Position;
  color: string;
  timestamp: number;
  value: number;
}

/**
 * Result of food consumption operation
 */
export interface FoodConsumptionResult {
  consumedFood: NumberedFood;
  newFood: NumberedFood;
}

/**
 * Configuration for multiple food system
 */
export interface MultipleFoodConfig {
  gridSize: number;
  boardWidth: number;
  boardHeight: number;
  colors: {
    food1: string;
    food2: string;
    food3: string;
    food4: string;
    food5: string;
  };
  values: {
    food1: number;
    food2: number;
    food3: number;
    food4: number;
    food5: number;
  };
  /** Base value for calculating food values beyond 5 */
  baseFoodValue: number;
}

/**
 * Default configuration for the multiple food system
 */
export const DEFAULT_MULTIPLE_FOOD_CONFIG: MultipleFoodConfig = {
  gridSize: 20,
  boardWidth: 800,
  boardHeight: 600,
  colors: {
    food1: '#FF6B6B', // Red
    food2: '#4ECDC4', // Teal
    food3: '#45B7D1', // Blue
    food4: '#FFA07A', // Light Salmon
    food5: '#98D8C8', // Mint
  },
  values: {
    food1: 10,
    food2: 20,
    food3: 30,
    food4: 40,
    food5: 50,
  },
  baseFoodValue: 10,
};