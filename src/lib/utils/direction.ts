import type { Direction, Position } from '../game/types';

/**
 * Direction utility functions for snake movement logic
 * Provides validation and transformation utilities for game directions
 */

/**
 * Map of directions to their opposite directions
 */
export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
} as const;

/**
 * Map of directions to their movement vectors
 */
export const DIRECTION_VECTORS: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
} as const;

/**
 * All valid directions
 */
export const ALL_DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

/**
 * Check if a direction change is valid (not a 180-degree turn)
 * Prevents snake from reversing directly into its body
 */
export const isValidDirectionChange = (
  currentDirection: Direction,
  newDirection: Direction
): boolean => {
  // Cannot reverse directly into opposite direction
  return OPPOSITE_DIRECTIONS[currentDirection] !== newDirection;
};

/**
 * Get the opposite direction of a given direction
 */
export const getOppositeDirection = (direction: Direction): Direction => {
  return OPPOSITE_DIRECTIONS[direction];
};

/**
 * Get the movement vector for a given direction
 */
export const getDirectionVector = (direction: Direction): Position => {
  return { ...DIRECTION_VECTORS[direction] };
};

/**
 * Calculate next position based on current position and direction
 */
export const getNextPosition = (
  currentPosition: Position,
  direction: Direction,
  stepSize: number = 1
): Position => {
  const vector = getDirectionVector(direction);
  return {
    x: currentPosition.x + vector.x * stepSize,
    y: currentPosition.y + vector.y * stepSize,
  };
};

/**
 * Check if a direction is horizontal (LEFT or RIGHT)
 */
export const isHorizontalDirection = (direction: Direction): boolean => {
  return direction === 'LEFT' || direction === 'RIGHT';
};

/**
 * Check if a direction is vertical (UP or DOWN)
 */
export const isVerticalDirection = (direction: Direction): boolean => {
  return direction === 'UP' || direction === 'DOWN';
};

/**
 * Get perpendicular directions for a given direction
 */
export const getPerpendicularDirections = (
  direction: Direction
): [Direction, Direction] => {
  if (isHorizontalDirection(direction)) {
    return ['UP', 'DOWN'];
  }
  return ['LEFT', 'RIGHT'];
};

/**
 * Normalize direction string to ensure consistency
 */
export const normalizeDirection = (direction: string): Direction | null => {
  const normalized = direction.toUpperCase() as Direction;
  return ALL_DIRECTIONS.includes(normalized) ? normalized : null;
};

/**
 * Get random direction (useful for AI or random food placement)
 */
export const getRandomDirection = (): Direction => {
  const randomIndex = Math.floor(Math.random() * ALL_DIRECTIONS.length);
  return ALL_DIRECTIONS[randomIndex];
};

/**
 * Get all valid direction changes from current direction
 */
export const getValidDirectionChanges = (
  currentDirection: Direction
): Direction[] => {
  return ALL_DIRECTIONS.filter((direction) =>
    isValidDirectionChange(currentDirection, direction)
  );
};