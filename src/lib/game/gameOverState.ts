import type { Position } from './types';

/**
 * Game statistics interface for tracking game performance
 */
export interface GameStatistics {
  duration: number; // Game duration in seconds
  foodConsumed: number;
  maxSnakeLength: number;
  averageSpeed: number;
}

/**
 * Game over state interface
 */
export interface GameOverState {
  isGameOver: boolean;
  cause: 'boundary' | 'self' | null;
  finalScore: number;
  collisionPosition?: Position;
  timestamp: number;
  gameStats?: GameStatistics;
}

/**
 * Game over state manager class
 * Manages game over state and provides subscription mechanism for UI updates
 */
export class GameOverManager {
  private gameOverState: GameOverState;
  private callbacks: Array<(state: GameOverState) => void> = [];

  constructor() {
    this.gameOverState = {
      isGameOver: false,
      cause: null,
      finalScore: 0,
      timestamp: 0,
    };
  }

  /**
   * Trigger game over with specified cause and final score
   */
  public triggerGameOver(
    cause: 'boundary' | 'self',
    finalScore: number,
    collisionPosition?: Position,
    gameStats?: GameStatistics
  ): void {
    this.gameOverState = {
      isGameOver: true,
      cause,
      finalScore,
      timestamp: Date.now(),
      ...(collisionPosition && { collisionPosition }),
      ...(gameStats && { gameStats }),
    };

    // Notify all subscribers
    this.callbacks.forEach(callback => callback(this.gameOverState));
  }

  /**
   * Reset game over state to initial state
   */
  public resetGameOver(): void {
    this.gameOverState = {
      isGameOver: false,
      cause: null,
      finalScore: 0,
      timestamp: 0,
    };

    // Notify subscribers of reset
    this.callbacks.forEach(callback => callback(this.gameOverState));
  }

  /**
   * Get current game over state (immutable copy)
   */
  public getGameOverState(): GameOverState {
    return { ...this.gameOverState };
  }

  /**
   * Subscribe to game over state changes
   * Returns unsubscribe function
   */
  public subscribe(callback: (state: GameOverState) => void): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if game is currently over
   */
  public isGameOver(): boolean {
    return this.gameOverState.isGameOver;
  }

  /**
   * Get game over cause
   */
  public getGameOverCause(): 'boundary' | 'self' | null {
    return this.gameOverState.cause;
  }

  /**
   * Get final score
   */
  public getFinalScore(): number {
    return this.gameOverState.finalScore;
  }

  /**
   * Get collision position if available
   */
  public getCollisionPosition(): Position | undefined {
    return this.gameOverState.collisionPosition;
  }

  /**
   * Get game statistics if available
   */
  public getGameStatistics(): GameStatistics | undefined {
    return this.gameOverState.gameStats;
  }

  /**
   * Clear all subscribers (for cleanup)
   */
  public clearSubscribers(): void {
    this.callbacks = [];
  }

  /**
   * Get number of active subscribers
   */
  public getSubscriberCount(): number {
    return this.callbacks.length;
  }

  /**
   * Export game over data for persistence
   */
  public exportData(): GameOverState {
    return { ...this.gameOverState };
  }

  /**
   * Import game over data from persistence
   */
  public importData(data: GameOverState): void {
    this.gameOverState = { ...data };
    
    // Notify subscribers of imported state
    this.callbacks.forEach(callback => callback(this.gameOverState));
  }
}