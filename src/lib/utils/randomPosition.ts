import type { Position } from '../game/types';

/**
 * Random position generation options
 */
export interface RandomPositionOptions {
  gridSize: number;
  width: number;
  height: number;
  excludePositions?: Position[];
  minDistance?: number;
  maxAttempts?: number;
}

/**
 * Position generation result
 */
export interface PositionGenerationResult {
  position: Position;
  attempts: number;
  success: boolean;
}

/**
 * Utility functions for generating random positions on a grid
 */
export class RandomPositionGenerator {
  private gridSize: number;
  private width: number;
  private height: number;
  private maxAttempts: number;

  constructor(gridSize: number, width: number, height: number, maxAttempts = 100) {
    this.gridSize = gridSize;
    this.width = width;
    this.height = height;
    this.maxAttempts = maxAttempts;
  }

  /**
   * Generate a random position on the grid
   */
  public generatePosition(options?: Partial<RandomPositionOptions>): PositionGenerationResult {
    const opts = this.mergeOptions(options);
    let attempts = 0;

    while (attempts < opts.maxAttempts) {
      const position = this.generateRandomGridPosition(opts.width, opts.height, opts.gridSize);
      
      if (this.isValidPosition(position, opts)) {
        return {
          position,
          attempts: attempts + 1,
          success: true,
        };
      }
      
      attempts++;
    }

    // Fallback: return first available position
    const fallbackPosition = this.findFirstAvailablePosition(opts);
    
    return {
      position: fallbackPosition,
      attempts,
      success: fallbackPosition !== null,
    };
  }

  /**
   * Generate multiple random positions
   */
  public generateMultiplePositions(
    count: number,
    options?: Partial<RandomPositionOptions>
  ): Position[] {
    const positions: Position[] = [];
    const opts = this.mergeOptions(options);
    
    for (let i = 0; i < count; i++) {
      const excludePositions = [...(opts.excludePositions || []), ...positions];
      const result = this.generatePosition({
        ...opts,
        excludePositions,
      });
      
      if (result.success) {
        positions.push(result.position);
      } else {
        break; // Stop if no more valid positions
      }
    }
    
    return positions;
  }

  /**
   * Generate random position within bounds
   */
  private generateRandomGridPosition(width: number, height: number, gridSize: number): Position {
    const maxX = Math.floor(width / gridSize) - 1;
    const maxY = Math.floor(height / gridSize) - 1;

    return {
      x: Math.floor(Math.random() * (maxX + 1)) * gridSize,
      y: Math.floor(Math.random() * (maxY + 1)) * gridSize,
    };
  }

  /**
   * Check if position is valid based on constraints
   */
  private isValidPosition(position: Position, options: Required<RandomPositionOptions>): boolean {
    // Check bounds
    if (!this.isWithinBounds(position, options.width, options.height)) {
      return false;
    }

    // Check excluded positions
    if (this.isPositionExcluded(position, options.excludePositions)) {
      return false;
    }

    // Check minimum distance from excluded positions
    if (options.minDistance > 0) {
      return this.isMinimumDistanceRespected(position, options.excludePositions, options.minDistance, options.gridSize);
    }

    return true;
  }

  /**
   * Check if position is within bounds
   */
  private isWithinBounds(position: Position, width: number, height: number): boolean {
    return (
      position.x >= 0 &&
      position.x < width &&
      position.y >= 0 &&
      position.y < height
    );
  }

  /**
   * Check if position is in excluded list
   */
  private isPositionExcluded(position: Position, excludePositions: Position[]): boolean {
    return excludePositions.some(
      excluded => excluded.x === position.x && excluded.y === position.y
    );
  }

  /**
   * Check if minimum distance is respected
   */
  private isMinimumDistanceRespected(
    position: Position,
    excludePositions: Position[],
    minDistance: number,
    gridSize: number
  ): boolean {
    const minDistancePixels = minDistance * gridSize;
    
    return excludePositions.every(excluded => {
      const distance = this.getDistance(position, excluded);
      return distance >= minDistancePixels;
    });
  }

