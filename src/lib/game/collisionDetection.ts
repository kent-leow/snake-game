import type { Position, Snake, Food } from './types';

/**
 * Collision result interface
 */
export interface CollisionResult {
  hasCollision: boolean;
  collisionType: 'wall' | 'self' | 'food' | 'none';
  position: Position;
  segmentIndex?: number;
  food?: Food;
}

/**
 * Bounding box interface for more precise collision detection
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Collision detector class for handling all types of game collisions
 * Provides pixel-perfect collision detection for snake, food, and wall interactions
 */
export class CollisionDetector {
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /**
   * Check collision between snake head and food
   */
  public checkFoodCollision(snakeHead: Position, food: Food | null): boolean {
    if (!food) return false;
    
    return snakeHead.x === food.x && snakeHead.y === food.y;
  }

  /**
   * Check collision between snake head and walls
   */
  public checkWallCollision(
    position: Position,
    canvasWidth?: number,
    canvasHeight?: number
  ): boolean {
    const width = canvasWidth || this.canvasWidth;
    const height = canvasHeight || this.canvasHeight;

    return (
      position.x < 0 ||
      position.x >= width ||
      position.y < 0 ||
      position.y >= height
    );
  }

  /**
   * Check collision between snake head and its body
   */
  public checkSelfCollision(head: Position, body: Position[]): boolean {
    // Skip the head itself if it's included in the body array
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }

  /**
   * Check collision between snake head and entire snake body (excluding head)
   */
  public checkSnakeSelfCollision(snake: Snake): boolean {
    const head = snake.segments[0];
    const body = snake.segments.slice(1); // Exclude head
    
    return this.checkSelfCollision(head, body);
  }

  /**
   * Comprehensive collision check for a position
   */
  public checkPositionCollisions(
    position: Position,
    snake: Snake,
    food: Food | null = null
  ): CollisionResult {
    // Check wall collision
    if (this.checkWallCollision(position)) {
      return {
        hasCollision: true,
        collisionType: 'wall',
        position,
      };
    }

    // Check self collision
    const selfCollisionIndex = this.findSelfCollisionIndex(position, snake.segments);
    if (selfCollisionIndex !== -1) {
      return {
        hasCollision: true,
        collisionType: 'self',
        position,
        segmentIndex: selfCollisionIndex,
      };
    }

    // Check food collision
    if (food && this.checkFoodCollision(position, food)) {
      return {
        hasCollision: true,
        collisionType: 'food',
        position,
        food,
      };
    }

    return {
      hasCollision: false,
      collisionType: 'none',
      position,
    };
  }

  /**
   * Find which segment index the position collides with
   */
  private findSelfCollisionIndex(position: Position, segments: Position[]): number {
    return segments.findIndex(
      segment => segment.x === position.x && segment.y === position.y
    );
  }

  /**
   * Bounding box collision detection (for more complex shapes)
   */
  public checkBoundingBoxCollision(
    rect1: BoundingBox,
    rect2: BoundingBox
  ): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * Check if a circle collides with a rectangle (for round food items)
   */
  public checkCircleRectCollision(
    circle: { x: number; y: number; radius: number },
    rect: BoundingBox
  ): boolean {
    const distX = Math.abs(circle.x - rect.x - rect.width / 2);
    const distY = Math.abs(circle.y - rect.y - rect.height / 2);

    if (distX > (rect.width / 2 + circle.radius)) return false;
    if (distY > (rect.height / 2 + circle.radius)) return false;

    if (distX <= (rect.width / 2)) return true;
    if (distY <= (rect.height / 2)) return true;

    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
  }

  /**
   * Check if position is within canvas bounds
   */
  public isPositionInBounds(position: Position): boolean {
    return !this.checkWallCollision(position);
  }

  /**
   * Check if position is valid for object placement
   */
  public isPositionValid(
    position: Position,
    occupiedPositions: Position[] = []
  ): boolean {
    // Check bounds
    if (!this.isPositionInBounds(position)) {
      return false;
    }

    // Check if position is occupied
    return !occupiedPositions.some(
      occupied => occupied.x === position.x && occupied.y === position.y
    );
  }

  /**
   * Get collision tolerance for different grid sizes
   */
  public getCollisionTolerance(): number {
    // Return a small tolerance value for collision detection
    return Math.max(1, this.gridSize * 0.1);
  }

  /**
   * Check collision with tolerance (for smoother gameplay)
   */
  public checkCollisionWithTolerance(
    pos1: Position,
    pos2: Position,
    tolerance?: number
  ): boolean {
    const tol = tolerance || this.getCollisionTolerance();
    
    return (
      Math.abs(pos1.x - pos2.x) <= tol &&
      Math.abs(pos1.y - pos2.y) <= tol
    );
  }

  /**
   * Get nearest grid position for a given coordinate
   */
  public snapToGrid(position: Position): Position {
    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize,
    };
  }

  /**
   * Check if two positions are on the same grid cell
   */
  public isSameGridCell(pos1: Position, pos2: Position): boolean {
    const snapped1 = this.snapToGrid(pos1);
    const snapped2 = this.snapToGrid(pos2);
    
    return snapped1.x === snapped2.x && snapped1.y === snapped2.y;
  }

  /**
   * Get distance between two positions
   */
  public getDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get Manhattan distance between two positions
   */
  public getManhattanDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  /**
   * Check if position is adjacent to any position in a list
   */
  public isAdjacentToAny(position: Position, positions: Position[]): boolean {
    return positions.some(pos => {
      const distance = this.getManhattanDistance(position, pos);
      return distance === this.gridSize;
    });
  }

  /**
   * Update collision detector dimensions
   */
  public updateDimensions(width: number, height: number, gridSize?: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    if (gridSize) {
      this.gridSize = gridSize;
    }
  }

  /**
   * Get collision detector configuration
   */
  public getConfig(): {
    gridSize: number;
    canvasWidth: number;
    canvasHeight: number;
  } {
    return {
      gridSize: this.gridSize,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
    };
  }

  /**
   * Batch collision check for multiple positions
   */
  public checkMultiplePositions(
    positions: Position[],
    snake: Snake,
    food: Food | null = null
  ): CollisionResult[] {
    return positions.map(position => 
      this.checkPositionCollisions(position, snake, food)
    );
  }

  /**
   * Get safe spawning positions (away from snake)
   */
  public getSafePositions(
    snake: Snake,
    minDistance: number = 1
  ): Position[] {
    const safePositions: Position[] = [];
    const minDistancePixels = minDistance * this.gridSize;

    for (let y = 0; y < this.canvasHeight; y += this.gridSize) {
      for (let x = 0; x < this.canvasWidth; x += this.gridSize) {
        const position = { x, y };

        // Check if position is safe from snake
        const isSafe = snake.segments.every(segment => {
          const distance = this.getDistance(position, segment);
          return distance >= minDistancePixels;
        });

        if (isSafe) {
          safePositions.push(position);
        }
      }
    }

    return safePositions;
  }
}