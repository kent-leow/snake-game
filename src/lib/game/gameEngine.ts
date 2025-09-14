import type { Position, EnhancedFood, Snake } from './types';
import { SnakeGame } from './snake';
import { FoodManager } from './food';
import { CollisionDetector, type CollisionResult } from './collisionDetection';
import { ScoringSystem } from './scoring';

/**
 * Game engine configuration interface
 */
export interface GameEngineConfig {
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  initialScore?: number;
  foodSpawnDelay?: number;
}

/**
 * Game engine event callbacks interface
 */
export interface GameEngineCallbacks {
  onScoreChange?: (score: number, event: Parameters<ScoringSystem['subscribeToScoreChanges']>[0] extends (score: number, event: infer E) => void ? E : never) => void;
  onFoodEaten?: (food: EnhancedFood, newLength: number) => void;
  onGameOver?: (finalScore: number, snake: Snake) => void;
  onLevelUp?: (level: number, score: number) => void;
}

/**
 * Comprehensive game engine that orchestrates all game systems
 * Integrates snake movement, food management, collision detection, scoring, and growth
 */
export class GameEngine {
  private snakeGame: SnakeGame;
  private foodManager: FoodManager;
  private collisionDetector: CollisionDetector;
  private scoringSystem: ScoringSystem;
  private currentFood: EnhancedFood | null = null;
  private isRunning: boolean = false;
  private callbacks: GameEngineCallbacks;
  private config: GameEngineConfig;

  constructor(config: GameEngineConfig, callbacks: GameEngineCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;

    // Initialize game systems
    this.snakeGame = new SnakeGame(
      config.canvasWidth,
      config.canvasHeight,
      config.gridSize
    );

    this.foodManager = new FoodManager(
      config.gridSize,
      config.canvasWidth,
      config.canvasHeight
    );

    this.collisionDetector = new CollisionDetector(
      config.canvasWidth,
      config.canvasHeight,
      config.gridSize
    );

    this.scoringSystem = new ScoringSystem(config.initialScore || 0);

    // Set up scoring system callbacks
    this.setupScoreCallbacks();

    // Spawn initial food
    this.spawnFood();
  }

  /**
   * Set up scoring system event callbacks
   */
  private setupScoreCallbacks(): void {
    this.scoringSystem.subscribeToScoreChanges((score, event) => {
      this.callbacks.onScoreChange?.(score, event);
    });
  }

  /**
   * Start the game engine
   */
  public start(): void {
    this.isRunning = true;
  }

  /**
   * Stop the game engine
   */
  public stop(): void {
    this.isRunning = false;
  }

  /**
   * Pause the game engine
   */
  public pause(): void {
    this.isRunning = false;
  }

  /**
   * Resume the game engine
   */
  public resume(): void {
    this.isRunning = true;
  }

  /**
   * Update game state (called each frame)
   */
  public update(): boolean {
    if (!this.isRunning) return true;

    // Check for collisions before moving
    const collisionResult = this.collisionDetector.checkAllCollisions(this.snakeGame.getSnake());
    
    if (collisionResult.hasCollision) {
      // Game over due to collision
      console.log('Collision detected:', collisionResult);
      this.handleGameOver();
      return false;
    }

    // Move snake
    const moveSuccess = this.snakeGame.move();
    
    if (!moveSuccess) {
      // Game over
      this.handleGameOver();
      return false;
    }

    // Check for food collision
    this.checkFoodCollision();

    return true;
  }

  /**
   * Check for collision between snake and food
   */
  private checkFoodCollision(): void {
    if (!this.currentFood) return;

    const snakeHead = this.snakeGame.getHead();
    
    if (this.collisionDetector.checkFoodCollision(snakeHead, this.currentFood)) {
      this.handleFoodConsumption(this.currentFood);
    }
  }

  /**
   * Handle food consumption logic
   */
  private handleFoodConsumption(food: EnhancedFood): void {
    // Add score for food consumption
    this.scoringSystem.addScore({
      type: 'food',
      points: food.value,
      position: { x: food.x, y: food.y },
    });

    // Make snake grow
    this.snakeGame.addGrowth(1, 'food');

    // Clear current food
    this.currentFood = null;
    this.foodManager.clearFood();

    // Trigger callback
    this.callbacks.onFoodEaten?.(food, this.snakeGame.getLength());

    // Spawn new food after a delay
    setTimeout(() => {
      this.spawnFood();
    }, this.config.foodSpawnDelay || 100);
  }

  /**
   * Spawn new food on the game field
   */
  private spawnFood(): void {
    const occupiedPositions = this.snakeGame.getSnake().segments;
    this.currentFood = this.foodManager.spawnFood(occupiedPositions);
  }

  /**
   * Handle game over
   */
  private handleGameOver(): void {
    this.isRunning = false;
    const finalScore = this.scoringSystem.getCurrentScore();
    const snake = this.snakeGame.getSnake();
    
    this.callbacks.onGameOver?.(finalScore, snake);
  }

  /**
   * Change snake direction
   */
  public changeDirection(direction: Parameters<SnakeGame['changeDirection']>[0]): boolean {
    return this.snakeGame.changeDirection(direction);
  }

