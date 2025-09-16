import type { Position } from './types';
import { 
  NumberedFood, 
  FoodConsumptionResult, 
  MultipleFoodConfig, 
  DEFAULT_MULTIPLE_FOOD_CONFIG 
} from './multipleFoodTypes';

/**
 * Manager class for handling multiple numbered food blocks
 * Maintains exactly 5 food blocks (numbered 1-5) on the game board at all times
 */
export class MultipleFoodManager {
  private foods: Map<number, NumberedFood> = new Map();
  private config: MultipleFoodConfig;
  private readonly maxSpawnAttempts: number = 100;

  constructor(config: Partial<MultipleFoodConfig> = {}) {
    this.config = { ...DEFAULT_MULTIPLE_FOOD_CONFIG, ...config };
  }

  /**
   * Initialize all 5 food blocks, ensuring no overlaps with snake positions
   */
  public initializeFoods(snakePositions: Position[]): void {
    this.foods.clear();
    
    // Create foods for numbers 1-5
    for (let number = 1; number <= 5; number++) {
      const position = this.generateValidPosition(
        snakePositions, 
        this.getExistingFoodPositions()
      );
      
      const food = this.createFood(number as 1 | 2 | 3 | 4 | 5, position);
      this.foods.set(number, food);
    }
  }

  /**
   * Get all current food blocks
   */
  public getFoods(): NumberedFood[] {
    return Array.from(this.foods.values());
  }

  /**
   * Get food block by number
   */
  public getFood(number: 1 | 2 | 3 | 4 | 5): NumberedFood | undefined {
    return this.foods.get(number);
  }

  /**
   * Check if there's a food block at the given position
   */
  public getFoodAt(position: Position): NumberedFood | null {
    for (const food of this.foods.values()) {
      if (food.position.x === position.x && food.position.y === position.y) {
        return food;
      }
    }
    return null;
  }

  /**
   * Consume a food block and spawn a new one with the same number
   */
  public consumeFood(
    number: 1 | 2 | 3 | 4 | 5, 
    snakePositions: Position[]
  ): FoodConsumptionResult | null {
    const consumedFood = this.foods.get(number);
    if (!consumedFood) {
      return null;
    }

    // Generate new position for replacement food
    const newPosition = this.generateValidPosition(
      snakePositions,
      this.getExistingFoodPositions().filter(pos => 
        pos.x !== consumedFood.position.x || pos.y !== consumedFood.position.y
      )
    );

    // Create new food with the same number
    const newFood = this.createFood(number, newPosition);
    
    // Replace in the map
    this.foods.set(number, newFood);

    return {
      consumedFood,
      newFood
    };
  }

  /**
   * Generate a valid position that doesn't overlap with snake or other food
   */
  private generateValidPosition(
    snakePositions: Position[],
    existingFoods: Position[]
  ): Position {
    const occupiedPositions = [...snakePositions, ...existingFoods];
    let attempts = 0;
    
    while (attempts < this.maxSpawnAttempts) {
      const position = this.generateRandomPosition();
      
      if (!this.isPositionOccupied(position, occupiedPositions)) {
        return position;
      }
      
      attempts++;
    }

    // Fallback: find first available position
    return this.findFirstAvailablePosition(occupiedPositions);
  }

  /**
   * Generate a random position on the grid
   */
  private generateRandomPosition(): Position {
    const gridCols = Math.floor(this.config.boardWidth / this.config.gridSize);
    const gridRows = Math.floor(this.config.boardHeight / this.config.gridSize);
    
    const col = Math.floor(Math.random() * gridCols);
    const row = Math.floor(Math.random() * gridRows);
    
    return {
      x: col * this.config.gridSize,
      y: row * this.config.gridSize
    };
  }

  /**
   * Check if a position is occupied
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
   * Find the first available position on the grid (fallback method)
   */
  private findFirstAvailablePosition(occupiedPositions: Position[]): Position {
    for (let row = 0; row < this.config.boardHeight; row += this.config.gridSize) {
      for (let col = 0; col < this.config.boardWidth; col += this.config.gridSize) {
        const position = { x: col, y: row };
        if (!this.isPositionOccupied(position, occupiedPositions)) {
          return position;
        }
      }
    }
    
    // Ultimate fallback - should very rarely happen
    console.warn('No available position found for food, using origin');
    return { x: 0, y: 0 };
  }

  /**
   * Get positions of all existing food blocks
   */
  private getExistingFoodPositions(): Position[] {
    return Array.from(this.foods.values()).map(food => food.position);
  }

  /**
   * Create a numbered food block
   */
  private createFood(
    number: 1 | 2 | 3 | 4 | 5,
    position: Position
  ): NumberedFood {
    // Map number to config keys
    const configKeys = {
      1: { color: 'food1', value: 'food1' },
      2: { color: 'food2', value: 'food2' },
      3: { color: 'food3', value: 'food3' },
      4: { color: 'food4', value: 'food4' },
      5: { color: 'food5', value: 'food5' },
    } as const;
    
    const keys = configKeys[number];
    
    return {
      id: this.generateFoodId(number),
      number,
      position,
      color: this.config.colors[keys.color],
      timestamp: Date.now(),
      value: this.config.values[keys.value]
    };
  }

  /**
   * Generate unique food ID
   */
  private generateFoodId(number: number): string {
    return `food-${number}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<MultipleFoodConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): MultipleFoodConfig {
    return { ...this.config };
  }

  /**
   * Reset the food manager
   */
  public reset(): void {
    this.foods.clear();
  }

  /**
   * Get statistics about the food system
   */
  public getStats(): {
    totalFoods: number;
    foodsByNumber: Record<number, { count: number; averageAge: number }>;
    oldestFood: NumberedFood | null;
    newestFood: NumberedFood | null;
  } {
    const foods = this.getFoods();
    const now = Date.now();
    
    const foodsByNumber: Record<number, { count: number; averageAge: number }> = {};
    let oldestFood: NumberedFood | null = null;
    let newestFood: NumberedFood | null = null;
    
    for (const food of foods) {
      const age = now - food.timestamp;
      
      if (!foodsByNumber[food.number]) {
        foodsByNumber[food.number] = { count: 0, averageAge: 0 };
      }
      
      foodsByNumber[food.number].count++;
      foodsByNumber[food.number].averageAge = age;
      
      if (!oldestFood || food.timestamp < oldestFood.timestamp) {
        oldestFood = food;
      }
      
      if (!newestFood || food.timestamp > newestFood.timestamp) {
        newestFood = food;
      }
    }
    
    return {
      totalFoods: foods.length,
      foodsByNumber,
      oldestFood,
      newestFood
    };
  }

  /**
   * Validate that all 5 foods are present and correctly positioned
   */
  public validateState(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check that we have exactly 5 foods
    if (this.foods.size !== 5) {
      errors.push(`Expected 5 foods, but found ${this.foods.size}`);
    }
    
    // Check that we have foods numbered 1-5
    for (let i = 1; i <= 5; i++) {
      if (!this.foods.has(i)) {
        errors.push(`Missing food number ${i}`);
      }
    }
    
    // Check for position overlaps
    const positions = this.getExistingFoodPositions();
    const uniquePositions = new Set(positions.map(p => `${p.x},${p.y}`));
    if (positions.length !== uniquePositions.size) {
      errors.push('Found overlapping food positions');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}