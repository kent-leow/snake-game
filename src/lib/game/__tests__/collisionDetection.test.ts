import { CollisionDetector } from '../collisionDetection';
import type { Position, Snake, Food, BoundingBox } from '../types';

describe('CollisionDetector', () => {
  let collisionDetector: CollisionDetector;
  const gridSize = 20;
  const canvasWidth = 800;
  const canvasHeight = 600;

  beforeEach(() => {
    collisionDetector = new CollisionDetector(gridSize, canvasWidth, canvasHeight);
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      const config = collisionDetector.getConfig();
      
      expect(config.gridSize).toBe(gridSize);
      expect(config.canvasWidth).toBe(canvasWidth);
      expect(config.canvasHeight).toBe(canvasHeight);
    });
  });

  describe('checkFoodCollision', () => {
    it('should return true when snake head is at food position', () => {
      const snakeHead: Position = { x: 100, y: 100 };
      const food: Food = { x: 100, y: 100, type: 'normal', points: 10 };

      const result = collisionDetector.checkFoodCollision(snakeHead, food);
      expect(result).toBe(true);
    });

    it('should return false when snake head is not at food position', () => {
      const snakeHead: Position = { x: 100, y: 100 };
      const food: Food = { x: 120, y: 100, type: 'normal', points: 10 };

      const result = collisionDetector.checkFoodCollision(snakeHead, food);
      expect(result).toBe(false);
    });

    it('should return false when no food exists', () => {
      const snakeHead: Position = { x: 100, y: 100 };

      const result = collisionDetector.checkFoodCollision(snakeHead, null);
      expect(result).toBe(false);
    });
  });

  describe('checkWallCollision', () => {
    it('should return true for position outside left boundary', () => {
      const position: Position = { x: -10, y: 100 };

      const result = collisionDetector.checkWallCollision(position);
      expect(result).toBe(true);
    });

    it('should return true for position outside right boundary', () => {
      const position: Position = { x: 800, y: 100 };

      const result = collisionDetector.checkWallCollision(position);
      expect(result).toBe(true);
    });

    it('should return true for position outside top boundary', () => {
      const position: Position = { x: 100, y: -10 };

      const result = collisionDetector.checkWallCollision(position);
      expect(result).toBe(true);
    });

    it('should return true for position outside bottom boundary', () => {
      const position: Position = { x: 100, y: 600 };

      const result = collisionDetector.checkWallCollision(position);
      expect(result).toBe(true);
    });

    it('should return false for position inside boundaries', () => {
      const position: Position = { x: 100, y: 100 };

      const result = collisionDetector.checkWallCollision(position);
      expect(result).toBe(false);
    });

    it('should return false for position at edge boundaries', () => {
      const positions = [
        { x: 0, y: 0 },
        { x: 0, y: 599 },
        { x: 799, y: 0 },
        { x: 799, y: 599 },
      ];

      positions.forEach(position => {
        const result = collisionDetector.checkWallCollision(position);
        expect(result).toBe(false);
      });
    });

    it('should use custom canvas dimensions when provided', () => {
      const customWidth = 400;
      const customHeight = 300;
      const position: Position = { x: 350, y: 250 };

      const result = collisionDetector.checkWallCollision(position, customWidth, customHeight);
      expect(result).toBe(false);

      const outsidePosition: Position = { x: 400, y: 300 };
      const resultOutside = collisionDetector.checkWallCollision(outsidePosition, customWidth, customHeight);
      expect(resultOutside).toBe(true);
    });
  });

  describe('checkSelfCollision', () => {
    it('should return true when head position matches body segment', () => {
      const head: Position = { x: 100, y: 100 };
      const body: Position[] = [
        { x: 80, y: 100 },
        { x: 60, y: 100 },
        { x: 100, y: 100 }, // Collision here
      ];

      const result = collisionDetector.checkSelfCollision(head, body);
      expect(result).toBe(true);
    });

    it('should return false when head position does not match any body segment', () => {
      const head: Position = { x: 100, y: 100 };
      const body: Position[] = [
        { x: 80, y: 100 },
        { x: 60, y: 100 },
        { x: 40, y: 100 },
      ];

      const result = collisionDetector.checkSelfCollision(head, body);
      expect(result).toBe(false);
    });

    it('should return false for empty body', () => {
      const head: Position = { x: 100, y: 100 };
      const body: Position[] = [];

      const result = collisionDetector.checkSelfCollision(head, body);
      expect(result).toBe(false);
    });
  });

  describe('checkSnakeSelfCollision', () => {
    it('should return true when snake head collides with its body', () => {
      const snake: Snake = {
        segments: [
          { x: 100, y: 100, id: 'head' },
          { x: 80, y: 100, id: 'body-1' },
          { x: 60, y: 100, id: 'body-2' },
          { x: 100, y: 100, id: 'body-3' }, // Same as head
        ],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        isGrowing: false,
      };

      const result = collisionDetector.checkSnakeSelfCollision(snake);
      expect(result).toBe(true);
    });

    it('should return false when snake head does not collide with body', () => {
      const snake: Snake = {
        segments: [
          { x: 100, y: 100, id: 'head' },
          { x: 80, y: 100, id: 'body-1' },
          { x: 60, y: 100, id: 'body-2' },
          { x: 40, y: 100, id: 'body-3' },
        ],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        isGrowing: false,
      };

      const result = collisionDetector.checkSnakeSelfCollision(snake);
      expect(result).toBe(false);
    });
  });

  describe('checkPositionCollisions', () => {
    const snake: Snake = {
      segments: [
        { x: 100, y: 100, id: 'head' },
        { x: 80, y: 100, id: 'body-1' },
        { x: 60, y: 100, id: 'body-2' },
      ],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      isGrowing: false,
    };

    it('should detect wall collision', () => {
      const position: Position = { x: -10, y: 100 };

      const result = collisionDetector.checkPositionCollisions(position, snake);
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionType).toBe('wall');
      expect(result.position).toEqual(position);
    });

    it('should detect self collision', () => {
      const position: Position = { x: 80, y: 100 }; // Body position

      const result = collisionDetector.checkPositionCollisions(position, snake);
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionType).toBe('self');
      expect(result.position).toEqual(position);
      expect(result.segmentIndex).toBe(1);
    });

    it('should detect food collision', () => {
      const position: Position = { x: 200, y: 200 };
      const food: Food = { x: 200, y: 200, type: 'normal', points: 10 };

      const result = collisionDetector.checkPositionCollisions(position, snake, food);
      
      expect(result.hasCollision).toBe(true);
      expect(result.collisionType).toBe('food');
      expect(result.position).toEqual(position);
      expect(result.food).toEqual(food);
    });

    it('should return no collision for safe position', () => {
      const position: Position = { x: 200, y: 200 };

      const result = collisionDetector.checkPositionCollisions(position, snake);
      
      expect(result.hasCollision).toBe(false);
      expect(result.collisionType).toBe('none');
      expect(result.position).toEqual(position);
    });
  });

  describe('checkBoundingBoxCollision', () => {
    it('should return true for overlapping rectangles', () => {
      const rect1: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
      const rect2: BoundingBox = { x: 25, y: 25, width: 50, height: 50 };

      const result = collisionDetector.checkBoundingBoxCollision(rect1, rect2);
      expect(result).toBe(true);
    });

    it('should return false for non-overlapping rectangles', () => {
      const rect1: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
      const rect2: BoundingBox = { x: 60, y: 60, width: 50, height: 50 };

      const result = collisionDetector.checkBoundingBoxCollision(rect1, rect2);
      expect(result).toBe(false);
    });

    it('should return true for touching rectangles', () => {
      const rect1: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
      const rect2: BoundingBox = { x: 50, y: 0, width: 50, height: 50 };

      const result = collisionDetector.checkBoundingBoxCollision(rect1, rect2);
      expect(result).toBe(false); // Touching edges don't count as collision
    });
  });

  describe('checkCircleRectCollision', () => {
    it('should return true when circle overlaps rectangle', () => {
      const circle = { x: 25, y: 25, radius: 15 };
      const rect: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };

      const result = collisionDetector.checkCircleRectCollision(circle, rect);
      expect(result).toBe(true);
    });

    it('should return false when circle does not overlap rectangle', () => {
      const circle = { x: 100, y: 100, radius: 10 };
      const rect: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };

      const result = collisionDetector.checkCircleRectCollision(circle, rect);
      expect(result).toBe(false);
    });
  });

  describe('isPositionInBounds', () => {
    it('should return true for position inside bounds', () => {
      const position: Position = { x: 100, y: 100 };

      const result = collisionDetector.isPositionInBounds(position);
      expect(result).toBe(true);
    });

    it('should return false for position outside bounds', () => {
      const position: Position = { x: -10, y: 100 };

      const result = collisionDetector.isPositionInBounds(position);
      expect(result).toBe(false);
    });
  });

  describe('isPositionValid', () => {
    it('should return true for valid unoccupied position', () => {
      const position: Position = { x: 100, y: 100 };
      const occupiedPositions: Position[] = [{ x: 200, y: 200 }];

      const result = collisionDetector.isPositionValid(position, occupiedPositions);
      expect(result).toBe(true);
    });

    it('should return false for occupied position', () => {
      const position: Position = { x: 100, y: 100 };
      const occupiedPositions: Position[] = [{ x: 100, y: 100 }];

      const result = collisionDetector.isPositionValid(position, occupiedPositions);
      expect(result).toBe(false);
    });

    it('should return false for out of bounds position', () => {
      const position: Position = { x: -10, y: 100 };

      const result = collisionDetector.isPositionValid(position);
      expect(result).toBe(false);
    });
  });

  describe('snapToGrid', () => {
    it('should snap position to nearest grid cell', () => {
      const position: Position = { x: 105, y: 95 };

      const snapped = collisionDetector.snapToGrid(position);
      expect(snapped).toEqual({ x: 100, y: 100 });
    });

    it('should handle positions already on grid', () => {
      const position: Position = { x: 100, y: 100 };

      const snapped = collisionDetector.snapToGrid(position);
      expect(snapped).toEqual({ x: 100, y: 100 });
    });
  });

  describe('isSameGridCell', () => {
    it('should return true for positions in same grid cell', () => {
      // Both positions should snap to grid cell (100, 100) with gridSize 20
      const pos1: Position = { x: 95, y: 95 };   // snaps to (100, 100)
      const pos2: Position = { x: 105, y: 105 }; // snaps to (100, 100)

      const result = collisionDetector.isSameGridCell(pos1, pos2);
      expect(result).toBe(true);
    });

    it('should return false for positions in different grid cells', () => {
      const pos1: Position = { x: 105, y: 95 };
      const pos2: Position = { x: 125, y: 105 };

      const result = collisionDetector.isSameGridCell(pos1, pos2);
      expect(result).toBe(false);
    });
  });

  describe('getDistance', () => {
    it('should calculate correct Euclidean distance', () => {
      const pos1: Position = { x: 0, y: 0 };
      const pos2: Position = { x: 3, y: 4 };

      const distance = collisionDetector.getDistance(pos1, pos2);
      expect(distance).toBe(5); // 3-4-5 triangle
    });
  });

  describe('getManhattanDistance', () => {
    it('should calculate correct Manhattan distance', () => {
      const pos1: Position = { x: 0, y: 0 };
      const pos2: Position = { x: 3, y: 4 };

      const distance = collisionDetector.getManhattanDistance(pos1, pos2);
      expect(distance).toBe(7); // |3| + |4|
    });
  });

  describe('isAdjacentToAny', () => {
    it('should return true when position is adjacent to any in list', () => {
      const position: Position = { x: 100, y: 100 };
      const positions: Position[] = [
        { x: 120, y: 100 }, // Adjacent
        { x: 200, y: 200 }, // Not adjacent
      ];

      const result = collisionDetector.isAdjacentToAny(position, positions);
      expect(result).toBe(true);
    });

    it('should return false when position is not adjacent to any in list', () => {
      const position: Position = { x: 100, y: 100 };
      const positions: Position[] = [
        { x: 140, y: 100 }, // Not adjacent
        { x: 200, y: 200 }, // Not adjacent
      ];

      const result = collisionDetector.isAdjacentToAny(position, positions);
      expect(result).toBe(false);
    });
  });

  describe('updateDimensions', () => {
    it('should update collision detector dimensions', () => {
      const newWidth = 400;
      const newHeight = 300;
      const newGridSize = 10;

      collisionDetector.updateDimensions(newWidth, newHeight, newGridSize);

      const config = collisionDetector.getConfig();
      expect(config.canvasWidth).toBe(newWidth);
      expect(config.canvasHeight).toBe(newHeight);
      expect(config.gridSize).toBe(newGridSize);
    });
  });

  describe('getSafePositions', () => {
    it('should return positions away from snake', () => {
      const snake: Snake = {
        segments: [
          { x: 100, y: 100, id: 'head' },
          { x: 80, y: 100, id: 'body-1' },
        ],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        isGrowing: false,
      };

      const safePositions = collisionDetector.getSafePositions(snake, 2);

      // All returned positions should be at least 2 grid units away
      safePositions.forEach(position => {
        snake.segments.forEach(segment => {
          const distance = collisionDetector.getDistance(position, segment);
          expect(distance).toBeGreaterThanOrEqual(2 * gridSize);
        });
      });
    });
  });

  describe('checkMultiplePositions', () => {
    it('should check collisions for multiple positions', () => {
      const snake: Snake = {
        segments: [
          { x: 100, y: 100, id: 'head' },
          { x: 80, y: 100, id: 'body-1' },
        ],
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        isGrowing: false,
      };

      const positions: Position[] = [
        { x: 200, y: 200 }, // Safe
        { x: -10, y: 100 },  // Wall collision
        { x: 80, y: 100 },   // Self collision
      ];

      const results = collisionDetector.checkMultiplePositions(positions, snake);

      expect(results).toHaveLength(3);
      expect(results[0].collisionType).toBe('none');
      expect(results[1].collisionType).toBe('wall');
      expect(results[2].collisionType).toBe('self');
    });
  });

  describe('edge cases', () => {
    it('should handle zero-sized canvas', () => {
      const zeroDetector = new CollisionDetector(20, 0, 0);
      const position: Position = { x: 0, y: 0 };

      const result = zeroDetector.checkWallCollision(position);
      expect(result).toBe(true); // 0,0 is outside bounds for 0-sized canvas
    });

    it('should handle very large grid size', () => {
      const largeDetector = new CollisionDetector(1000, 800, 600);
      const position: Position = { x: 500, y: 300 };

      const result = largeDetector.checkWallCollision(position);
      expect(result).toBe(false);
    });

    it('should handle collision tolerance edge cases', () => {
      const tolerance = collisionDetector.getCollisionTolerance();
      expect(tolerance).toBeGreaterThan(0);

      const pos1: Position = { x: 100, y: 100 };
      const pos2: Position = { x: 100 + tolerance, y: 100 };

      const result = collisionDetector.checkCollisionWithTolerance(pos1, pos2, tolerance);
      expect(result).toBe(true);
    });
  });
});