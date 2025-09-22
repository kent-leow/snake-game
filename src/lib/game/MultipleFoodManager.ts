import type { Position } from './types';
import { 
  NumberedFood, 
  FoodConsumptionResult, 
  MultipleFoodConfig, 
  DEFAULT_MULTIPLE_FOOD_CONFIG 
} from './multipleFoodTypes';

/**
 * Manager class for handling multiple numbered food blocks
 * Maintains exactly 5 food blocks on the game board at all times
 * Foods are numbered sequentially starting from 1
 */
export class MultipleFoodManager {
  private foods: Map<number, NumberedFood> = new Map();
  private config: MultipleFoodConfig;
  private readonly maxSpawnAttempts: number = 100;
  
  // Current food numbers being displayed (5 consecutive numbers)
  private currentNumbers: number[] = [1, 2, 3, 4, 5];

  constructor(config: Partial<MultipleFoodConfig> = {}) {
    this.config = { ...DEFAULT_MULTIPLE_FOOD_CONFIG, ...config };
  }

  /**
   * Initialize all 5 food blocks, ensuring no overlaps with snake positions
   */
  public initializeFoods(snakePositions: Position[]): void {
    this.foods.clear();
    
    // Create foods for current numbers
    for (const number of this.currentNumbers) {
      const position = this.generateValidPosition(
        snakePositions, 
        this.getExistingFoodPositions()
      );
      
      const food = this.createFood(number, position);
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
  public getFood(number: number): NumberedFood | undefined {
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
   * Consume a food block and spawn replacement
   */
  public consumeFood(
    number: number, 
    snakePositions: Position[]
  ): FoodConsumptionResult | null {
    const food = this.foods.get(number);
    if (!food) {
      return null;
    }

    // Remove the consumed food
    this.foods.delete(number);
    
    // Remove from current numbers array
    const index = this.currentNumbers.indexOf(number);
    if (index !== -1) {
      this.currentNumbers.splice(index, 1);
    }

    // Calculate replacement number: consumed number + 5
    // Eat 1 → spawn 6, Eat 2 → spawn 7, Eat 3 → spawn 8, etc.
    const nextNumber = number + 5;
    this.currentNumbers.push(nextNumber);
    this.currentNumbers.sort((a, b) => a - b);

    // Create replacement food with the next number
    const newPosition = this.generateValidPosition(
      snakePositions,
      this.getExistingFoodPositions()
    );
    
    const newFood = this.createFood(nextNumber, newPosition);
    this.foods.set(nextNumber, newFood);

    return {
      consumedFood: food,
      newFood,
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
    number: number,
    position: Position
  ): NumberedFood {
    const color = this.getFoodColor(number);
    const value = this.getFoodValue(number);
    
    return {
      id: this.generateFoodId(number),
      number,
      position,
      color,
      timestamp: Date.now(),
      value
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
    this.currentNumbers = [1, 2, 3, 4, 5];
  }

  /**
   * Reset to initial state (1-5) when combo breaks
   */
  public resetToInitial(snakePositions: Position[]): void {
    this.currentNumbers = [1, 2, 3, 4, 5];
    this.initializeFoods(snakePositions);
  }

  /**
   * Get current food numbers
   */
  public getCurrentNumbers(): number[] {
    return [...this.currentNumbers];
  }

  /**
   * Get food color based on its number
   */
  private getFoodColor(number: number): string {
    // Use the position in sequence (1-5) to determine color
    const position = ((number - 1) % 5) + 1;
    const colorKeys = ['food1', 'food2', 'food3', 'food4', 'food5'] as const;
    const colorKey = colorKeys[position - 1];
    return this.config.colors[colorKey];
  }

  /**
   * Get food value based on its number
   */
  private getFoodValue(number: number): number {
    // Use the position in sequence (1-5) to determine base value, then multiply by progression level
    const position = ((number - 1) % 5) + 1;
    const valueKeys = ['food1', 'food2', 'food3', 'food4', 'food5'] as const;
    const valueKey = valueKeys[position - 1];
    const baseValue = this.config.values[valueKey];
    
    // For numbers beyond 5, multiply by progression level
    const progressionLevel = Math.floor((number - 1) / 5) + 1;
    return baseValue * progressionLevel;
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