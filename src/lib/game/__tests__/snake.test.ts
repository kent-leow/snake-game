import { SnakeGame } from '../snake';
import { GAME_CONFIG } from '../constants';

describe('SnakeGame', () => {
  let game: SnakeGame;
  const canvasWidth = 800;
  const canvasHeight = 600;
  const gridSize = 20;

  beforeEach(() => {
    game = new SnakeGame(canvasWidth, canvasHeight, gridSize);
  });

  describe('Initialization', () => {
    it('should initialize snake at center of canvas', () => {
      const snake = game.getSnake();
      const expectedCenterX = Math.floor(canvasWidth / 2 / gridSize) * gridSize;
      const expectedCenterY =
        Math.floor(canvasHeight / 2 / gridSize) * gridSize;

      expect(snake.segments[0].x).toBe(expectedCenterX);
      expect(snake.segments[0].y).toBe(expectedCenterY);
    });

    it('should initialize snake with correct length', () => {
      const snake = game.getSnake();
      expect(snake.segments).toHaveLength(GAME_CONFIG.INITIAL_SNAKE_LENGTH);
    });

    it('should initialize snake facing right', () => {
      const snake = game.getSnake();
      expect(snake.direction).toBe('RIGHT');
      expect(snake.nextDirection).toBe('RIGHT');
    });

    it('should initialize snake segments with proper IDs', () => {
      const snake = game.getSnake();
      expect(snake.segments[0].id).toBe('head');
      expect(snake.segments[1].id).toBe('body-1');
      expect(snake.segments[2].id).toBe('body-2');
    });

    it('should initialize snake not growing', () => {
      const snake = game.getSnake();
      expect(snake.isGrowing).toBe(false);
    });
  });

  describe('Direction Changes', () => {
    it('should allow valid direction changes', () => {
      expect(game.changeDirection('UP')).toBe(true);
      // Direction should still be RIGHT until move() processes the queue
      expect(game.getCurrentDirection()).toBe('RIGHT');
      
      // Move to process the direction change
      game.move();
      expect(game.getCurrentDirection()).toBe('UP');
    });

    it('should prevent 180-degree turns', () => {
      // Snake starts facing RIGHT, should not allow LEFT
      expect(game.changeDirection('LEFT')).toBe(false);
      expect(game.getCurrentDirection()).toBe('RIGHT');
    });

    it('should allow perpendicular direction changes', () => {
      expect(game.changeDirection('UP')).toBe(true);
      game.move(); // Process the direction change
      expect(game.getCurrentDirection()).toBe('UP');

      // Now that direction is UP, DOWN should be prevented as 180-degree turn
      expect(game.changeDirection('DOWN')).toBe(false);

      // LEFT and RIGHT should be allowed from UP
      expect(game.changeDirection('LEFT')).toBe(true);
      game.move(); // Process the direction change
      expect(game.getCurrentDirection()).toBe('LEFT');

      // After setting to LEFT, RIGHT should be prevented as 180-degree turn
      expect(game.changeDirection('RIGHT')).toBe(false);
    });
  });

  describe('Movement', () => {
    it('should move snake forward correctly', () => {
      const initialHead = game.getHead();
      const result = game.move();

      expect(result).toBe(true);
      const newHead = game.getHead();
      expect(newHead.x).toBe(initialHead.x + gridSize);
      expect(newHead.y).toBe(initialHead.y);
    });

    it('should maintain snake length when not growing', () => {
      const initialLength = game.getLength();
      game.move();
      expect(game.getLength()).toBe(initialLength);
    });

    it('should increase snake length when growing', () => {
      const initialLength = game.getLength();
      game.grow();
      game.move();
      expect(game.getLength()).toBe(initialLength + 1);
    });

    it('should update direction before moving', () => {
      game.changeDirection('UP');
      const initialHead = game.getHead();
      game.move();

      const newHead = game.getHead();
      expect(newHead.x).toBe(initialHead.x);
      expect(newHead.y).toBe(initialHead.y - gridSize);
      expect(game.getCurrentDirection()).toBe('UP');
    });

    it('should update segment IDs after movement', () => {
      game.move();
      const snake = game.getSnake();

      expect(snake.segments[0].id).toBe('head');
      snake.segments.slice(1).forEach((segment, index) => {
        expect(segment.id).toBe(`body-${index + 1}`);
      });
    });
  });

  describe('Collision Detection', () => {
    describe('Wall Collision', () => {
      it('should detect collision with left wall', () => {
        const position = { x: -gridSize, y: 100 };
        expect(game.checkWallCollision(position)).toBe(true);
      });

      it('should detect collision with right wall', () => {
        const position = { x: canvasWidth, y: 100 };
        expect(game.checkWallCollision(position)).toBe(true);
      });

      it('should detect collision with top wall', () => {
        const position = { x: 100, y: -gridSize };
        expect(game.checkWallCollision(position)).toBe(true);
      });

      it('should detect collision with bottom wall', () => {
        const position = { x: 100, y: canvasHeight };
        expect(game.checkWallCollision(position)).toBe(true);
      });

      it('should not detect collision for valid positions', () => {
        const position = { x: 100, y: 100 };
        expect(game.checkWallCollision(position)).toBe(false);
      });
    });

    describe('Self Collision', () => {
      it('should detect collision with snake body', () => {
        const snake = game.getSnake();
        const bodyPosition = snake.segments[1];
        expect(game.checkSelfCollision(bodyPosition)).toBe(true);
      });

      it('should not detect collision for empty positions', () => {
        const emptyPosition = { x: 0, y: 0 };
        expect(game.checkSelfCollision(emptyPosition)).toBe(false);
      });
    });

    describe('Snake Collision', () => {
      it('should detect collision with any snake segment including head', () => {
        const snake = game.getSnake();
        const headPosition = snake.segments[0];
        expect(game.checkSnakeCollision(headPosition)).toBe(true);
      });
    });
  });

  describe('Game State Management', () => {
    it('should provide snake head separately', () => {
      const head = game.getHead();
      const snake = game.getSnake();
      expect(head).toEqual(snake.segments[0]);
    });

    it('should provide snake body excluding head', () => {
      const body = game.getBody();
      const snake = game.getSnake();
      expect(body).toEqual(snake.segments.slice(1));
    });

    it('should reset snake to initial state', () => {
      // Move and grow snake
      game.move();
      game.grow();
      game.move();

      // Reset
      game.reset();

      // Check if back to initial state
      const snake = game.getSnake();
      expect(snake.segments).toHaveLength(GAME_CONFIG.INITIAL_SNAKE_LENGTH);
      expect(snake.direction).toBe('RIGHT');
      expect(snake.nextDirection).toBe('RIGHT');
      expect(snake.isGrowing).toBe(false);
    });
  });

  describe('Food Position Generation', () => {
    it('should generate valid food positions', () => {
      const validPositions = game.getValidFoodPositions();

      expect(validPositions.length).toBeGreaterThan(0);

      validPositions.forEach(position => {
        expect(position.x % gridSize).toBe(0);
        expect(position.y % gridSize).toBe(0);
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.x).toBeLessThan(canvasWidth);
        expect(position.y).toBeGreaterThanOrEqual(0);
        expect(position.y).toBeLessThan(canvasHeight);
        expect(game.checkSnakeCollision(position)).toBe(false);
      });
    });

    it('should exclude snake positions from valid food positions', () => {
      const validPositions = game.getValidFoodPositions();
      const snake = game.getSnake();

      snake.segments.forEach(segment => {
        const isIncluded = validPositions.some(
          pos => pos.x === segment.x && pos.y === segment.y
        );
        expect(isIncluded).toBe(false);
      });
    });
  });

  describe('Movement with Wall Collision', () => {
    it('should return false when moving into wall', () => {
      // Move snake to near the right wall
      const snake = game.getSnake();
      const moves = Math.floor((canvasWidth - snake.segments[0].x) / gridSize);

      // Move to wall
      for (let i = 0; i < moves; i++) {
        const result = game.move();
        if (i < moves - 1) {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(false); // Should hit wall
        }
      }
    });
  });

  describe('Growth Mechanics', () => {
    it('should set growing flag correctly', () => {
      expect(game.getSnake().isGrowing).toBe(false);
      game.grow();
      expect(game.getSnake().isGrowing).toBe(true);
      game.move();
      expect(game.getSnake().isGrowing).toBe(false);
    });

    it('should add segment when growing', () => {
      const initialLength = game.getLength();
      game.grow();
      game.move();
      expect(game.getLength()).toBe(initialLength + 1);
    });
  });
});
