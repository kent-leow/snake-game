import type { Position, EnhancedFood, Snake, ScoreBreakdown, GameScore } from './types';
import { SnakeGame } from './snake';
import { FoodManager } from './food';
import { MultipleFoodManager } from './MultipleFoodManager';
import type { NumberedFood, FoodConsumptionResult } from './multipleFoodTypes';
import { CollisionDetector, type CollisionResult } from './collisionDetection';
import { ScoringSystem } from './scoring';
import { ScoreManager } from './ScoreManager';
import { GameOverManager, type GameOverState, type GameStatistics } from './gameOverState';
import { ComboManager } from './ComboManager';
import type { ComboEvent } from '../../types/Combo';
import { SpeedManager } from '../../game/SpeedManager';
import type { SpeedConfig } from '../../types/Speed';

/**
 * Game engine configuration interface
 */
export interface GameEngineConfig {
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  gameSpeed?: number; // Movement interval in milliseconds
  initialScore?: number;
  speedConfig?: SpeedConfig; // Optional speed system configuration
}

/**
 * Game engine event callbacks interface
 */
export interface GameEngineCallbacks {
  onScoreChange?: (score: number, event: Parameters<ScoringSystem['subscribeToScoreChanges']>[0] extends (score: number, event: infer E) => void ? E : never) => void;
  onScoreBreakdown?: (gameScore: GameScore, breakdown: ScoreBreakdown) => void;
  onFoodEaten?: (food: EnhancedFood, newLength: number) => void;
  onMultipleFoodEaten?: (result: FoodConsumptionResult, newLength: number) => void;
  onGameOver?: (finalScore: number, snake: Snake, cause?: 'boundary' | 'self', collisionPosition?: Position) => void;
  onLevelUp?: (level: number, score: number) => void;
  onGameOverStateChange?: (state: GameOverState) => void;
  onComboEvent?: (event: ComboEvent) => void;
}

/**
 * Comprehensive game engine that orchestrates all game systems
 * Integrates snake movement, food management, collision detection, scoring, growth, and game over handling
 */
export class GameEngine {
  private snakeGame: SnakeGame;
  private foodManager: FoodManager;
  private multipleFoodManager: MultipleFoodManager;
  private collisionDetector: CollisionDetector;
  private scoringSystem: ScoringSystem;
  private scoreManager: ScoreManager; // New enhanced score manager
  private gameOverManager: GameOverManager;
  private comboManager: ComboManager;
  private speedManager: SpeedManager; // Progressive speed management
  private currentFood: EnhancedFood | null = null;
  private useMultipleFood: boolean = false;
  private isRunning: boolean = false;
  private callbacks: GameEngineCallbacks;
  private config: GameEngineConfig;
  private gameStartTime: number = 0;
  private foodConsumed: number = 0;
  private maxSnakeLength: number = 1;
  private lastMoveTime: number = 0;

