import { CollisionDetector } from '../collisionDetection';
import type { Position } from '../types';
import type { NumberedFood } from '../multipleFoodTypes';

describe('CollisionDetector - Multiple Food Support', () => {
  let detector: CollisionDetector;
  const canvasWidth = 800;
  const canvasHeight = 600;
  const gridSize = 20;

  beforeEach(() => {
    detector = new CollisionDetector(canvasWidth, canvasHeight, gridSize);
  });

  const createNumberedFood = (
    number: 1 | 2 | 3 | 4 | 5,
    position: Position
  ): NumberedFood => ({
    id: `food-${number}`,
    number,
    position,
    color: '#FF6B6B',
    timestamp: Date.now(),
    value: number * 10,
  });

  describe('checkMultipleFoodCollision', () => {
    const snakeHead: Position = { x: 100, y: 100 };
    
    it('should detect collision with numbered food', () => {
      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 100, y: 100 }), // Same position as snake head
        createNumberedFood(2, { x: 120, y: 120 }),
        createNumberedFood(3, { x: 140, y: 140 }),
      ];

      const collidedFood = detector.checkMultipleFoodCollision(snakeHead, foods);
      
      expect(collidedFood).toBeTruthy();
      expect(collidedFood!.number).toBe(1);
      expect(collidedFood!.position).toEqual({ x: 100, y: 100 });
    });

    it('should return null when no collision occurs', () => {
      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 120, y: 100 }),
        createNumberedFood(2, { x: 140, y: 120 }),
        createNumberedFood(3, { x: 160, y: 140 }),
      ];

      const collidedFood = detector.checkMultipleFoodCollision(snakeHead, foods);
      
      expect(collidedFood).toBeNull();
    });

    it('should return first colliding food when multiple collisions exist', () => {
      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 120, y: 100 }),
        createNumberedFood(2, { x: 100, y: 100 }), // Collision
        createNumberedFood(3, { x: 100, y: 100 }), // Also collision
      ];

      const collidedFood = detector.checkMultipleFoodCollision(snakeHead, foods);
      
      expect(collidedFood).toBeTruthy();
      expect(collidedFood!.number).toBe(2); // First in array that collides
    });

    it('should handle empty food array', () => {
      const collidedFood = detector.checkMultipleFoodCollision(snakeHead, []);
      
      expect(collidedFood).toBeNull();
    });

    it('should handle exact position matching', () => {
      const foods: NumberedFood[] = [
        createNumberedFood(5, snakeHead), // Exact same position
      ];

      const collidedFood = detector.checkMultipleFoodCollision(snakeHead, foods);
      
      expect(collidedFood).toBeTruthy();
      expect(collidedFood!.number).toBe(5);
    });
  });

  describe('checkPositionAgainstFoods', () => {
    const testPosition: Position = { x: 200, y: 200 };

    it('should detect collision with food at position', () => {
      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 180, y: 180 }),
        createNumberedFood(2, testPosition), // Match
        createNumberedFood(3, { x: 220, y: 220 }),
      ];

      const collidedFood = detector.checkPositionAgainstFoods(testPosition, foods);
      
      expect(collidedFood).toBeTruthy();
      expect(collidedFood!.number).toBe(2);
    });

    it('should return null when no food at position', () => {
      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 180, y: 180 }),
        createNumberedFood(2, { x: 240, y: 200 }),
        createNumberedFood(3, { x: 220, y: 220 }),
      ];

      const collidedFood = detector.checkPositionAgainstFoods(testPosition, foods);
      
      expect(collidedFood).toBeNull();
    });
  });

  describe('getFoodCollisionsForPositions', () => {
    it('should find all food collisions for multiple positions', () => {
      const positions: Position[] = [
        { x: 100, y: 100 },
        { x: 120, y: 120 },
        { x: 140, y: 140 },
        { x: 160, y: 160 },
      ];

      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 100, y: 100 }), // Collision with position 0
        createNumberedFood(2, { x: 110, y: 110 }), // No collision
        createNumberedFood(3, { x: 140, y: 140 }), // Collision with position 2
        createNumberedFood(4, { x: 180, y: 180 }), // No collision
      ];

      const collisions = detector.getFoodCollisionsForPositions(positions, foods);
      
      expect(collisions).toHaveLength(2);
      expect(collisions.map(f => f.number)).toContain(1);
      expect(collisions.map(f => f.number)).toContain(3);
    });

    it('should not return duplicate foods', () => {
      const positions: Position[] = [
        { x: 100, y: 100 },
        { x: 100, y: 100 }, // Duplicate position
      ];

      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 100, y: 100 }),
      ];

      const collisions = detector.getFoodCollisionsForPositions(positions, foods);
      
      expect(collisions).toHaveLength(1);
      expect(collisions[0].number).toBe(1);
    });

    it('should handle empty arrays', () => {
      expect(detector.getFoodCollisionsForPositions([], [])).toEqual([]);
      expect(detector.getFoodCollisionsForPositions([{ x: 0, y: 0 }], [])).toEqual([]);
      expect(detector.getFoodCollisionsForPositions([], [createNumberedFood(1, { x: 0, y: 0 })])).toEqual([]);
    });
  });

  describe('hasAnyFoodCollision', () => {
    it('should return true when there are collisions', () => {
      const positions: Position[] = [
        { x: 100, y: 100 },
        { x: 120, y: 120 },
      ];

      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 100, y: 100 }), // Collision
        createNumberedFood(2, { x: 110, y: 110 }), // No collision
      ];

      const hasCollision = detector.hasAnyFoodCollision(positions, foods);
      
      expect(hasCollision).toBe(true);
    });

    it('should return false when there are no collisions', () => {
      const positions: Position[] = [
        { x: 100, y: 100 },
        { x: 120, y: 120 },
      ];

      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 110, y: 110 }),
        createNumberedFood(2, { x: 130, y: 130 }),
      ];

      const hasCollision = detector.hasAnyFoodCollision(positions, foods);
      
      expect(hasCollision).toBe(false);
    });

    it('should handle empty arrays correctly', () => {
      expect(detector.hasAnyFoodCollision([], [])).toBe(false);
      expect(detector.hasAnyFoodCollision([{ x: 0, y: 0 }], [])).toBe(false);
      expect(detector.hasAnyFoodCollision([], [createNumberedFood(1, { x: 0, y: 0 })])).toBe(false);
    });
  });

  describe('integration with existing collision methods', () => {
    it('should work alongside regular food collision detection', () => {
      const snakeHead: Position = { x: 100, y: 100 };
      
      // Test regular food collision
      const regularFood = { x: 100, y: 100, type: 'normal' as const, points: 10 };
      const regularCollision = detector.checkFoodCollision(snakeHead, regularFood);
      expect(regularCollision).toBe(true);
      
      // Test numbered food collision
      const numberedFoods: NumberedFood[] = [
        createNumberedFood(1, { x: 100, y: 100 }),
      ];
      const numberedCollision = detector.checkMultipleFoodCollision(snakeHead, numberedFoods);
      expect(numberedCollision).toBeTruthy();
    });

    it('should maintain precision with grid-based positioning', () => {
      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 20, y: 0 }),
        createNumberedFood(2, { x: 20, y: 20 }),
      ];

      // Should detect exact grid matches
      expect(detector.checkPositionAgainstFoods({ x: 20, y: 0 }, foods)?.number).toBe(1);
      expect(detector.checkPositionAgainstFoods({ x: 20, y: 20 }, foods)?.number).toBe(2);
      
      // Should not detect near misses
      expect(detector.checkPositionAgainstFoods({ x: 19, y: 0 }, foods)).toBeNull();
      expect(detector.checkPositionAgainstFoods({ x: 21, y: 0 }, foods)).toBeNull();
    });
  });

  describe('performance considerations', () => {
    it('should handle large numbers of foods efficiently', () => {
      const manyFoods: NumberedFood[] = [];
      for (let i = 0; i < 100; i++) {
        manyFoods.push(createNumberedFood(
          ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          { x: (i % 10) * 20, y: Math.floor(i / 10) * 20 }
        ));
      }

      const snakeHead: Position = { x: 100, y: 60 }; // Should hit food at index 35

      const startTime = performance.now();
      const result = detector.checkMultipleFoodCollision(snakeHead, manyFoods);
      const endTime = performance.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });

    it('should handle many position checks efficiently', () => {
      const manyPositions: Position[] = [];
      for (let i = 0; i < 100; i++) {
        manyPositions.push({ x: i * 20, y: i * 20 });
      }

      const foods: NumberedFood[] = [
        createNumberedFood(1, { x: 200, y: 200 }),
        createNumberedFood(2, { x: 400, y: 400 }),
      ];

      const startTime = performance.now();
      const collisions = detector.getFoodCollisionsForPositions(manyPositions, foods);
      const endTime = performance.now();

      expect(collisions).toHaveLength(2);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });
  });
});