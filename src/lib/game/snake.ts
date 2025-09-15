import type { Snake, SnakeSegment, Direction, Position } from './types';
import { GAME_CONFIG } from './constants';
import { SnakeMovement } from './movement';
import { InputHandler } from './inputHandler';
import { SnakeGrowthManager } from './snakeGrowth';

/**
 * Snake game class for managing snake state and behavior
 */
export class SnakeGame {
  private snake!: Snake;
  private gridSize: number;
  private canvasSize: { width: number; height: number };
  private movementSystem: SnakeMovement;
  private inputHandler: InputHandler;
  private growthManager!: SnakeGrowthManager;

  constructor(
    canvasWidth: number = GAME_CONFIG.CANVAS_WIDTH,
    canvasHeight: number = GAME_CONFIG.CANVAS_HEIGHT,
    gridSize: number = GAME_CONFIG.GRID_SIZE
  ) {
    this.gridSize = gridSize;
    this.canvasSize = { width: canvasWidth, height: canvasHeight };
    
    // Initialize movement system
    this.movementSystem = new SnakeMovement({
      gridSize,
      canvasWidth,
      canvasHeight,
    });
    
    // Initialize input handler
    this.inputHandler = new InputHandler();
    
    this.initializeSnake();
  }

  /**
   * Initialize snake at center of canvas with initial length
   */
  private initializeSnake(): void {
    // Calculate center position in grid coordinates
    const centerGridX = Math.floor(this.canvasSize.width / 2 / this.gridSize);
    const centerGridY = Math.floor(this.canvasSize.height / 2 / this.gridSize);
    
    // Convert to pixel coordinates
    const centerX = centerGridX * this.gridSize;
    const centerY = centerGridY * this.gridSize;

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
    
    // Initialize growth manager
    this.growthManager = new SnakeGrowthManager(this.snake);
    
    // Initialize input handler with initial direction
    this.inputHandler.setDirection('RIGHT');
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
    const result = this.inputHandler.processDirectionInput(newDirection);
    
    // Update snake's next direction for immediate feedback
    if (result) {
      this.snake.nextDirection = newDirection;
    }
    
    return result;
  }

  /**
   * Move snake one step forward
   */
  public move(): boolean {
    console.log('SnakeGame.move() called - current head position:', this.snake.segments[0]);
    
    // Process any pending growth before movement
    this.growthManager.processGrowth();
    
    // Process any queued input
    this.inputHandler.processQueuedInput();
    
    // Get current direction from input handler
    const currentDirection = this.inputHandler.getCurrentDirection();
    console.log('Moving in direction:', currentDirection);
    
    // Use movement system to move snake
    const movementResult = this.movementSystem.moveSnake(this.snake, currentDirection);
    console.log('Movement result:', movementResult);
    
    if (movementResult.success) {
      // Update snake direction to current direction
      this.snake.direction = currentDirection;
      console.log('Snake moved successfully - new head position:', this.snake.segments[0]);
    } else {
      console.log('Snake movement failed:', movementResult.collisionType);
    }
    
    return movementResult.success;
  }

  /**
   * Make snake grow on next move
   */
  public grow(): void {
    this.growthManager.addGrowth(1, 'food');
  }

  /**
   * Add multiple growth segments
   */
  public addGrowth(segments: number, reason: 'food' | 'bonus' | 'manual' = 'food'): void {
    this.growthManager.addGrowth(segments, reason);
  }

  /**
   * Get pending growth count
   */
  public getPendingGrowth(): number {
    return this.growthManager.getPendingGrowth();
  }

  /**
   * Get growth statistics
   */
  public getGrowthStatistics(): ReturnType<SnakeGrowthManager['getStatistics']> {
    return this.growthManager.getStatistics();
  }

  /**
   * Check if position collides with walls
   */
  public checkWallCollision(position: Position): boolean {
    return this.movementSystem.checkWallCollision(position);
  }

  /**
   * Check if position collides with snake body
   */
  public checkSelfCollision(position: Position): boolean {
    return this.movementSystem.checkSelfCollision(this.snake, position);
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
    this.inputHandler.reset('RIGHT');
    this.growthManager.reset();
  }

  /**
   * Get valid positions for food placement (not occupied by snake)
   */
  public getValidFoodPositions(): Position[] {
    return this.movementSystem.getValidPositionsAroundSnake(this.snake);
  }

  /**
   * Get current direction
   */
  public getCurrentDirection(): Direction {
    return this.inputHandler.getCurrentDirection();
  }

  /**
   * Get next direction
   */
  public getNextDirection(): Direction {
    return this.inputHandler.getCurrentDirection();
  }

  /**
   * Check if snake is at given position
   */
  public isSnakeAt(position: Position): boolean {
    return this.checkSnakeCollision(position);
  }

  /**
   * Get input handler status for debugging
   */
  public getInputStatus(): ReturnType<InputHandler['getStatus']> {
    return this.inputHandler.getStatus();
  }
}