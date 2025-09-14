import type { Snake, SnakeSegment, Direction, Position } from './types';
import { GAME_CONFIG, DIRECTION_VECTORS, OPPOSITE_DIRECTIONS } from './constants';

/**
 * Snake game class for managing snake state and behavior
 */
export class SnakeGame {
  private snake!: Snake;
  private gridSize: number;
  private canvasSize: { width: number; height: number };

  constructor(
    canvasWidth: number = GAME_CONFIG.CANVAS_WIDTH,
    canvasHeight: number = GAME_CONFIG.CANVAS_HEIGHT,
    gridSize: number = GAME_CONFIG.GRID_SIZE
  ) {
    this.gridSize = gridSize;
    this.canvasSize = { width: canvasWidth, height: canvasHeight };
    this.initializeSnake();
  }

  /**
   * Initialize snake at center of canvas with initial length
   */
  private initializeSnake(): void {
    const centerX = Math.floor(this.canvasSize.width / 2 / this.gridSize) * this.gridSize;
    const centerY = Math.floor(this.canvasSize.height / 2 / this.gridSize) * this.gridSize;

    this.snake = {
      segments: [
        { x: centerX, y: centerY, id: 'head' },
        { x: centerX - this.gridSize, y: centerY, id: 'body-1' },
        { x: centerX - this.gridSize * 2, y: centerY, id: 'body-2' },
      ],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      isGrowing: false,
    };
  }

  /**
   * Get current snake state
   */
  public getSnake(): Snake {
    return { ...this.snake };
  }

  /**
   * Get snake head position
   */
  public getHead(): SnakeSegment {
    return { ...this.snake.segments[0] };
  }

  /**
   * Get snake body segments (excluding head)
   */
  public getBody(): SnakeSegment[] {
    return this.snake.segments.slice(1).map(segment => ({ ...segment }));
  }

  /**
   * Change snake direction with validation
   */
  public changeDirection(newDirection: Direction): boolean {
    // Prevent 180-degree turns based on next direction (buffered direction)
    if (OPPOSITE_DIRECTIONS[this.snake.nextDirection] === newDirection) {
      return false;
    }
    
    this.snake.nextDirection = newDirection;
    return true;
  }

  /**
   * Move snake one step forward
   */
  public move(): boolean {
    // Update direction
    this.snake.direction = this.snake.nextDirection;

    const head = this.snake.segments[0];
    const directionVector = DIRECTION_VECTORS[this.snake.direction];
    
    // Calculate new head position
    const newHead: SnakeSegment = {
      x: head.x + directionVector.x * this.gridSize,
      y: head.y + directionVector.y * this.gridSize,
      id: `head-${Date.now()}`,
    };

    // Check wall collision
    if (this.checkWallCollision(newHead)) {
      return false;
    }

    // Check self collision
    if (this.checkSelfCollision(newHead)) {
      return false;
    }

    // Add new head
    this.snake.segments.unshift(newHead);

    // Remove tail if not growing
    if (!this.snake.isGrowing) {
      this.snake.segments.pop();
    } else {
      this.snake.isGrowing = false;
    }

    // Update segment IDs
    this.updateSegmentIds();

    return true;
  }

  /**
   * Make snake grow on next move
   */
  public grow(): void {
    this.snake.isGrowing = true;
  }

  /**
   * Check if position collides with walls
   */
  public checkWallCollision(position: Position): boolean {
    return (
      position.x < 0 ||
      position.x >= this.canvasSize.width ||
      position.y < 0 ||
      position.y >= this.canvasSize.height
    );
  }

  /**
   * Check if position collides with snake body
   */
  public checkSelfCollision(position: Position): boolean {
    return this.snake.segments.some(segment => 
      segment.x === position.x && segment.y === position.y
    );
  }

  /**
   * Check if position collides with snake (including head)
   */
  public checkSnakeCollision(position: Position): boolean {
    return this.snake.segments.some(segment =>
      segment.x === position.x && segment.y === position.y
    );
  }

  /**
   * Get snake length
   */
  public getLength(): number {
    return this.snake.segments.length;
  }

  /**
   * Reset snake to initial state
   */
  public reset(): void {
    this.initializeSnake();
  }

  /**
   * Get valid positions for food placement (not occupied by snake)
   */
  public getValidFoodPositions(): Position[] {
    const positions: Position[] = [];
    
    for (let x = 0; x < this.canvasSize.width; x += this.gridSize) {
      for (let y = 0; y < this.canvasSize.height; y += this.gridSize) {
        const position = { x, y };
        if (!this.checkSnakeCollision(position)) {
          positions.push(position);
        }
      }
    }
    
    return positions;
  }

  /**
   * Update segment IDs for proper tracking
   */
  private updateSegmentIds(): void {
    this.snake.segments.forEach((segment, index) => {
      if (index === 0) {
        segment.id = 'head';
      } else {
        segment.id = `body-${index}`;
      }
    });
  }

  /**
   * Get current direction
   */
  public getCurrentDirection(): Direction {
    return this.snake.direction;
  }

  /**
   * Get next direction
   */
  public getNextDirection(): Direction {
    return this.snake.nextDirection;
  }

  /**
   * Check if snake is at given position
   */
  public isSnakeAt(position: Position): boolean {
    return this.checkSnakeCollision(position);
  }
}