import type { Snake, SnakeSegment, Direction, Position } from '@/lib/game/types';
import { getNextPosition } from '@/lib/utils/direction';

/**
 * Movement configuration options
 */
interface MovementOptions {
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
  enableWrapAround?: boolean;
}

/**
 * Movement result interface
 */
interface MovementResult {
  success: boolean;
  newPosition: Position;
  collisionType?: 'wall' | 'self' | 'none';
  removedTail?: SnakeSegment | undefined;
}

/**
 * Snake movement class for handling snake movement logic
 * Manages position calculations, collision detection, and snake growth
 */
export class SnakeMovement {
  private readonly options: Required<MovementOptions>;

  constructor(options: MovementOptions) {
    this.options = {
      enableWrapAround: false,
      ...options,
    };
  }

  /**
   * Calculate next head position based on current direction
   */
  public calculateNextHeadPosition(
    snake: Snake,
    direction?: Direction
  ): Position {
    const currentHead = snake.segments[0];
    const moveDirection = direction || snake.direction;

    return getNextPosition(currentHead, moveDirection, this.options.gridSize);
  }

  /**
   * Move snake in the specified direction
   */
  public moveSnake(snake: Snake, direction?: Direction): MovementResult {
    const moveDirection = direction || snake.direction;
    console.log('SnakeMovement.moveSnake() - current snake segments:', snake.segments.length, 'direction:', moveDirection);
    
    const newHeadPosition = this.calculateNextHeadPosition(snake, moveDirection);
    console.log('Calculated new head position:', newHeadPosition);

    // Handle boundary wrapping if enabled
    const wrappedPosition = this.options.enableWrapAround
      ? this.wrapPosition(newHeadPosition)
      : newHeadPosition;

    // Check for collisions
    const collisionType = this.checkCollisions(snake, wrappedPosition);

    if (collisionType !== 'none') {
      console.log('Collision detected:', collisionType);
      return {
        success: false,
        newPosition: wrappedPosition,
        collisionType,
      };
    }

    // Create new head segment
    const newHead: SnakeSegment = {
      x: wrappedPosition.x,
      y: wrappedPosition.y,
      id: 'head',
    };

    console.log('Adding new head segment:', newHead);
    // Add new head to snake
    snake.segments.unshift(newHead);

    let removedTail: SnakeSegment | undefined;

    // Remove tail if not growing
    if (!snake.isGrowing) {
      removedTail = snake.segments.pop();
      console.log('Removed tail segment:', removedTail);
    } else {
      snake.isGrowing = false;
      console.log('Snake is growing, keeping tail');
    }

    // Update direction and next direction
    snake.direction = moveDirection;
    snake.nextDirection = moveDirection;

    // Update segment IDs
    this.updateSegmentIds(snake);

    console.log('Movement complete - new snake segments:', snake.segments.length, 'head at:', snake.segments[0]);

    return {
      success: true,
      newPosition: wrappedPosition,
      collisionType: 'none',
      removedTail,
    };
  }

  /**
   * Check for collisions at the given position
   */
  public checkCollisions(
    snake: Snake,
    position: Position
  ): 'wall' | 'self' | 'none' {
    // Check wall collision
    if (this.checkWallCollision(position)) {
      return 'wall';
    }

    // Check self collision
    if (this.checkSelfCollision(snake, position)) {
      return 'self';
    }

    return 'none';
  }

  /**
   * Check if position collides with walls
   */
  public checkWallCollision(position: Position): boolean {
    if (this.options.enableWrapAround) {
      return false; // No wall collisions with wrap around
    }

    return (
      position.x < 0 ||
      position.x >= this.options.canvasWidth ||
      position.y < 0 ||
      position.y >= this.options.canvasHeight
    );
  }

  /**
   * Check if position collides with snake body
   */
  public checkSelfCollision(snake: Snake, position: Position): boolean {
    // Check collision with all current segments
    return snake.segments.some(
      (segment) => segment.x === position.x && segment.y === position.y
    );
  }

  /**
   * Wrap position around canvas boundaries
   */
  public wrapPosition(position: Position): Position {
    if (!this.options.enableWrapAround) {
      return position;
    }

    let { x, y } = position;

    // Wrap horizontally
    if (x < 0) {
      x = this.options.canvasWidth - this.options.gridSize;
    } else if (x >= this.options.canvasWidth) {
      x = 0;
    }

    // Wrap vertically
    if (y < 0) {
      y = this.options.canvasHeight - this.options.gridSize;
    } else if (y >= this.options.canvasHeight) {
      y = 0;
    }

    return { x, y };
  }

  /**
   * Make snake grow on next move
   */
  public setGrowth(snake: Snake, shouldGrow: boolean = true): void {
    snake.isGrowing = shouldGrow;
  }

  /**
   * Update segment IDs for proper tracking
   */
  private updateSegmentIds(snake: Snake): void {
    snake.segments.forEach((segment, index) => {
      if (index === 0) {
        segment.id = 'head';
      } else {
        segment.id = `body-${index}`;
      }
    });
  }

  /**
   * Get valid positions around the snake (useful for food placement)
   */
  public getValidPositionsAroundSnake(
    snake: Snake,
    minDistance: number = 1
  ): Position[] {
    const validPositions: Position[] = [];
    const gridSize = this.options.gridSize;

    for (let x = 0; x < this.options.canvasWidth; x += gridSize) {
      for (let y = 0; y < this.options.canvasHeight; y += gridSize) {
        const position = { x, y };

        // Check if position is occupied by snake
        if (this.checkSelfCollision(snake, position)) {
          continue;
        }

        // Check minimum distance from snake
        if (minDistance > 1) {
          const tooClose = snake.segments.some((segment) => {
            const distance = Math.abs(segment.x - x) + Math.abs(segment.y - y);
            return distance < minDistance * gridSize;
          });

          if (tooClose) {
            continue;
          }
        }

        validPositions.push(position);
      }
    }

    return validPositions;
  }

  /**
   * Calculate snake movement speed based on length or other factors
   */
  public calculateMovementSpeed(
    snake: Snake,
    baseSpeed: number,
    speedIncrease: number = 0
  ): number {
    // Can implement speed increases based on snake length
    const lengthBonus = Math.floor(snake.segments.length / 5) * speedIncrease;
    return Math.max(baseSpeed - lengthBonus, 50); // Minimum speed of 50ms
  }

  /**
   * Update movement options
   */
  public updateOptions(options: Partial<MovementOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get current movement options
   */
  public getOptions(): Required<MovementOptions> {
    return { ...this.options };
  }

  /**
   * Reset movement system to initial state
   */
  public reset(): void {
    // Movement system is stateless, no reset needed
    // This method exists for consistency with other game systems
  }
}