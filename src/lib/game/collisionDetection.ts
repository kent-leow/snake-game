import type { Position, Snake, Food, SnakeSegment } from './types';

/**
 * Boundary configuration interface for collision detection
 */
export interface BoundaryConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Collision result interface
 */
export interface CollisionResult {
  hasCollision: boolean;
  type: 'boundary' | 'self' | 'none';
  position?: Position;
  details?: string;
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
  private boundaries: BoundaryConfig;
  private gridSize: number;

  constructor(canvasWidth: number, canvasHeight: number, gridSize: number) {
    this.gridSize = gridSize;
    this.boundaries = {
      top: 0,
      bottom: canvasHeight - gridSize,
      left: 0,
      right: canvasWidth - gridSize,
    };
  }

  /**
   * Check all collision types for a snake
   * Main collision detection entry point as specified in task requirements
   */
  public checkAllCollisions(snake: Snake): CollisionResult {
    const head = snake.segments[0];

    // Check boundary collisions first (most common)
    const boundaryCollision = this.checkBoundaryCollision(head);
    if (boundaryCollision.hasCollision) {
      return boundaryCollision;
    }

    // Check self-collision
    const selfCollision = this.checkSelfCollision(
      head,
      snake.segments.slice(1)
    );
    if (selfCollision.hasCollision) {
      return selfCollision;
    }

    return { hasCollision: false, type: 'none' };
  }

  /**
   * Check collision between snake head and food
   */
  public checkFoodCollision(snakeHead: Position, food: Food | null): boolean {
    if (!food) return false;
    
    return snakeHead.x === food.x && snakeHead.y === food.y;
  }

  /**
   * Check boundary collision as specified in task requirements
   */
  private checkBoundaryCollision(head: Position): CollisionResult {
    if (head.x < this.boundaries.left) {
      return {
        hasCollision: true,
        type: 'boundary',
        position: head,
        details: 'Left boundary collision',
      };
    }

    if (head.x > this.boundaries.right) {
      return {
        hasCollision: true,
        type: 'boundary',
        position: head,
        details: 'Right boundary collision',
      };
    }

    if (head.y < this.boundaries.top) {
      return {
        hasCollision: true,
        type: 'boundary',
        position: head,
        details: 'Top boundary collision',
      };
    }

    if (head.y > this.boundaries.bottom) {
      return {
        hasCollision: true,
        type: 'boundary',
        position: head,
        details: 'Bottom boundary collision',
      };
    }

    return { hasCollision: false, type: 'none' };
  }

  /**
   * Check collision between snake head and walls
   */
  public checkWallCollision(
    position: Position,
    canvasWidth?: number,
    canvasHeight?: number
  ): boolean {
    const boundaries = canvasWidth && canvasHeight ? {
      top: 0,
      bottom: canvasHeight - this.gridSize,
      left: 0,
      right: canvasWidth - this.gridSize,
    } : this.boundaries;

    return (
      position.x < boundaries.left ||
      position.x > boundaries.right ||
      position.y < boundaries.top ||
      position.y > boundaries.bottom
    );
  }

  /**
   * Check self-collision as specified in task requirements
   */
  private checkSelfCollision(
    head: Position,
    body: SnakeSegment[]
  ): CollisionResult {
    for (const segment of body) {
      if (head.x === segment.x && head.y === segment.y) {
        return {
          hasCollision: true,
          type: 'self',
          position: head,
          details: `Self-collision with segment ${segment.id}`,
        };
      }
    }

    return { hasCollision: false, type: 'none' };
  }

  /**
   * Legacy method for checking self collision (maintained for compatibility)
   */
  public checkSelfCollisionLegacy(head: Position, body: Position[]): boolean {
    // Skip the head itself if it's included in the body array
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }

  /**
   * Check collision between snake head and entire snake body (excluding head)
   */
  public checkSnakeSelfCollision(snake: Snake): boolean {
    const head = snake.segments[0];
    const body = snake.segments.slice(1); // Exclude head
    
    return this.checkSelfCollisionLegacy(head, body);
  }

  /**
   * Comprehensive collision check for a position (legacy method)
   */
  public checkPositionCollisions(
    position: Position,
    snake: Snake,
    food: Food | null = null
  ): CollisionResult & { collisionType: 'wall' | 'self' | 'food' | 'none'; segmentIndex?: number; food?: Food } {
    // Check wall collision
    if (this.checkWallCollision(position)) {
      return {
        hasCollision: true,
        type: 'boundary',
        collisionType: 'wall',
        position,
      };
    }

    // Check self collision
    const selfCollisionIndex = this.findSelfCollisionIndex(position, snake.segments);
    if (selfCollisionIndex !== -1) {
      return {
        hasCollision: true,
        type: 'self',
        collisionType: 'self',
        position,
        segmentIndex: selfCollisionIndex,
      };
    }

    // Check food collision
    if (food && this.checkFoodCollision(position, food)) {
      return {
        hasCollision: true,
        type: 'none',
        collisionType: 'food',
        position,
        food,
      };
    }

    return {
      hasCollision: false,
      type: 'none',
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
   * Update boundaries as specified in task requirements
   */
  public updateBoundaries(canvasWidth: number, canvasHeight: number): void {
    this.boundaries = {
      top: 0,
      bottom: canvasHeight - this.gridSize,
      left: 0,
      right: canvasWidth - this.gridSize,
    };
  }

  /**
   * Get boundaries configuration as specified in task requirements
   */
  public getBoundaries(): BoundaryConfig {
    return { ...this.boundaries };
  }

  /**
   * Update collision detector dimensions (legacy method)
   */
  public updateDimensions(width: number, height: number, gridSize?: number): void {
    if (gridSize) {
      this.gridSize = gridSize;
    }
    this.updateBoundaries(width, height);
  }

  /**
   * Get collision detector configuration
   */
  public getConfig(): {
    gridSize: number;
    boundaries: BoundaryConfig;
  } {
    return {
      gridSize: this.gridSize,
      boundaries: { ...this.boundaries },
    };
  }

  /**
   * Batch collision check for multiple positions
   */
  public checkMultiplePositions(
    positions: Position[],
    snake: Snake,
    food: Food | null = null
  ): (CollisionResult & { collisionType: 'wall' | 'self' | 'food' | 'none'; segmentIndex?: number; food?: Food })[] {
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
    const canvasWidth = this.boundaries.right + this.gridSize;
    const canvasHeight = this.boundaries.bottom + this.gridSize;

    for (let y = 0; y < canvasHeight; y += this.gridSize) {
      for (let x = 0; x < canvasWidth; x += this.gridSize) {
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