  /**
   * Get current game state
   */
  public getGameState(): {
    snake: Snake;
    food: EnhancedFood | null;
    score: number;
    isRunning: boolean;
    snakeLength: number;
    pendingGrowth: number;
  } {
    return {
      snake: this.snakeGame.getSnake(),
      food: this.currentFood,
      score: this.scoringSystem.getCurrentScore(),
      isRunning: this.isRunning,
      snakeLength: this.snakeGame.getLength(),
      pendingGrowth: this.snakeGame.getPendingGrowth(),
    };
  }

  /**
   * Get scoring system
   */
  public getScoringSystem(): ScoringSystem {
    return this.scoringSystem;
  }

  /**
   * Get snake game instance
   */
  public getSnakeGame(): SnakeGame {
    return this.snakeGame;
  }

  /**
   * Get food manager
   */
  public getFoodManager(): FoodManager {
    return this.foodManager;
  }

  /**
   * Get collision detector
   */
  public getCollisionDetector(): CollisionDetector {
    return this.collisionDetector;
  }

  /**
   * Get current score
   */
  public getScore(): number {
    return this.scoringSystem.getCurrentScore();
  }

  /**
   * Get score statistics
   */
  public getScoreStatistics(): ReturnType<ScoringSystem['getStatistics']> {
    return this.scoringSystem.getStatistics();
  }

  /**
   * Get growth statistics
   */
  public getGrowthStatistics(): ReturnType<SnakeGame['getGrowthStatistics']> {
    return this.snakeGame.getGrowthStatistics();
  }

  /**
   * Add bonus score
   */
  public addBonusScore(points: number, position?: Position): number {
    return this.scoringSystem.addBonusScore(points, position);
  }

  /**
   * Reset game to initial state
   */
  public reset(): void {
    this.snakeGame.reset();
    this.scoringSystem.resetScore();
    this.foodManager.reset();
    this.currentFood = null;
    this.isRunning = false;
    
    // Spawn initial food
    this.spawnFood();
  }

  /**
   * Check if position is valid for placement
   */
  public isPositionValid(position: Position): boolean {
    const occupiedPositions = [
      ...this.snakeGame.getSnake().segments,
      ...(this.currentFood ? [this.currentFood] : []),
    ];
    
    return this.collisionDetector.isPositionValid(position, occupiedPositions);
  }

  /**
   * Force spawn food at specific position (for testing)
   */
  public spawnFoodAt(position: Position, type: 'normal' | 'special' = 'normal'): void {
    this.currentFood = this.foodManager.spawnSpecificFood(position, type);
  }

  /**
   * Get engine status for debugging
   */
  public getStatus(): {
    isRunning: boolean;
    hasFood: boolean;
    snakeLength: number;
    score: number;
    pendingGrowth: number;
    gameConfig: GameEngineConfig;
    collisionBoundaries: ReturnType<CollisionDetector['getBoundaries']>;
  } {
    return {
      isRunning: this.isRunning,
      hasFood: this.currentFood !== null,
      snakeLength: this.snakeGame.getLength(),
      score: this.scoringSystem.getCurrentScore(),
      pendingGrowth: this.snakeGame.getPendingGrowth(),
      gameConfig: this.config,
      collisionBoundaries: this.collisionDetector.getBoundaries(),
    };
  }

  /**
   * Update callbacks
   */
  public updateCallbacks(callbacks: Partial<GameEngineCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get collision detection status for debugging
   */
  public getCollisionStatus(): {
    boundaries: ReturnType<CollisionDetector['getBoundaries']>;
    config: ReturnType<CollisionDetector['getConfig']>;
  } {
    return {
      boundaries: this.collisionDetector.getBoundaries(),
      config: this.collisionDetector.getConfig(),
    };
  }

  /**
   * Check for specific collision type
   */
  public checkCollision(type: 'boundary' | 'self' | 'all' = 'all'): CollisionResult {
    const snake = this.snakeGame.getSnake();
    
    if (type === 'all') {
      return this.collisionDetector.checkAllCollisions(snake);
    }
    
    const head = snake.segments[0];
    
    if (type === 'boundary') {
      const boundaryResult = this.collisionDetector.checkWallCollision(head);
      if (boundaryResult) {
        return {
          hasCollision: true,
          type: 'boundary',
          position: head,
          details: 'Boundary collision detected',
        };
      } else {
        return {
          hasCollision: false,
          type: 'none',
        };
      }
    }
    
    if (type === 'self') {
      const selfResult = this.collisionDetector.checkSnakeSelfCollision(snake);
      if (selfResult) {
        return {
          hasCollision: true,
          type: 'self',
          position: head,
          details: 'Self collision detected',
        };
      } else {
        return {
          hasCollision: false,
          type: 'none',
        };
      }
    }
    
    return { hasCollision: false, type: 'none' };
  }

  /**
   * Export game data for persistence
   */
  public exportData(): {
    score: ReturnType<ScoringSystem['exportData']>;
    growth: ReturnType<SnakeGame['getGrowthStatistics']>;
    config: GameEngineConfig;
    timestamp: number;
  } {
    return {
      score: this.scoringSystem.exportData(),
      growth: this.snakeGame.getGrowthStatistics(),
      config: this.config,
      timestamp: Date.now(),
    };
  }

  /**
   * Import game data from persistence
   */
  public importData(data: {
    score: Parameters<ScoringSystem['importData']>[0];
  }): void {
    this.scoringSystem.importData(data.score);
  }
}