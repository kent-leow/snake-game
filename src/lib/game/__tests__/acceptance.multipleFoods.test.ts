import { MultipleFoodManager } from '../MultipleFoodManager';
import { NumberedFoodRenderer } from '../NumberedFoodRenderer';
import { CollisionDetector } from '../collisionDetection';
import type { Position } from '../types';

/**
 * Manual acceptance criteria validation for multiple food system
 * This demonstrates the GIVEN/WHEN/THEN scenarios specified in the task
 */

describe('Acceptance Criteria Validation', () => {
  let foodManager: MultipleFoodManager;
  let collisionDetector: CollisionDetector;
  
  const gridSize = 20;
  const boardWidth = 400;
  const boardHeight = 300;

  beforeEach(() => {
    foodManager = new MultipleFoodManager({
      gridSize,
      boardWidth,
      boardHeight,
    });
    
    collisionDetector = new CollisionDetector(boardWidth, boardHeight, gridSize);
  });

  describe('AC1: Game starts → board initializes → exactly 5 food blocks appear with numbers 1, 2, 3, 4, 5', () => {
    it('GIVEN game starts WHEN board initializes THEN exactly 5 food blocks appear with numbers 1, 2, 3, 4, 5', () => {
      // GIVEN: Game starts
      const snakePositions: Position[] = [
        { x: 0, y: 0 }, // Snake head
        { x: 20, y: 0 }, // Snake body
        { x: 40, y: 0 }, // Snake body
      ];

      // WHEN: Board initializes
      foodManager.initializeFoods(snakePositions);

      // THEN: Exactly 5 food blocks appear with numbers 1, 2, 3, 4, 5
      const foods = foodManager.getFoods();
      
      expect(foods).toHaveLength(5);
      
      const numbers = foods.map(f => f.number).sort();
      expect(numbers).toEqual([1, 2, 3, 4, 5]);
      
      // Each food should have unique position
      const positions = foods.map(f => `${f.position.x},${f.position.y}`);
      const uniquePositions = new Set(positions);
      expect(positions.length).toBe(uniquePositions.size);
      
      // Each food should have appropriate color and value
      foods.forEach(food => {
        expect(food.color).toBeTruthy();
        expect(food.value).toBeGreaterThan(0);
        expect(food.id).toBeTruthy();
        expect(food.timestamp).toBeGreaterThan(0);
      });
    });
  });

  describe('AC2: Food block consumed → eaten by snake → new food block appears with same number at different location', () => {
    it('GIVEN food block consumed WHEN eaten by snake THEN new food block appears with the same number at different location', () => {
      // GIVEN: Food block exists
      const snakePositions: Position[] = [{ x: 0, y: 0 }];
      foodManager.initializeFoods(snakePositions);
      
      const foodsBefore = foodManager.getFoods();
      const targetFood = foodsBefore.find(f => f.number === 3);
      expect(targetFood).toBeTruthy();
      
      const originalPosition = targetFood!.position;
      const originalId = targetFood!.id;

      // WHEN: Food is eaten by snake
      const result = foodManager.consumeFood(3, snakePositions);

      // THEN: New food block appears with the same number at different location
      expect(result).toBeTruthy();
      expect(result!.consumedFood.number).toBe(3);
      expect(result!.newFood.number).toBe(3);
      expect(result!.newFood.id).not.toBe(originalId);
      
      // Position should be different (unless board is very constrained)
      if (boardWidth * boardHeight > 100) {
        expect(result!.newFood.position).not.toEqual(originalPosition);
      }
      
      // Still should have exactly 5 foods
      const foodsAfter = foodManager.getFoods();
      expect(foodsAfter).toHaveLength(5);
      
      // Food 3 should still exist but be different
      const newFood3 = foodsAfter.find(f => f.number === 3);
      expect(newFood3).toBeTruthy();
      expect(newFood3!.id).not.toBe(originalId);
    });
  });

  describe('AC3: Food blocks spawning → none appear on snake body segments', () => {
    it('GIVEN food blocks WHEN spawning THEN none appear on snake body segments', () => {
      // GIVEN: Snake occupies multiple positions
      const snakePositions: Position[] = [
        { x: 0, y: 0 },    // Head
        { x: 20, y: 0 },   // Body
        { x: 40, y: 0 },   // Body
        { x: 60, y: 0 },   // Body
        { x: 80, y: 0 },   // Body
        { x: 100, y: 0 },  // Body
        { x: 120, y: 0 },  // Body
        { x: 140, y: 0 },  // Body
        { x: 160, y: 0 },  // Body
        { x: 180, y: 0 },  // Tail
      ];

      // WHEN: Foods are spawned
      foodManager.initializeFoods(snakePositions);

      // THEN: None appear on snake body segments
      const foods = foodManager.getFoods();
      
      foods.forEach(food => {
        const isOnSnake = snakePositions.some(
          segment => segment.x === food.position.x && segment.y === food.position.y
        );
        expect(isOnSnake).toBe(false);
      });
    });
  });

  describe('AC4: Food blocks spawning → none overlap with other food blocks', () => {
    it('GIVEN food blocks WHEN spawning THEN none overlap with other food blocks', () => {
      // GIVEN: Multiple foods need to be spawned
      const snakePositions: Position[] = [{ x: 0, y: 0 }];

      // WHEN: Foods are spawned
      foodManager.initializeFoods(snakePositions);

      // THEN: None overlap with other food blocks
      const foods = foodManager.getFoods();
      
      // Check that all positions are unique
      const positions = foods.map(f => `${f.position.x},${f.position.y}`);
      const uniquePositions = new Set(positions);
      
      expect(positions.length).toBe(uniquePositions.size);
      
      // Double-check with explicit overlap detection
      for (let i = 0; i < foods.length; i++) {
        for (let j = i + 1; j < foods.length; j++) {
          const food1 = foods[i];
          const food2 = foods[j];
          
          const overlap = food1.position.x === food2.position.x && food1.position.y === food2.position.y;
          expect(overlap).toBe(false);
        }
      }
    });
  });

  describe('Collision Detection Integration', () => {
    it('should correctly detect collisions with numbered foods', () => {
      // Setup foods
      const snakePositions: Position[] = [{ x: 100, y: 100 }];
      foodManager.initializeFoods(snakePositions);
      const foods = foodManager.getFoods();
      
      // Test collision with each food
      foods.forEach(food => {
        const snakeHead = food.position;
        const collidedFood = collisionDetector.checkMultipleFoodCollision(snakeHead, foods);
        
        expect(collidedFood).toBeTruthy();
        expect(collidedFood!.number).toBe(food.number);
        expect(collidedFood!.position).toEqual(food.position);
      });
      
      // Test no collision
      const emptyPosition = { x: 999, y: 999 };
      const noCollision = collisionDetector.checkMultipleFoodCollision(emptyPosition, foods);
      expect(noCollision).toBeNull();
    });
  });

  describe('Rendering Integration', () => {
    it('should create numbered food renderer without errors', () => {
      // Create mock canvas context (Jest doesn't support real canvas)
      const mockContext = {
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        fillText: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        font: '',
        textAlign: 'start' as CanvasTextAlign,
        textBaseline: 'alphabetic' as CanvasTextBaseline,
      } as unknown as CanvasRenderingContext2D;
      
      expect(() => {
        const renderer = new NumberedFoodRenderer(mockContext, gridSize);
        expect(renderer).toBeTruthy();
        
        const options = renderer.getOptions();
        expect(options.fontSize).toBeGreaterThan(0);
        expect(options.enableAnimation).toBe(true);
      }).not.toThrow();
    });
  });

  describe('System State Validation', () => {
    it('should maintain valid state throughout lifecycle', () => {
      // Initialize
      const snakePositions: Position[] = [{ x: 0, y: 0 }];
      foodManager.initializeFoods(snakePositions);
      
      let validation = foodManager.validateState();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Consume foods multiple times
      for (let i = 0; i < 10; i++) {
        const foods = foodManager.getFoods();
        const randomFood = foods[Math.floor(Math.random() * foods.length)];
        
        foodManager.consumeFood(randomFood.number, snakePositions);
        
        validation = foodManager.validateState();
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }
      
      // Final state check
      const finalFoods = foodManager.getFoods();
      expect(finalFoods).toHaveLength(5);
      
      const finalNumbers = finalFoods.map(f => f.number).sort();
      expect(finalNumbers).toEqual([1, 2, 3, 4, 5]);
    });
  });
});