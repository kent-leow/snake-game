import type { Position, Food } from './types';

/**
 * Food spawn options interface
 */
export interface FoodSpawnOptions {
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
  occupiedPositions: Position[];
}

/**
 * Enhanced food interface with additional properties
 */
export interface EnhancedFood extends Food {
  id: string;
  timestamp: number;
  value: number;
}

/**
 * Food manager class for handling food spawning and management
 * Provides intelligent food placement that avoids snake body and ensures consistent gameplay
 */
export class FoodManager {
  private currentFood: EnhancedFood | null = null;
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private foodSpawnAttempts: number = 0;
  private readonly maxSpawnAttempts: number = 100;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /**
   * Spawn new food at a random location avoiding occupied positions
   */
  public spawnFood(occupiedPositions: Position[]): EnhancedFood {
    this.foodSpawnAttempts = 0;
    let position: Position;

    do {
      position = this.generateRandomPosition();
      this.foodSpawnAttempts++;
    } while (
      this.isPositionOccupied(position, occupiedPositions) &&
      this.foodSpawnAttempts < this.maxSpawnAttempts
    );

    // Fallback: find first available position if random generation fails
    if (this.foodSpawnAttempts >= this.maxSpawnAttempts) {
      position = this.findFirstAvailablePosition(occupiedPositions);
    }

    const foodType = this.determineFoodType();
    
    this.currentFood = {
      x: position.x,
      y: position.y,
      type: foodType,
      points: this.getFoodPoints(foodType),
      id: this.generateFoodId(),
      timestamp: Date.now(),
      value: this.getFoodPoints(foodType),
    };

    return this.currentFood;
  }

  /**
   * Generate random position on the grid
   */
  private generateRandomPosition(): Position {
    const maxX = Math.floor(this.canvasWidth / this.gridSize) - 1;
    const maxY = Math.floor(this.canvasHeight / this.gridSize) - 1;

    return {
      x: Math.floor(Math.random() * (maxX + 1)) * this.gridSize,
      y: Math.floor(Math.random() * (maxY + 1)) * this.gridSize,
    };
  }

  /**
   * Check if position is occupied by any existing elements
   */
  private isPositionOccupied(
    position: Position,
    occupiedPositions: Position[]
  ): boolean {
    return occupiedPositions.some(
      occupied => occupied.x === position.x && occupied.y === position.y
    );
  }

  /**
   * Find first available position on the grid (fallback method)
   */
  private findFirstAvailablePosition(occupiedPositions: Position[]): Position {
    for (let y = 0; y < this.canvasHeight; y += this.gridSize) {
      for (let x = 0; x < this.canvasWidth; x += this.gridSize) {
        const position = { x, y };
        if (!this.isPositionOccupied(position, occupiedPositions)) {
          return position;
        }
      }
    }
    
    // Ultimate fallback - should rarely happen in normal gameplay
    console.warn('No available position found for food, using origin');
    return { x: 0, y: 0 };
  }

  /**
   * Determine food type based on probability
   */
  private determineFoodType(): 'normal' | 'special' {
    // 10% chance for special food
    return Math.random() < 0.1 ? 'special' : 'normal';
  }

  /**
   * Get points value for food type
   */
  private getFoodPoints(type: 'normal' | 'special'): number {
    return type === 'special' ? 50 : 10;
  }

  /**
   * Generate unique food ID
   */
  private generateFoodId(): string {
    return `food-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Get current food item
   */
  public getCurrentFood(): EnhancedFood | null {
    return this.currentFood;
  }

  /**
   * Clear current food (called when food is consumed)
   */
  public clearFood(): void {
    this.currentFood = null;
  }

  /**
   * Check if food exists at given position
   */
  public isFoodAt(position: Position): boolean {
    if (!this.currentFood) return false;
    
    return this.currentFood.x === position.x && this.currentFood.y === position.y;
  }

  /**
   * Get food age in milliseconds
   */
  public getFoodAge(): number {
    if (!this.currentFood) return 0;
    
    return Date.now() - this.currentFood.timestamp;
  }

  /**
   * Check if food should expire (for special game modes)
   */
  public shouldExpireFood(maxAge: number = 30000): boolean {
    return this.getFoodAge() > maxAge;
  }

  /**
   * Get all valid positions for food placement
   */
  public getValidPositions(occupiedPositions: Position[]): Position[] {
    const validPositions: Position[] = [];

    for (let y = 0; y < this.canvasHeight; y += this.gridSize) {
      for (let x = 0; x < this.canvasWidth; x += this.gridSize) {
        const position = { x, y };
        if (!this.isPositionOccupied(position, occupiedPositions)) {
          validPositions.push(position);
        }
      }
    }

    return validPositions;
  }

  /**
   * Get spawn statistics for debugging
   */
  public getSpawnStats(): {
    lastSpawnAttempts: number;
    maxAttempts: number;
    currentFoodAge: number;
    hasCurrent: boolean;
  } {
    return {
      lastSpawnAttempts: this.foodSpawnAttempts,
      maxAttempts: this.maxSpawnAttempts,
      currentFoodAge: this.getFoodAge(),
      hasCurrent: this.currentFood !== null,
    };
  }

  /**
   * Update canvas dimensions (useful for responsive design)
   */
  public updateDimensions(width: number, height: number, gridSize?: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    if (gridSize) {
      this.gridSize = gridSize;
    }
  }

  /**
   * Reset food manager to initial state
   */
  public reset(): void {
    this.currentFood = null;
    this.foodSpawnAttempts = 0;
  }

  /**
   * Force spawn food of specific type (for testing)
   */
  public spawnSpecificFood(
    position: Position,
    type: 'normal' | 'special' = 'normal'
  ): EnhancedFood {
    this.currentFood = {
      x: position.x,
      y: position.y,
      type,
      points: this.getFoodPoints(type),
      id: this.generateFoodId(),
      timestamp: Date.now(),
      value: this.getFoodPoints(type),
    };

    return this.currentFood;
  }
}