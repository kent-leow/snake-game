import type { Snake, SnakeSegment, Direction, Position } from './types';
import { GAME_CONFIG } from './constants';
import { SnakeMovement } from './movement';
import { InputHandler } from './inputHandler';

/**
 * Snake game class for managing snake state and behavior
 */
export class SnakeGame {
  private snake!: Snake;
  private gridSize: number;
  private canvasSize: { width: number; height: number };
  private movementSystem: SnakeMovement;
  private inputHandler: InputHandler;

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
    return this.inputHandler.processDirectionInput(newDirection);
  }

  /**
   * Move snake one step forward
   */
  public move(): boolean {
    // Process any queued input
    this.inputHandler.processQueuedInput();
    
    // Get current direction from input handler
    const currentDirection = this.inputHandler.getCurrentDirection();
    
    // Use movement system to move snake
    const movementResult = this.movementSystem.moveSnake(this.snake, currentDirection);
    
    return movementResult.success;
  }

  /**
   * Make snake grow on next move
   */
  public grow(): void {
    this.movementSystem.setGrowth(this.snake, true);
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