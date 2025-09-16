/**
 * @jest-environment jsdom
 */

import {
  GameStateManager,
  GameStateEnum,
  type GameStateData,
} from '../gameState';
import type { Snake } from '../types';

describe('GameStateManager', () => {
  let gameStateManager: GameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager();
  });

  afterEach(() => {
    gameStateManager.clearStateHistory();
  });

  describe('Initialization', () => {
    it('should initialize with MENU state', () => {
      expect(gameStateManager.getCurrentState()).toBe(GameStateEnum.MENU);
    });

    it('should have initial game data', () => {
      const gameData = gameStateManager.getGameData();
      expect(gameData.state).toBe(GameStateEnum.MENU);
      expect(gameData.score).toBe(0);
      expect(gameData.snake.segments).toHaveLength(3);
      expect(gameData.food).toBeNull();
    });

    it('should have zero game duration initially', () => {
      expect(gameStateManager.getGameDuration()).toBe(0);
    });
  });

  describe('State Transitions', () => {
    it('should transition from MENU to PLAYING', () => {
      const result = gameStateManager.transitionTo(GameStateEnum.PLAYING);
      expect(result).toBe(true);
      expect(gameStateManager.getCurrentState()).toBe(GameStateEnum.PLAYING);
    });

    it('should transition from PLAYING to PAUSED', () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      const result = gameStateManager.transitionTo(GameStateEnum.PAUSED);
      expect(result).toBe(true);
      expect(gameStateManager.getCurrentState()).toBe(GameStateEnum.PAUSED);
    });

    it('should transition from PAUSED to PLAYING', () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      gameStateManager.transitionTo(GameStateEnum.PAUSED);
      const result = gameStateManager.transitionTo(GameStateEnum.PLAYING);
      expect(result).toBe(true);
      expect(gameStateManager.getCurrentState()).toBe(GameStateEnum.PLAYING);
    });

    it('should reject invalid transitions', () => {
      // Cannot go directly from MENU to PAUSED
      const result = gameStateManager.transitionTo(GameStateEnum.PAUSED);
      expect(result).toBe(false);
      expect(gameStateManager.getCurrentState()).toBe(GameStateEnum.MENU);
    });

    it('should track state history', () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      gameStateManager.transitionTo(GameStateEnum.PAUSED);
      gameStateManager.transitionTo(GameStateEnum.PLAYING);

      const history = gameStateManager.getStateHistory();
      expect(history).toEqual([
        GameStateEnum.PLAYING,
        GameStateEnum.PAUSED,
        GameStateEnum.PLAYING,
      ]);
    });
  });

  describe('Game Lifecycle', () => {
    it('should start new game correctly', () => {
      const beforeStart = Date.now();
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      const afterStart = Date.now();

      const gameData = gameStateManager.getGameData();
      expect(gameData.gameStartTime).toBeGreaterThanOrEqual(beforeStart);
      expect(gameData.gameStartTime).toBeLessThanOrEqual(afterStart);
      expect(gameData.score).toBe(0);
      expect(gameData.totalPausedDuration).toBe(0);
    });

    it('should handle pause and resume correctly', async () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      
      // Wait a bit then pause
      await new Promise(resolve => setTimeout(resolve, 10));
      const pauseTime = Date.now();
      gameStateManager.transitionTo(GameStateEnum.PAUSED);

      let gameData = gameStateManager.getGameData();
      expect(gameData.pausedTime).toBeGreaterThanOrEqual(pauseTime - 5);
      expect(gameData.pausedTime).toBeLessThanOrEqual(pauseTime + 5);

      // Wait a bit then resume
      await new Promise(resolve => setTimeout(resolve, 10));
      gameStateManager.transitionTo(GameStateEnum.PLAYING);

      gameData = gameStateManager.getGameData();
      expect(gameData.pausedTime).toBe(0);
      expect(gameData.totalPausedDuration).toBeGreaterThan(0);
    });

    it('should calculate game duration correctly', async () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration = gameStateManager.getGameDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(1); // Should be less than 1 second
    });

    it('should handle game over state', () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      gameStateManager.transitionTo(GameStateEnum.GAME_OVER);

      expect(gameStateManager.getCurrentState()).toBe(GameStateEnum.GAME_OVER);
      expect(gameStateManager.isGameOver()).toBe(true);
    });
  });

  describe('State Checking Methods', () => {
    it('should correctly identify playing state', () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      expect(gameStateManager.isPlaying()).toBe(true);
      expect(gameStateManager.isPaused()).toBe(false);
      expect(gameStateManager.isGameOver()).toBe(false);
      expect(gameStateManager.isMenu()).toBe(false);
    });

    it('should correctly identify paused state', () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      gameStateManager.transitionTo(GameStateEnum.PAUSED);
      expect(gameStateManager.isPlaying()).toBe(false);
      expect(gameStateManager.isPaused()).toBe(true);
      expect(gameStateManager.isGameOver()).toBe(false);
      expect(gameStateManager.isMenu()).toBe(false);
    });

    it('should correctly check action availability', () => {
      // In MENU state
      expect(gameStateManager.canPause()).toBe(false);
      expect(gameStateManager.canResume()).toBe(false);

      // In PLAYING state
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      expect(gameStateManager.canPause()).toBe(true);
      expect(gameStateManager.canResume()).toBe(false);

      // In PAUSED state
      gameStateManager.transitionTo(GameStateEnum.PAUSED);
      expect(gameStateManager.canPause()).toBe(false);
      expect(gameStateManager.canResume()).toBe(true);
    });
  });

  describe('Data Management', () => {
    it('should update game data correctly', () => {
      const mockSnake: Snake = {
        segments: [
          { x: 100, y: 100, id: 'test-head' },
          { x: 80, y: 100, id: 'test-body-1' },
        ],
        direction: 'LEFT',
        nextDirection: 'LEFT',
        isGrowing: false,
      };

      gameStateManager.updateGameData({
        snake: mockSnake,
        score: 50,
      });

      const gameData = gameStateManager.getGameData();
      expect(gameData.snake).toEqual(mockSnake);
      expect(gameData.score).toBe(50);
    });

    it('should export and import state correctly', () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      gameStateManager.updateGameData({ score: 100 });

      const exportedState = gameStateManager.exportState();
      expect(exportedState.state).toBe(GameStateEnum.PLAYING);
      expect(exportedState.score).toBe(100);

      // Create new manager and import state
      const newManager = new GameStateManager();
      const importResult = newManager.importState(exportedState);
      
      expect(importResult).toBe(true);
      expect(newManager.getCurrentState()).toBe(GameStateEnum.PLAYING);
      expect(newManager.getGameData().score).toBe(100);
    });
  });

  describe('Event Subscriptions', () => {
    it('should notify state change callbacks', () => {
      const callback = jest.fn();
      const unsubscribe = gameStateManager.onStateChange(
        GameStateEnum.PLAYING,
        callback
      );

      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          state: GameStateEnum.PLAYING,
        })
      );

      // Unsubscribe should stop notifications
      unsubscribe();
      gameStateManager.transitionTo(GameStateEnum.PAUSED);
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should notify transition callbacks', () => {
      const callback = jest.fn();
      const unsubscribe = gameStateManager.onStateTransition(callback);

      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      gameStateManager.transitionTo(GameStateEnum.PAUSED);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(
        1,
        GameStateEnum.MENU,
        GameStateEnum.PLAYING
      );
      expect(callback).toHaveBeenNthCalledWith(
        2,
        GameStateEnum.PLAYING,
        GameStateEnum.PAUSED
      );

      unsubscribe();
    });

    it('should handle multiple callbacks for same state', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      gameStateManager.onStateChange(GameStateEnum.PLAYING, callback1);
      gameStateManager.onStateChange(GameStateEnum.PLAYING, callback2);

      gameStateManager.transitionTo(GameStateEnum.PLAYING);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Game Statistics', () => {
    it('should update game statistics correctly', () => {
      gameStateManager.updateGameStats({
        foodConsumed: 5,
        maxSnakeLength: 8,
      });

      const gameData = gameStateManager.getGameData();
      expect(gameData.gameStats.foodConsumed).toBe(5);
      expect(gameData.gameStats.maxSnakeLength).toBe(8);
    });

    it('should calculate final statistics on game end', async () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      
      // Wait long enough to ensure duration > 0 seconds
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      gameStateManager.transitionTo(GameStateEnum.GAME_OVER);

      const gameData = gameStateManager.getGameData();
      expect(gameData.gameStats.duration).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state transitions', () => {
      expect(() => {
        gameStateManager.transitionTo(GameStateEnum.PLAYING);
        gameStateManager.transitionTo(GameStateEnum.PAUSED);
        gameStateManager.transitionTo(GameStateEnum.PLAYING);
        gameStateManager.transitionTo(GameStateEnum.GAME_OVER);
        gameStateManager.transitionTo(GameStateEnum.MENU);
      }).not.toThrow();
    });

    it('should maintain data consistency after state transitions', () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      const initialData = gameStateManager.getGameData();
      
      gameStateManager.transitionTo(GameStateEnum.PAUSED);
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      
      const finalData = gameStateManager.getGameData();
      expect(finalData.gameStartTime).toBe(initialData.gameStartTime);
      expect(finalData.snake).toEqual(initialData.snake);
    });

    it('should handle invalid state imports gracefully', () => {
      const invalidData = {
        state: GameStateEnum.PLAYING,
        // Missing required fields
      } as GameStateData;

      expect(() => {
        gameStateManager.importState(invalidData);
      }).not.toThrow();
    });

    it('should clear state history when requested', () => {
      gameStateManager.transitionTo(GameStateEnum.PLAYING);
      gameStateManager.transitionTo(GameStateEnum.PAUSED);
      
      expect(gameStateManager.getStateHistory()).toHaveLength(2);
      
      gameStateManager.clearStateHistory();
      expect(gameStateManager.getStateHistory()).toHaveLength(0);
    });
  });
});