  constructor(config: GameEngineConfig, callbacks: GameEngineCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;

    // Calculate the actual cell size that matches the renderer
    // This ensures movement and collision detection align with visual grid
    const actualCellSize = Math.floor(config.canvasWidth / config.gridSize);

    // Initialize game systems with the actual cell size
    this.snakeGame = new SnakeGame(
      config.canvasWidth,
      config.canvasHeight,
      actualCellSize // Use actual cell size instead of gridSize
    );

    this.foodManager = new FoodManager(
      actualCellSize, // Use actual cell size for consistent positioning
      config.canvasWidth,
      config.canvasHeight
    );

    this.multipleFoodManager = new MultipleFoodManager({
      gridSize: actualCellSize, // Use actual cell size
      boardWidth: config.canvasWidth,
      boardHeight: config.canvasHeight
    });

    this.collisionDetector = new CollisionDetector(
      config.canvasWidth,
      config.canvasHeight,
      actualCellSize // Use actual cell size for boundary calculations
    );

    this.scoringSystem = new ScoringSystem(config.initialScore || 0);

    this.scoreManager = new ScoreManager(config.initialScore || 0);

    this.gameOverManager = new GameOverManager();

    this.comboManager = new ComboManager();

    // Initialize speed manager with optional config and auto-integrate with combo system
    this.speedManager = new SpeedManager(config.speedConfig);
    
    // Set up system callbacks
    this.setupScoreCallbacks();
    this.setupGameOverCallbacks();
    this.setupComboCallbacks();
    this.setupSpeedCallbacks();

    // Enable multiple food system by default
    this.enableMultipleFood();
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
   * Set up game over manager callbacks
   */
  private setupGameOverCallbacks(): void {
    this.gameOverManager.subscribe((state) => {
      this.callbacks.onGameOverStateChange?.(state);
    });
  }

  /**
   * Set up combo manager callbacks
   */
  private setupComboCallbacks(): void {
    this.comboManager.subscribe((event) => {
      this.callbacks.onComboEvent?.(event);
      
      // Forward combo events to speed manager for automatic speed adjustment
      this.speedManager.handleComboEvent(event);
    });

    // Set up food progression callbacks
    this.comboManager.setProgressionCallbacks({
      onComboCompleted: () => {
        // No longer needed - food progression happens automatically
      },
      onComboBreak: () => {
        // Reset food to initial state (1-5) when combo breaks
        if (this.useMultipleFood) {
          const snakePositions = this.snakeGame.getSnake().segments;
          this.multipleFoodManager.resetToInitial(snakePositions);
        }
      }
    });
  }

  /**
   * Set up speed manager callbacks
   */
  private setupSpeedCallbacks(): void {
    this.speedManager.onSpeedChange((_event) => {
      // Speed changes are automatically handled by the SpeedManager
      // No need to store gameSpeed anymore since we use speedManager.getCurrentSpeed()
    });
  }

  /**
   * Start the game engine
   */
  public start(): void {
    this.isRunning = true;
    this.gameStartTime = Date.now();
    this.lastMoveTime = performance.now();
    this.foodConsumed = 0;
    this.maxSnakeLength = this.snakeGame.getLength();
    
    // Reset speed manager to initial state
    this.speedManager.reset();
    
    // Spawn initial food when game starts
    this.spawnFood();
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
    this.lastMoveTime = performance.now(); // Reset timing to prevent immediate movement
  }

  /**
   * Update game state (called each frame)
   */
  public update(): boolean {
    if (!this.isRunning || this.gameOverManager.isGameOver()) return false;

    const currentTime = performance.now();
    
    // Update speed manager (handles smooth transitions)
    this.speedManager.update(currentTime - this.lastMoveTime);
    
    // Get current speed from speed manager
    const currentSpeed = this.speedManager.getCurrentSpeed();
    
    // Only move the snake at the current speed interval
    if (currentTime - this.lastMoveTime < currentSpeed) {
      return true; // Game is running but no update needed yet
    }
    
    this.lastMoveTime = currentTime;

    // Move snake first to get new position
    const moveSuccess = this.snakeGame.move();
    
    if (!moveSuccess) {
      // Game over due to movement failure
      this.handleGameOver();
      return false;
    }

    // Check for collisions AFTER movement
    const collisionResult = this.collisionDetector.checkAllCollisions(this.snakeGame.getSnake());
    
    if (collisionResult.hasCollision) {
      // Game over due to collision
      console.log('Collision detected after movement:', collisionResult);
      this.handleGameOver(collisionResult);
      return false;
    }

    // Update max snake length tracking
    const currentLength = this.snakeGame.getLength();
    if (currentLength > this.maxSnakeLength) {
      this.maxSnakeLength = currentLength;
    }

    // Check for food collision
    this.checkFoodCollision();

    return true;
  }

  /**
   * Check for collision between snake and food
   */
  private checkFoodCollision(): void {
    const snakeHead = this.snakeGame.getHead();
    
    if (this.useMultipleFood) {
      // Check collision with multiple numbered foods
      const foods = this.multipleFoodManager.getFoods();
      const collidedFood = this.collisionDetector.checkMultipleFoodCollision(snakeHead, foods);
      
      if (collidedFood) {
        this.handleMultipleFoodConsumption(collidedFood);
      }
    } else {
      // Check collision with single food (legacy mode)
      if (!this.currentFood) return;
      
      if (this.collisionDetector.checkFoodCollision(snakeHead, this.currentFood)) {
        this.handleFoodConsumption(this.currentFood);
      }
    }
  }

  /**
   * Handle food consumption logic
   */
  private handleFoodConsumption(food: EnhancedFood): void {
    // Add score for food consumption using both systems for compatibility
    this.scoringSystem.addScore({
      type: 'food',
      points: food.value,
      position: { x: food.x, y: food.y },
    });

    // Also update the new ScoreManager (no combo for regular food)
    const scoreBreakdown = this.scoreManager.addScore(food.value, 0);

    // Make snake grow
    this.snakeGame.addGrowth(1, 'food');

    // Track food consumption
    this.foodConsumed++;

    // Trigger callback before clearing food for smooth transition
    this.callbacks.onFoodEaten?.(food, this.snakeGame.getLength());

    // Clear current food and spawn new one immediately to prevent canvas blink
    this.currentFood = null;
    this.foodManager.clearFood();
    
    // Spawn new food immediately instead of using delay
    this.spawnFood();

    // Notify score update
    this.notifyScoreUpdate(scoreBreakdown);
  }

  /**
   * Handle multiple food consumption logic
   */
  private handleMultipleFoodConsumption(food: NumberedFood): void {
    // Increment global food eaten counter for combo scoring
    this.foodConsumed++;
    
    // Process combo logic for sequence tracking (affects speed only)
    this.comboManager.processFood(food.number);
    
    // Calculate points using formula: 5 × Combo × Speed
    // Combo = current food number (the sequential number being eaten)
    // Speed = speed level (number of completed combos for speed progression)
    const baseFoodPoints = 5;
    const comboNumber = food.number; // Use the actual food number as combo multiplier
    const speedLevel = Math.max(1, this.speedManager.getSpeedLevel()); // Minimum 1 to avoid zero
    
    const totalPoints = baseFoodPoints * comboNumber * speedLevel;

    // Update score with the total points calculated using new formula
    const scoreBreakdown = this.scoreManager.addScore(totalPoints, 0);

    // Also update legacy scoring system for backward compatibility
    this.scoringSystem.addScore({
      type: 'food',
      points: totalPoints,
      position: food.position,
    });

    // Make snake grow
    this.snakeGame.addGrowth(1, 'food');

    // Consume the food and spawn replacement
    const snakePositions = this.snakeGame.getSnake().segments;
    const result = this.multipleFoodManager.consumeFood(food.number, snakePositions);

    if (result) {
      // Trigger callback with the consumption result
      this.callbacks.onMultipleFoodEaten?.(result, this.snakeGame.getLength());
    }

    // Notify score update with breakdown (within 50ms requirement)
    this.notifyScoreUpdate(scoreBreakdown);
  }

  /**
   * Notify UI of score changes with detailed breakdown
   */
  private notifyScoreUpdate(scoreBreakdown: ScoreBreakdown): void {
    const gameScore = this.scoreManager.getScoreBreakdown();
    
    // Call new enhanced callback for detailed breakdown
    this.callbacks.onScoreBreakdown?.(gameScore, scoreBreakdown);
  }

  /**
   * Spawn new food on the game field
   */
  private spawnFood(): void {
    if (this.useMultipleFood) {
      // Initialize multiple foods if not already done
      if (this.multipleFoodManager.getFoods().length === 0) {
        const snakePositions = this.snakeGame.getSnake().segments;
        this.multipleFoodManager.initializeFoods(snakePositions);
      }
    } else {
      // Spawn single food (legacy mode)
      const occupiedPositions = this.snakeGame.getSnake().segments;
      this.currentFood = this.foodManager.spawnFood(occupiedPositions);
    }
  }

  /**
   * Handle game over with enhanced collision information
   */
  private handleGameOver(collisionResult?: CollisionResult): void {
    this.isRunning = false;
    const finalScore = this.scoringSystem.getCurrentScore();
    const snake = this.snakeGame.getSnake();
    
    // Determine collision cause and position
    let cause: 'boundary' | 'self' | undefined;
    let collisionPosition: Position | undefined;
    
    if (collisionResult?.hasCollision) {
      cause = collisionResult.type === 'boundary' ? 'boundary' : 'self';
      collisionPosition = collisionResult.position;
    } else {
      // If no collision result provided, assume it's a self collision
      cause = 'self';
    }
    
    // Calculate game statistics
    const gameStats: GameStatistics = {
      duration: Math.floor((Date.now() - this.gameStartTime) / 1000),
      foodConsumed: this.foodConsumed,
      maxSnakeLength: this.maxSnakeLength,
      averageSpeed: this.calculateAverageSpeed(),
    };
    
    // Always trigger game over in manager with a valid cause
    this.gameOverManager.triggerGameOver(cause, finalScore, collisionPosition, gameStats);
    
    // Always call the callback for backwards compatibility
    this.callbacks.onGameOver?.(finalScore, snake, cause, collisionPosition);
  }

  /**
   * Calculate average speed based on game duration and snake length
   */
  private calculateAverageSpeed(): number {
    const duration = (Date.now() - this.gameStartTime) / 1000;
    if (duration === 0) return 0;
    return this.maxSnakeLength / duration;
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
    multipleFoods: NumberedFood[];
    useMultipleFood: boolean;
    score: number;
    isRunning: boolean;
    snakeLength: number;
    pendingGrowth: number;
    gameOverState: GameOverState;
    comboState: ReturnType<ComboManager['getCurrentState']>;
  } {
    return {
      snake: this.snakeGame.getSnake(),
      food: this.currentFood,
      multipleFoods: this.useMultipleFood ? this.multipleFoodManager.getFoods() : [],
      useMultipleFood: this.useMultipleFood,
      score: this.scoringSystem.getCurrentScore(),
      isRunning: this.isRunning,
      snakeLength: this.snakeGame.getLength(),
      pendingGrowth: this.snakeGame.getPendingGrowth(),
      gameOverState: this.gameOverManager.getGameOverState(),
      comboState: this.comboManager.getCurrentState(),
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
   * Get game over manager
   */
  public getGameOverManager(): GameOverManager {
    return this.gameOverManager;
  }

  /**
   * Get combo manager
   */
  public getComboManager(): ComboManager {
    return this.comboManager;
  }

  /**
   * Get score manager (enhanced scoring with combo breakdown)
   */
  public getScoreManager(): ScoreManager {
    return this.scoreManager;
  }

  /**
   * Get current score
   */
  public getScore(): number {
    // Return score from original ScoringSystem for backward compatibility
    return this.scoringSystem.getCurrentScore();
  }

  /**
   * Get enhanced score breakdown
   */
  public getScoreBreakdown(): GameScore {
    return this.scoreManager.getScoreBreakdown();
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
    this.scoreManager.reset(); // Reset new ScoreManager
    this.foodManager.reset();
    this.multipleFoodManager.reset();
    this.gameOverManager.resetGameOver();
    this.comboManager.reset();
    this.currentFood = null;
    this.isRunning = false;
    this.gameStartTime = 0;
    this.lastMoveTime = 0;
    this.foodConsumed = 0;
    this.maxSnakeLength = 1;
    
    // Spawn initial food (respects current mode)
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
    combo: ReturnType<ComboManager['exportData']>;
    config: GameEngineConfig;
    timestamp: number;
  } {
    return {
      score: this.scoringSystem.exportData(),
      growth: this.snakeGame.getGrowthStatistics(),
      combo: this.comboManager.exportData(),
      config: this.config,
      timestamp: Date.now(),
    };
  }

  /**
   * Import game data from persistence
   */
  public importData(data: {
    score: Parameters<ScoringSystem['importData']>[0];
    combo?: Parameters<ComboManager['importData']>[0];
  }): void {
    this.scoringSystem.importData(data.score);
    if (data.combo) {
      this.comboManager.importData(data.combo);
    }
  }

  /**
   * Enable multiple food mode (5 numbered food blocks)
   */
  public enableMultipleFood(): void {
    this.useMultipleFood = true;
    // Clear any existing single food
    this.currentFood = null;
    this.foodManager.clearFood();
    // Initialize multiple foods
    const snakePositions = this.snakeGame.getSnake().segments;
    this.multipleFoodManager.initializeFoods(snakePositions);
  }

  /**
   * Disable multiple food mode (revert to single food)
   */
  public disableMultipleFood(): void {
    this.useMultipleFood = false;
    // Clear multiple foods
    this.multipleFoodManager.reset();
    // Spawn single food
    this.spawnFood();
  }

  /**
   * Get all numbered foods (multiple food mode)
   */
  public getMultipleFoods(): NumberedFood[] {
    return this.multipleFoodManager.getFoods();
  }

  /**
   * Get multiple food manager instance for external access
   */
  public getMultipleFoodManager(): MultipleFoodManager {
    return this.multipleFoodManager;
  }

  /**
   * Check if multiple food mode is enabled
   */
  public isMultipleFoodEnabled(): boolean {
    return this.useMultipleFood;
  }

  /**
   * Get multiple food manager statistics
   */
  public getMultipleFoodStats(): ReturnType<MultipleFoodManager['getStats']> {
    return this.multipleFoodManager.getStats();
  }

  /**
   * Validate multiple food system state
   */
  public validateMultipleFoodState(): ReturnType<MultipleFoodManager['validateState']> {
    return this.multipleFoodManager.validateState();
  }

  /**
   * Get speed manager instance for external access
   */
  public getSpeedManager(): SpeedManager {
    return this.speedManager;
  }

  /**
   * Get current movement speed
   */
  public getCurrentSpeed(): number {
    return this.speedManager.getCurrentSpeed();
  }

  /**
   * Get current speed level (number of combos completed)
   */
  public getSpeedLevel(): number {
    return this.speedManager.getSpeedLevel();
  }

  /**
   * Get speed statistics
   */
  public getSpeedStatistics(): ReturnType<SpeedManager['getStatistics']> {
    return this.speedManager.getStatistics();
  }

  /**
   * Check if speed is at maximum level
   */
  public isAtMaxSpeed(): boolean {
    return this.speedManager.isAtMaxSpeed();
  }
}