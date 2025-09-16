import { MultipleFoodManager } from '../MultipleFoodManager';
import type { Position } from '../types';
import { DEFAULT_MULTIPLE_FOOD_CONFIG } from '../multipleFoodTypes';

describe('MultipleFoodManager', () => {
  let manager: MultipleFoodManager;
  const gridSize = 20;
  const boardWidth = 800;
  const boardHeight = 600;

  beforeEach(() => {
    manager = new MultipleFoodManager({
      gridSize,
      boardWidth,
      boardHeight,
    });
  });

  describe('initialization', () => {
    it('should create manager with default config', () => {
      const defaultManager = new MultipleFoodManager();
      expect(defaultManager.getConfig()).toEqual(DEFAULT_MULTIPLE_FOOD_CONFIG);
    });

    it('should create manager with custom config', () => {
      const config = manager.getConfig();
      expect(config.gridSize).toBe(gridSize);
      expect(config.boardWidth).toBe(boardWidth);
      expect(config.boardHeight).toBe(boardHeight);
    });

    it('should start with no foods', () => {
      const foods = manager.getFoods();
      expect(foods).toHaveLength(0);
    });
  });

  describe('initializeFoods', () => {
    it('should create exactly 5 numbered foods', () => {
      const snakePositions: Position[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 40, y: 0 },
      ];

      manager.initializeFoods(snakePositions);
      const foods = manager.getFoods();

      expect(foods).toHaveLength(5);
      
      // Check that all numbers 1-5 are present
      const numbers = foods.map(f => f.number).sort();
      expect(numbers).toEqual([1, 2, 3, 4, 5]);
    });

    it('should not place foods on snake positions', () => {
      const snakePositions: Position[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 40, y: 0 },
      ];

      manager.initializeFoods(snakePositions);
      const foods = manager.getFoods();

      foods.forEach(food => {
        const isOnSnake = snakePositions.some(
          pos => pos.x === food.position.x && pos.y === food.position.y
        );
        expect(isOnSnake).toBe(false);
      });
    });

    it('should create foods with unique positions', () => {
      const snakePositions: Position[] = [];
      
      manager.initializeFoods(snakePositions);
      const foods = manager.getFoods();

      const positions = foods.map(f => `${f.position.x},${f.position.y}`);
      const uniquePositions = new Set(positions);
      
      expect(positions.length).toBe(uniquePositions.size);
    });

    it('should assign correct colors and values to each food number', () => {
      const snakePositions: Position[] = [];
      
      manager.initializeFoods(snakePositions);
      const foods = manager.getFoods();

      foods.forEach(food => {
        const config = manager.getConfig();
        const expectedColor = config.colors[`food${food.number}` as 'food1' | 'food2' | 'food3' | 'food4' | 'food5'];
        const expectedValue = config.values[`food${food.number}` as 'food1' | 'food2' | 'food3' | 'food4' | 'food5'];
        
        expect(food.color).toBe(expectedColor);
        expect(food.value).toBe(expectedValue);
      });
    });
  });

  describe('getFoods and getFood', () => {
    beforeEach(() => {
      manager.initializeFoods([]);
    });

    it('should return all foods', () => {
      const foods = manager.getFoods();
      expect(foods).toHaveLength(5);
    });

    it('should return specific food by number', () => {
      const food1 = manager.getFood(1);
      const food3 = manager.getFood(3);
      const food5 = manager.getFood(5);

      expect(food1?.number).toBe(1);
      expect(food3?.number).toBe(3);
      expect(food5?.number).toBe(5);
    });

    it('should return undefined for invalid food number', () => {
      // @ts-expect-error Testing invalid number
      const invalidFood = manager.getFood(6);
      expect(invalidFood).toBeUndefined();
    });
  });

  describe('getFoodAt', () => {
    beforeEach(() => {
      manager.initializeFoods([]);
    });

    it('should return food at given position', () => {
      const foods = manager.getFoods();
      const firstFood = foods[0];
      
      const foundFood = manager.getFoodAt(firstFood.position);
      expect(foundFood).toEqual(firstFood);
    });

    it('should return null for empty position', () => {
      const emptyPosition = { x: 500, y: 500 };
      const foundFood = manager.getFoodAt(emptyPosition);
      expect(foundFood).toBeNull();
    });
  });

  describe('consumeFood', () => {
    beforeEach(() => {
      manager.initializeFoods([]);
    });

    it('should consume food and create replacement', () => {
      const snakePositions: Position[] = [{ x: 100, y: 100 }];
      const food1Before = manager.getFood(1);
      
      const result = manager.consumeFood(1, snakePositions);
      
      expect(result).toBeTruthy();
      expect(result!.consumedFood).toEqual(food1Before);
      expect(result!.newFood.number).toBe(1);
      expect(result!.newFood.id).not.toBe(food1Before!.id);
    });

    it('should place new food away from snake positions', () => {
      const snakePositions: Position[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 40, y: 0 },
      ];
      
      const result = manager.consumeFood(1, snakePositions);
      
      expect(result).toBeTruthy();
      const newFoodPos = result!.newFood.position;
      const isOnSnake = snakePositions.some(
        pos => pos.x === newFoodPos.x && pos.y === newFoodPos.y
      );
      expect(isOnSnake).toBe(false);
    });

    it('should place new food away from other food positions', () => {
      const snakePositions: Position[] = [];
      
      const result = manager.consumeFood(1, snakePositions);
      
      expect(result).toBeTruthy();
      const newFoodPos = result!.newFood.position;
      const otherFoods = manager.getFoods().filter(f => f.number !== 1);
      
      const overlapsOtherFood = otherFoods.some(
        food => food.position.x === newFoodPos.x && food.position.y === newFoodPos.y
      );
      expect(overlapsOtherFood).toBe(false);
    });

    it('should return null for non-existent food', () => {
      // @ts-expect-error Testing invalid number
      const result = manager.consumeFood(6, []);
      expect(result).toBeNull();
    });

    it('should maintain exactly 5 foods after consumption', () => {
      const snakePositions: Position[] = [];
      
      manager.consumeFood(1, snakePositions);
      manager.consumeFood(3, snakePositions);
      manager.consumeFood(5, snakePositions);
      
      const foods = manager.getFoods();
      expect(foods).toHaveLength(5);
      
      // Verify all numbers still present
      const numbers = foods.map(f => f.number).sort();
      expect(numbers).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        gridSize: 30,
        colors: {
          ...DEFAULT_MULTIPLE_FOOD_CONFIG.colors,
          food1: '#FF0000',
        },
      };
      
      manager.updateConfig(newConfig);
      const config = manager.getConfig();
      
      expect(config.gridSize).toBe(30);
      expect(config.colors.food1).toBe('#FF0000');
    });
  });

  describe('reset', () => {
    it('should clear all foods', () => {
      manager.initializeFoods([]);
      expect(manager.getFoods()).toHaveLength(5);
      
      manager.reset();
      expect(manager.getFoods()).toHaveLength(0);
    });
  });

  describe('validateState', () => {
    it('should validate correct state', () => {
      manager.initializeFoods([]);
      const validation = manager.validateState();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing foods', () => {
      manager.initializeFoods([]);
      // Manually remove a food to test validation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (manager as any).foods.delete(1);
      
      const validation = manager.validateState();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Expected 5 foods, but found 4');
      expect(validation.errors).toContain('Missing food number 1');
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      manager.initializeFoods([]);
    });

    it('should return correct statistics', () => {
      const stats = manager.getStats();
      
      expect(stats.totalFoods).toBe(5);
      expect(Object.keys(stats.foodsByNumber)).toHaveLength(5);
      expect(stats.oldestFood).toBeTruthy();
      expect(stats.newestFood).toBeTruthy();
    });

    it('should track food ages', () => {
      // Wait a tiny bit to ensure timestamp differences
      setTimeout(() => {
        manager.consumeFood(1, []);
        const stats = manager.getStats();
        
        expect(stats.foodsByNumber[1].averageAge).toBeGreaterThanOrEqual(0);
      }, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle board with very limited space', () => {
      const smallManager = new MultipleFoodManager({
        gridSize: 20,
        boardWidth: 100, // Only 5x5 grid
        boardHeight: 100,
      });
      
      const snakePositions: Position[] = [
        { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 40, y: 0 },
        { x: 0, y: 20 }, { x: 20, y: 20 }, { x: 40, y: 20 },
      ];
      
      // Should still be able to initialize despite limited space
      expect(() => {
        smallManager.initializeFoods(snakePositions);
      }).not.toThrow();
      
      const foods = smallManager.getFoods();
      expect(foods).toHaveLength(5);
    });

    it('should generate unique IDs for foods', () => {
      manager.initializeFoods([]);
      const foods = manager.getFoods();
      
      const ids = foods.map(f => f.id);
      const uniqueIds = new Set(ids);
      
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should handle rapid consumption cycles', () => {
      manager.initializeFoods([]);
      
      // Consume all foods multiple times rapidly
      for (let cycle = 0; cycle < 3; cycle++) {
        for (let num = 1; num <= 5; num++) {
          manager.consumeFood(num as 1 | 2 | 3 | 4 | 5, []);
        }
      }
      
      const foods = manager.getFoods();
      expect(foods).toHaveLength(5);
      
      const validation = manager.validateState();
      expect(validation.isValid).toBe(true);
    });
  });
});