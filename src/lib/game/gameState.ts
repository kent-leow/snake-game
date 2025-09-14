/**
 * Comprehensive Game State Management System
 * Handles all game states with proper transitions, state persistence, and integration
 */

import type { Snake, EnhancedFood } from './types';
import type { GameStatistics } from './gameOverState';

/**
 * Game state enumeration - defines all possible game states
 */
export enum GameStateEnum {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  LOADING = 'loading',
}

/**
 * Extended game state data structure
 */
export interface GameStateData {
  state: GameStateEnum;
  snake: Snake;
  food: EnhancedFood | null;
  score: number;
  gameStartTime: number;
  pausedTime: number;
  totalPausedDuration: number;
  gameStats: GameStatistics;
}

/**
 * Game state transition callback types
 */
export type StateChangeCallback = (data: GameStateData) => void;
export type StateTransitionCallback = (from: GameStateEnum, to: GameStateEnum) => void;

/**
 * Game state manager class - centralized state management
 */
export class GameStateManager {
  private currentState: GameStateEnum = GameStateEnum.MENU;
  private gameData: GameStateData;
  private stateHistory: GameStateEnum[] = [];
  private callbacks: Map<GameStateEnum, Array<StateChangeCallback>> = new Map();
  private transitionCallbacks: Array<StateTransitionCallback> = [];

  constructor() {
    this.gameData = this.createInitialGameData();
  }

  /**
   * Create initial game data structure
   */
  private createInitialGameData(): GameStateData {
    return {
      state: GameStateEnum.MENU,
      snake: this.createInitialSnake(),
      food: null,
      score: 0,
      gameStartTime: 0,
      pausedTime: 0,
      totalPausedDuration: 0,
      gameStats: {
        duration: 0,
        foodConsumed: 0,
        maxSnakeLength: 3,
        averageSpeed: 0,
      },
    };
  }

  /**
   * Initialize game data to default state
   */
  private initializeGameData(): void {
    this.gameData = this.createInitialGameData();
  }

  /**
   * Get current game state
   */
  public getCurrentState(): GameStateEnum {
    return this.currentState;
  }

  /**
   * Get copy of current game data
   */
  public getGameData(): GameStateData {
    return { ...this.gameData };
  }

  /**
   * Transition to a new state with validation
   */
  public transitionTo(newState: GameStateEnum): boolean {
    if (!this.isValidTransition(this.currentState, newState)) {
      console.warn(
        `Invalid state transition from ${this.currentState} to ${newState}`
      );
      return false;
    }

    const previousState = this.currentState;
    this.currentState = newState;
    this.gameData.state = newState;
    this.stateHistory.push(newState);

    // Handle state-specific logic
    this.handleStateEntry(newState, previousState);

    // Notify transition callbacks
    this.transitionCallbacks.forEach(callback =>
      callback(previousState, newState)
    );

    // Notify state-specific callbacks
    const stateCallbacks = this.callbacks.get(newState) || [];
    stateCallbacks.forEach(callback => callback(this.gameData));

    return true;
  }