  /**
   * Get Euclidean distance between two positions
   */
  private getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Find first available position (fallback method)
   */
  private findFirstAvailablePosition(options: Required<RandomPositionOptions>): Position {
    for (let y = 0; y < options.height; y += options.gridSize) {
      for (let x = 0; x < options.width; x += options.gridSize) {
        const position = { x, y };
        
        if (this.isValidPosition(position, options)) {
          return position;
        }
      }
    }
    
    // Ultimate fallback
    return { x: 0, y: 0 };
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(options?: Partial<RandomPositionOptions>): Required<RandomPositionOptions> {
    return {
      gridSize: this.gridSize,
      width: this.width,
      height: this.height,
      excludePositions: [],
      minDistance: 0,
      maxAttempts: this.maxAttempts,
      ...options,
    };
  }

  /**
   * Update generator dimensions
   */
  public updateDimensions(width: number, height: number, gridSize?: number): void {
    this.width = width;
    this.height = height;
    if (gridSize) {
      this.gridSize = gridSize;
    }
  }

  /**
   * Get all valid positions on the grid
   */
  public getAllValidPositions(options?: Partial<RandomPositionOptions>): Position[] {
    const opts = this.mergeOptions(options);
    const validPositions: Position[] = [];

    for (let y = 0; y < opts.height; y += opts.gridSize) {
      for (let x = 0; x < opts.width; x += opts.gridSize) {
        const position = { x, y };
        
        if (this.isValidPosition(position, opts)) {
          validPositions.push(position);
        }
      }
    }

    return validPositions;
  }

  /**
   * Get random position from a list of valid positions
   */
  public getRandomFromList(positions: Position[]): Position | null {
    if (positions.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * positions.length);
    return positions[randomIndex];
  }

  /**
   * Get generator configuration
   */
  public getConfig(): {
    gridSize: number;
    width: number;
    height: number;
    maxAttempts: number;
  } {
    return {
      gridSize: this.gridSize,
      width: this.width,
      height: this.height,
      maxAttempts: this.maxAttempts,
    };
  }
}

/**
 * Standalone utility functions for random position generation
 */

/**
 * Generate a single random grid position
 */
export function generateRandomGridPosition(
  width: number,
  height: number,
  gridSize: number
): Position {
  const maxX = Math.floor(width / gridSize) - 1;
  const maxY = Math.floor(height / gridSize) - 1;

  return {
    x: Math.floor(Math.random() * (maxX + 1)) * gridSize,
    y: Math.floor(Math.random() * (maxY + 1)) * gridSize,
  };
}

/**
 * Generate random position avoiding specific positions
 */
export function generateRandomPositionAvoiding(
  width: number,
  height: number,
  gridSize: number,
  avoidPositions: Position[],
  maxAttempts = 100
): Position | null {
  const generator = new RandomPositionGenerator(gridSize, width, height, maxAttempts);
  const result = generator.generatePosition({
    excludePositions: avoidPositions,
  });
  
  return result.success ? result.position : null;
}

/**
 * Check if position is on grid
 */
export function isOnGrid(position: Position, gridSize: number): boolean {
  return position.x % gridSize === 0 && position.y % gridSize === 0;
}

/**
 * Snap position to nearest grid cell
 */
export function snapToGrid(position: Position, gridSize: number): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/**
 * Get all positions in a grid
 */
export function getAllGridPositions(
  width: number,
  height: number,
  gridSize: number
): Position[] {
  const positions: Position[] = [];
  
  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      positions.push({ x, y });
    }
  }
  
  return positions;
}

/**
 * Get random subset of positions
 */
export function getRandomPositionSubset(
  positions: Position[],
  count: number
): Position[] {
  const shuffled = [...positions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Filter positions by distance from a point
 */
export function filterPositionsByDistance(
  positions: Position[],
  centerPosition: Position,
  minDistance: number,
  maxDistance = Infinity
): Position[] {
  return positions.filter(position => {
    const dx = position.x - centerPosition.x;
    const dy = position.y - centerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance >= minDistance && distance <= maxDistance;
  });
}