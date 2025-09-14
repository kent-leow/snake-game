import { SnakeMovement } from '../movement';
import type { Snake } from '../types';

describe('SnakeMovement', () => {
  let movement: SnakeMovement;
  let testSnake: Snake;

  const canvasWidth = 400;
  const canvasHeight = 300;
  const gridSize = 20;

  beforeEach(() => {
    movement = new SnakeMovement({
      gridSize,
      canvasWidth,
      canvasHeight,
    });

    // Create a test snake
    testSnake = {
      segments: [
        { x: 100, y: 100, id: 'head' },
        { x: 80, y: 100, id: 'body-1' },
        { x: 60, y: 100, id: 'body-2' },
      ],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      isGrowing: false,
    };
  });

  describe('calculateNextHeadPosition', () => {
    it('should calculate correct position when moving right', () => {
      const nextPosition = movement.calculateNextHeadPosition(testSnake);
      expect(nextPosition).toEqual({ x: 120, y: 100 });
    });

    it('should calculate correct position when moving up', () => {
      testSnake.direction = 'UP';
      const nextPosition = movement.calculateNextHeadPosition(testSnake);
      expect(nextPosition).toEqual({ x: 100, y: 80 });
    });

    it('should calculate correct position when moving down', () => {
      testSnake.direction = 'DOWN';
      const nextPosition = movement.calculateNextHeadPosition(testSnake);
      expect(nextPosition).toEqual({ x: 100, y: 120 });
    });

    it('should calculate correct position when moving left', () => {
      testSnake.direction = 'LEFT';
      const nextPosition = movement.calculateNextHeadPosition(testSnake);
      expect(nextPosition).toEqual({ x: 80, y: 100 });
    });

    it('should use provided direction instead of snake direction', () => {
      const nextPosition = movement.calculateNextHeadPosition(testSnake, 'UP');
      expect(nextPosition).toEqual({ x: 100, y: 80 });
    });
  });

  describe('moveSnake', () => {
    it('should move snake successfully when no collisions', () => {
      const originalLength = testSnake.segments.length;
      const result = movement.moveSnake(testSnake);

      expect(result.success).toBe(true);
      expect(result.collisionType).toBe('none');
      expect(testSnake.segments).toHaveLength(originalLength);
      expect(testSnake.segments[0]).toEqual({
        x: 120,
        y: 100,
        id: expect.any(String),
      });
    });

    it('should remove tail when snake is not growing', () => {
      const originalTail = testSnake.segments[testSnake.segments.length - 1];
      const result = movement.moveSnake(testSnake);

      expect(result.removedTail).toEqual(originalTail);
    });

    it('should not remove tail when snake is growing', () => {
      testSnake.isGrowing = true;
      const originalLength = testSnake.segments.length;
      const result = movement.moveSnake(testSnake);

      expect(result.success).toBe(true);
      expect(testSnake.segments).toHaveLength(originalLength + 1);
      expect(result.removedTail).toBeUndefined();
      expect(testSnake.isGrowing).toBe(false);
    });

    it('should detect wall collision', () => {
      // Move snake to edge and try to move further
      testSnake.segments[0] = { x: canvasWidth - gridSize, y: 100, id: 'head' };
      const result = movement.moveSnake(testSnake, 'RIGHT');

      expect(result.success).toBe(false);
      expect(result.collisionType).toBe('wall');
    });

    it('should detect self collision', () => {
      // Create a snake that will collide with itself
      const longSnake: Snake = {
        segments: [
          { x: 100, y: 100, id: 'head' },
          { x: 80, y: 100, id: 'body-1' },
          { x: 60, y: 100, id: 'body-2' },
          { x: 60, y: 80, id: 'body-3' },
          { x: 80, y: 80, id: 'body-4' },
          { x: 100, y: 80, id: 'body-5' },
        ],
        direction: 'UP',
        nextDirection: 'UP',
        isGrowing: false,
      };

      // Try to move up, which would hit the body at position (100, 80)
      const result = movement.moveSnake(longSnake, 'UP');

      expect(result.success).toBe(false);
      expect(result.collisionType).toBe('self');
    });

    it('should update snake direction', () => {
      movement.moveSnake(testSnake, 'UP');
      expect(testSnake.direction).toBe('UP');
    });
  });

  describe('collision detection', () => {
    it('should detect wall collisions correctly', () => {
      expect(movement.checkWallCollision({ x: -1, y: 100 })).toBe(true);
      expect(movement.checkWallCollision({ x: canvasWidth, y: 100 })).toBe(true);
      expect(movement.checkWallCollision({ x: 100, y: -1 })).toBe(true);
      expect(movement.checkWallCollision({ x: 100, y: canvasHeight })).toBe(true);
      expect(movement.checkWallCollision({ x: 100, y: 100 })).toBe(false);
    });

    it('should detect self collisions correctly', () => {
      expect(movement.checkSelfCollision(testSnake, { x: 100, y: 100 })).toBe(
        true
      ); // Head position
      expect(movement.checkSelfCollision(testSnake, { x: 80, y: 100 })).toBe(
        true
      ); // Body position
      expect(movement.checkSelfCollision(testSnake, { x: 120, y: 100 })).toBe(
        false
      ); // Empty position
    });

    it('should return correct collision types', () => {
      // No collision
      expect(movement.checkCollisions(testSnake, { x: 120, y: 100 })).toBe(
        'none'
      );

      // Wall collision
      expect(movement.checkCollisions(testSnake, { x: -1, y: 100 })).toBe(
        'wall'
      );

      // Self collision
      expect(movement.checkCollisions(testSnake, { x: 80, y: 100 })).toBe(
        'self'
      );
    });
  });

  describe('position wrapping', () => {
    it('should not wrap positions when wrap around is disabled', () => {
      const position = { x: -1, y: 100 };
      const wrappedPosition = movement.wrapPosition(position);
      expect(wrappedPosition).toEqual(position);
    });

    it('should wrap positions when wrap around is enabled', () => {
      const wrappingMovement = new SnakeMovement({
        gridSize,
        canvasWidth,
        canvasHeight,
        enableWrapAround: true,
      });

      // Wrap left edge
      expect(wrappingMovement.wrapPosition({ x: -gridSize, y: 100 })).toEqual({
        x: canvasWidth - gridSize,
        y: 100,
      });

      // Wrap right edge
      expect(wrappingMovement.wrapPosition({ x: canvasWidth, y: 100 })).toEqual(
        {
          x: 0,
          y: 100,
        }
      );

      // Wrap top edge
      expect(wrappingMovement.wrapPosition({ x: 100, y: -gridSize })).toEqual({
        x: 100,
        y: canvasHeight - gridSize,
      });

      // Wrap bottom edge
      expect(wrappingMovement.wrapPosition({ x: 100, y: canvasHeight })).toEqual(
        {
          x: 100,
          y: 0,
        }
      );
    });
  });

  describe('snake growth', () => {
    it('should set snake to grow', () => {
      expect(testSnake.isGrowing).toBe(false);
      movement.setGrowth(testSnake, true);
      expect(testSnake.isGrowing).toBe(true);
    });

    it('should set snake to not grow', () => {
      testSnake.isGrowing = true;
      movement.setGrowth(testSnake, false);
      expect(testSnake.isGrowing).toBe(false);
    });
  });

  describe('valid positions', () => {
    it('should return valid positions around snake', () => {
      const validPositions = movement.getValidPositionsAroundSnake(testSnake);
      
      // Should not include any snake positions
      testSnake.segments.forEach((segment) => {
        expect(validPositions).not.toContainEqual(segment);
      });

      // Should include some valid positions
      expect(validPositions.length).toBeGreaterThan(0);
      expect(validPositions).toContainEqual({ x: 120, y: 100 });
      expect(validPositions).toContainEqual({ x: 0, y: 0 });
    });

    it('should respect minimum distance when specified', () => {
      const validPositions = movement.getValidPositionsAroundSnake(testSnake, 2);
      
      // Check that positions near the snake are excluded
      const nearSnakePositions = [
        { x: 120, y: 100 }, // Adjacent to head
        { x: 100, y: 80 },  // Adjacent to head
        { x: 100, y: 120 }, // Adjacent to head
      ];

      nearSnakePositions.forEach((pos) => {
        expect(validPositions).not.toContainEqual(pos);
      });
    });
  });

  describe('movement speed calculation', () => {
    it('should return base speed for short snake', () => {
      const speed = movement.calculateMovementSpeed(testSnake, 150);
      expect(speed).toBe(150);
    });

    it('should increase speed for longer snake', () => {
      // Add more segments to snake
      for (let i = 0; i < 10; i++) {
        testSnake.segments.push({
          x: 40 - i * 20,
          y: 100,
          id: `body-${i + 3}`,
        });
      }

      const speed = movement.calculateMovementSpeed(testSnake, 150, 10);
      expect(speed).toBeLessThan(150);
      expect(speed).toBeGreaterThanOrEqual(50); // Minimum speed
    });

    it('should not go below minimum speed', () => {
      // Create very long snake
      for (let i = 0; i < 100; i++) {
        testSnake.segments.push({
          x: 40 - i * 20,
          y: 100,
          id: `body-${i + 3}`,
        });
      }

      const speed = movement.calculateMovementSpeed(testSnake, 150, 50);
      expect(speed).toBe(50); // Should hit minimum
    });
  });

  describe('options management', () => {
    it('should update options correctly', () => {
      const newOptions = {
        gridSize: 30,
        enableWrapAround: true,
      };

      movement.updateOptions(newOptions);
      const options = movement.getOptions();

      expect(options.gridSize).toBe(30);
      expect(options.enableWrapAround).toBe(true);
      expect(options.canvasWidth).toBe(canvasWidth); // Should maintain original
      expect(options.canvasHeight).toBe(canvasHeight); // Should maintain original
    });

    it('should return current options', () => {
      const options = movement.getOptions();
      expect(options).toEqual({
        gridSize,
        canvasWidth,
        canvasHeight,
        enableWrapAround: false,
      });
    });
  });
});