  /**
   * Validate if transition from one state to another is allowed
   */
  private isValidTransition(from: GameStateEnum, to: GameStateEnum): boolean {
    const validTransitions: Record<GameStateEnum, GameStateEnum[]> = {
      [GameStateEnum.MENU]: [GameStateEnum.LOADING, GameStateEnum.PLAYING],
      [GameStateEnum.LOADING]: [GameStateEnum.PLAYING, GameStateEnum.MENU],
      [GameStateEnum.PLAYING]: [
        GameStateEnum.PAUSED,
        GameStateEnum.GAME_OVER,
        GameStateEnum.MENU,
      ],
      [GameStateEnum.PAUSED]: [
        GameStateEnum.PLAYING,
        GameStateEnum.MENU,
        GameStateEnum.GAME_OVER,
      ],
      [GameStateEnum.GAME_OVER]: [GameStateEnum.MENU, GameStateEnum.PLAYING],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * Handle state entry logic for different states
   */
  private handleStateEntry(
    newState: GameStateEnum,
    previousState: GameStateEnum
  ): void {
    switch (newState) {
      case GameStateEnum.PLAYING:
        if (previousState === GameStateEnum.MENU) {
          this.startNewGame();
        } else if (previousState === GameStateEnum.PAUSED) {
          this.resumeGame();
        }
        break;

      case GameStateEnum.PAUSED:
        this.pauseGame();
        break;

      case GameStateEnum.GAME_OVER:
        this.endGame();
        break;

      case GameStateEnum.MENU:
        this.resetGame();
        break;

      case GameStateEnum.LOADING:
        // Handle loading state if needed
        break;
    }
  }

  /**
   * Start a new game - initialize all game data
   */
  private startNewGame(): void {
    this.gameData.gameStartTime = Date.now();
    this.gameData.score = 0;
    this.gameData.snake = this.createInitialSnake();
    this.gameData.food = null;
    this.gameData.totalPausedDuration = 0;
    this.gameData.pausedTime = 0;
    this.resetGameStats();
  }

  /**
   * Pause the game - record pause time
   */
  private pauseGame(): void {
    this.gameData.pausedTime = Date.now();
  }

  /**
   * Resume the game - calculate total paused duration
   */
  private resumeGame(): void {
    if (this.gameData.pausedTime > 0) {
      this.gameData.totalPausedDuration +=
        Date.now() - this.gameData.pausedTime;
      this.gameData.pausedTime = 0;
    }
  }

  /**
   * End the game - calculate final statistics
   */
  private endGame(): void {
    this.updateFinalGameStats();
  }

  /**
   * Reset game to initial state
   */
  private resetGame(): void {
    this.initializeGameData();
  }

  /**
   * Create initial snake configuration
   */
  private createInitialSnake(): Snake {
    return {
      segments: [
        { x: 200, y: 200, id: 'head' },
        { x: 180, y: 200, id: 'body-1' },
        { x: 160, y: 200, id: 'body-2' },
      ],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      isGrowing: false,
    };
  }

  /**
   * Reset game statistics to initial values
   */
  private resetGameStats(): void {
    this.gameData.gameStats = {
      duration: 0,
      foodConsumed: 0,
      maxSnakeLength: 3,
      averageSpeed: 0,
    };
  }

  /**
   * Update final game statistics when game ends
   */
  private updateFinalGameStats(): void {
    const totalTime =
      Date.now() -
      this.gameData.gameStartTime -
      this.gameData.totalPausedDuration;
    this.gameData.gameStats.duration = Math.floor(totalTime / 1000);
    
    // Calculate average speed if duration > 0
    if (this.gameData.gameStats.duration > 0) {
      this.gameData.gameStats.averageSpeed = 
        this.gameData.gameStats.maxSnakeLength / this.gameData.gameStats.duration;
    }
  }

  /**
   * Subscribe to state changes for a specific state
   */
  public onStateChange(
    state: GameStateEnum,
    callback: StateChangeCallback
  ): () => void {
    if (!this.callbacks.has(state)) {
      this.callbacks.set(state, []);
    }
    this.callbacks.get(state)!.push(callback);

    return () => {
      const callbacks = this.callbacks.get(state);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to state transitions
   */
  public onStateTransition(
    callback: StateTransitionCallback
  ): () => void {
    this.transitionCallbacks.push(callback);

    return () => {
      const index = this.transitionCallbacks.indexOf(callback);
      if (index > -1) {
        this.transitionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Convenience methods for state checking
   */
  public isPlaying(): boolean {
    return this.currentState === GameStateEnum.PLAYING;
  }

  public isPaused(): boolean {
    return this.currentState === GameStateEnum.PAUSED;
  }

  public isGameOver(): boolean {
    return this.currentState === GameStateEnum.GAME_OVER;
  }

  public isMenu(): boolean {
    return this.currentState === GameStateEnum.MENU;
  }

  public isLoading(): boolean {
    return this.currentState === GameStateEnum.LOADING;
  }

  public canPause(): boolean {
    return this.currentState === GameStateEnum.PLAYING;
  }

  public canResume(): boolean {
    return this.currentState === GameStateEnum.PAUSED;
  }

  /**
   * Update game data (for external systems like GameEngine)
   */
  public updateGameData(updates: Partial<GameStateData>): void {
    this.gameData = { ...this.gameData, ...updates };
    
    // Notify callbacks for current state
    const stateCallbacks = this.callbacks.get(this.currentState) || [];
    stateCallbacks.forEach(callback => callback(this.gameData));
  }

  /**
   * Get state history for debugging
   */
  public getStateHistory(): GameStateEnum[] {
    return [...this.stateHistory];
  }

  /**
   * Clear state history
   */
  public clearStateHistory(): void {
    this.stateHistory = [];
  }

  /**
   * Get game duration in seconds (excluding paused time)
   */
  public getGameDuration(): number {
    if (this.gameData.gameStartTime === 0) return 0;
    
    const currentTime = Date.now();
    const totalTime = currentTime - this.gameData.gameStartTime;
    const pausedTime = this.gameData.totalPausedDuration;
    
    // If currently paused, add current pause duration
    if (this.isPaused() && this.gameData.pausedTime > 0) {
      const currentPauseDuration = currentTime - this.gameData.pausedTime;
      return Math.floor((totalTime - pausedTime - currentPauseDuration) / 1000);
    }
    
    return Math.floor((totalTime - pausedTime) / 1000);
  }

  /**
   * Force update game statistics (for external use)
   */
  public updateGameStats(stats: Partial<GameStatistics>): void {
    this.gameData.gameStats = { ...this.gameData.gameStats, ...stats };
  }

  /**
   * Export current state for persistence
   */
  public exportState(): GameStateData {
    return { ...this.gameData };
  }

  /**
   * Import state from persistence
   */
  public importState(data: GameStateData): boolean {
    try {
      this.gameData = { ...data };
      this.currentState = data.state;
      return true;
    } catch (error) {
      console.error('Failed to import game state:', error);
      return false;
    }
  }
}