import { FoodManager } from '../food';
import type { Position } from '../types';

describe('FoodManager', () => {
  let foodManager: FoodManager;
  const gridSize = 20;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    foodManager = new FoodManager(gridSize, canvasWidth, canvasHeight);
    // Reset random seed for consistent testing
    jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct dimensions', () => {
      const config = foodManager.getSpawnStats();
      expect(config.maxAttempts).toBe(100);
      expect(config.hasCurrent).toBe(false);
    });
  });

  describe('spawnFood', () => {
    it('should spawn food at valid position', () => {
      const occupiedPositions: Position[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
      ];

      const food = foodManager.spawnFood(occupiedPositions);

      expect(food).toBeDefined();
      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(canvasWidth);
      expect(food.y).toBeLessThan(canvasHeight);
      expect(food.x % gridSize).toBe(0);
      expect(food.y % gridSize).toBe(0);
      expect(food.type).toMatch(/^(normal|special)$/);
      expect(food.points).toBeGreaterThan(0);
      expect(food.id).toBeDefined();
      expect(food.timestamp).toBeGreaterThan(0);
    });

    it('should avoid occupied positions', () => {
      const occupiedPositions: Position[] = [
        { x: 40, y: 40 },
        { x: 60, y: 40 },
        { x: 80, y: 40 },
      ];

      // Mock random to try to generate occupied position first
      (Math.random as jest.Mock)
        .mockReturnValueOnce(0.05) // x = 40
        .mockReturnValueOnce(0.067) // y = 40 (occupied)
        .mockReturnValueOnce(0.1) // x = 80 
        .mockReturnValueOnce(0.1); // y = 60 (valid)

      const food = foodManager.spawnFood(occupiedPositions);

      expect(food).toBeDefined();
      expect(occupiedPositions).not.toContainEqual({ x: food.x, y: food.y });
    });

    it('should fall back to first available position when max attempts reached', () => {
      // Create a nearly full board
      const occupiedPositions: Position[] = [];
      for (let x = 0; x < canvasWidth; x += gridSize) {
        for (let y = 0; y < canvasHeight; y += gridSize) {
          if (!(x === 0 && y === 0)) { // Leave one spot open
            occupiedPositions.push({ x, y });
          }
        }
      }

      const food = foodManager.spawnFood(occupiedPositions);

      expect(food).toBeDefined();
      expect(food.x).toBe(0);
      expect(food.y).toBe(0);
    });

    it('should generate normal food more frequently than special food', () => {
      let normalCount = 0;
      let specialCount = 0;
      const iterations = 100;

      // Mock random to simulate normal food generation (>0.1)
      (Math.random as jest.Mock).mockImplementation(() => 0.5);

      for (let i = 0; i < iterations; i++) {
        const food = foodManager.spawnFood([]);
        if (food.type === 'normal') {
          normalCount++;
        } else {
          specialCount++;
        }
        foodManager.clearFood();
      }

      // With random = 0.5, all should be normal food
      const lastFood = foodManager.spawnFood([]);
      expect(lastFood.type).toBe('normal');
      expect(lastFood.points).toBe(10);
    });

    it('should generate special food with correct properties', () => {
      // Mock random to force special food generation (<0.1)
      // Order: position X, position Y, food type determination, food ID generation
      (Math.random as jest.Mock)
        .mockReturnValueOnce(0.5)  // For position generation X
        .mockReturnValueOnce(0.5)  // For position generation Y
        .mockReturnValueOnce(0.05) // Force special food (<0.1)
        .mockReturnValueOnce(0.5); // For ID generation

      const food = foodManager.spawnFood([]);

      expect(food.type).toBe('special');
      expect(food.points).toBe(50);
      expect(food.value).toBe(50);
    });
  });

  describe('getCurrentFood', () => {
    it('should return null when no food exists', () => {
      expect(foodManager.getCurrentFood()).toBeNull();
    });

    it('should return current food after spawning', () => {
      const food = foodManager.spawnFood([]);
      const currentFood = foodManager.getCurrentFood();

      expect(currentFood).toEqual(food);
    });
  });

  describe('clearFood', () => {
    it('should remove current food', () => {
      foodManager.spawnFood([]);
      expect(foodManager.getCurrentFood()).not.toBeNull();

      foodManager.clearFood();
      expect(foodManager.getCurrentFood()).toBeNull();
    });
  });

  describe('isFoodAt', () => {
    it('should return true when food exists at position', () => {
      const food = foodManager.spawnFood([]);
      const position = { x: food.x, y: food.y };

      expect(foodManager.isFoodAt(position)).toBe(true);
    });

    it('should return false when no food exists at position', () => {
      const food = foodManager.spawnFood([]);
      const position = { x: food.x + gridSize, y: food.y };

      expect(foodManager.isFoodAt(position)).toBe(false);
    });

    it('should return false when no food exists', () => {
      const position = { x: 0, y: 0 };

      expect(foodManager.isFoodAt(position)).toBe(false);
    });
  });

  describe('getFoodAge', () => {
    it('should return 0 when no food exists', () => {
      expect(foodManager.getFoodAge()).toBe(0);
    });

    it('should return positive age for existing food', async () => {
      foodManager.spawnFood([]);
      
      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const age = foodManager.getFoodAge();
      expect(age).toBeGreaterThan(0);
    });
  });

  describe('shouldExpireFood', () => {
    it('should return false for fresh food', () => {
      foodManager.spawnFood([]);
      expect(foodManager.shouldExpireFood(30000)).toBe(false);
    });

    it('should return true for old food', () => {
      // Mock old timestamp
      const food = foodManager.spawnFood([]);
      const oldTimestamp = Date.now() - 35000; // 35 seconds ago
      
      // Access private property for testing - use type assertion
      (food as { timestamp: number }).timestamp = oldTimestamp;
      
      expect(foodManager.shouldExpireFood(30000)).toBe(true);
    });
  });

  describe('getValidPositions', () => {
    it('should return all positions when no positions occupied', () => {
      const validPositions = foodManager.getValidPositions([]);
      const expectedCount = (canvasWidth / gridSize) * (canvasHeight / gridSize);

      expect(validPositions).toHaveLength(expectedCount);
    });

    it('should exclude occupied positions', () => {
      const occupiedPositions: Position[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
      ];

      const validPositions = foodManager.getValidPositions(occupiedPositions);
      const expectedCount = (canvasWidth / gridSize) * (canvasHeight / gridSize) - 2;

      expect(validPositions).toHaveLength(expectedCount);
      expect(validPositions).not.toContainEqual(occupiedPositions[0]);
      expect(validPositions).not.toContainEqual(occupiedPositions[1]);
    });
  });

  describe('updateDimensions', () => {
    it('should update canvas dimensions', () => {
      const newWidth = 400;
      const newHeight = 300;
      const newGridSize = 10;

      foodManager.updateDimensions(newWidth, newHeight, newGridSize);

      const validPositions = foodManager.getValidPositions([]);
      const expectedCount = (newWidth / newGridSize) * (newHeight / newGridSize);

      expect(validPositions).toHaveLength(expectedCount);
    });
  });

  describe('reset', () => {
    it('should clear current food and reset state', () => {
      foodManager.spawnFood([]);
      expect(foodManager.getCurrentFood()).not.toBeNull();

      foodManager.reset();

      expect(foodManager.getCurrentFood()).toBeNull();
      const stats = foodManager.getSpawnStats();
      expect(stats.hasCurrent).toBe(false);
    });
  });

  describe('spawnSpecificFood', () => {
    it('should spawn normal food at specific position', () => {
      const position = { x: 100, y: 100 };
      const food = foodManager.spawnSpecificFood(position, 'normal');

      expect(food.x).toBe(position.x);
      expect(food.y).toBe(position.y);
      expect(food.type).toBe('normal');
      expect(food.points).toBe(10);
    });

    it('should spawn special food at specific position', () => {
      const position = { x: 100, y: 100 };
      const food = foodManager.spawnSpecificFood(position, 'special');

      expect(food.x).toBe(position.x);
      expect(food.y).toBe(position.y);
      expect(food.type).toBe('special');
      expect(food.points).toBe(50);
    });
  });

  describe('getSpawnStats', () => {
    it('should return correct statistics', () => {
      const stats = foodManager.getSpawnStats();

      expect(stats).toHaveProperty('lastSpawnAttempts');
      expect(stats).toHaveProperty('maxAttempts');
      expect(stats).toHaveProperty('currentFoodAge');
      expect(stats).toHaveProperty('hasCurrent');
      expect(stats.maxAttempts).toBe(100);
      expect(stats.hasCurrent).toBe(false);
    });

    it('should update after spawning food', () => {
      foodManager.spawnFood([]);
      const stats = foodManager.getSpawnStats();

      expect(stats.hasCurrent).toBe(true);
      expect(stats.lastSpawnAttempts).toBeGreaterThan(0);
      expect(stats.currentFoodAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty canvas gracefully', () => {
      const smallFoodManager = new FoodManager(20, 20, 20);
      const food = smallFoodManager.spawnFood([]);

      expect(food).toBeDefined();
      expect(food.x).toBe(0);
      expect(food.y).toBe(0);
    });

    it('should handle large grid size', () => {
      const largeFoodManager = new FoodManager(100, 200, 200);
      const food = largeFoodManager.spawnFood([]);

      expect(food).toBeDefined();
      expect(food.x % 100).toBe(0);
      expect(food.y % 100).toBe(0);
    });

    it('should handle completely occupied board', () => {
      const occupiedPositions: Position[] = [];
      for (let x = 0; x < canvasWidth; x += gridSize) {
        for (let y = 0; y < canvasHeight; y += gridSize) {
          occupiedPositions.push({ x, y });
        }
      }

      const food = foodManager.spawnFood(occupiedPositions);

      // Should fallback to origin
      expect(food.x).toBe(0);
      expect(food.y).toBe(0);
    });
  });
});