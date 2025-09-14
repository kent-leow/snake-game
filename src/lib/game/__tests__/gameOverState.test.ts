import { GameOverManager, type GameOverState, type GameStatistics } from '../gameOverState';

describe('GameOverManager', () => {
  let gameOverManager: GameOverManager;

  beforeEach(() => {
    gameOverManager = new GameOverManager();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const state = gameOverManager.getGameOverState();
      
      expect(state.isGameOver).toBe(false);
      expect(state.cause).toBeNull();
      expect(state.finalScore).toBe(0);
      expect(state.timestamp).toBe(0);
      expect(state.collisionPosition).toBeUndefined();
      expect(state.gameStats).toBeUndefined();
    });

    it('should report not game over initially', () => {
      expect(gameOverManager.isGameOver()).toBe(false);
    });

    it('should have no subscribers initially', () => {
      expect(gameOverManager.getSubscriberCount()).toBe(0);
    });
  });

  describe('Game Over Trigger', () => {
    const mockStats: GameStatistics = {
      duration: 120,
      foodConsumed: 10,
      maxSnakeLength: 15,
      averageSpeed: 2.0,
    };

    it('should trigger game over with boundary collision', () => {
      const beforeTime = Date.now();
      
      gameOverManager.triggerGameOver('boundary', 1000);
      
      const state = gameOverManager.getGameOverState();
      expect(state.isGameOver).toBe(true);
      expect(state.cause).toBe('boundary');
      expect(state.finalScore).toBe(1000);
      expect(state.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(state.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should trigger game over with self collision', () => {
      gameOverManager.triggerGameOver('self', 500);
      
      const state = gameOverManager.getGameOverState();
      expect(state.isGameOver).toBe(true);
      expect(state.cause).toBe('self');
      expect(state.finalScore).toBe(500);
    });

    it('should trigger game over with collision position', () => {
      const collisionPosition = { x: 100, y: 200 };
      
      gameOverManager.triggerGameOver('boundary', 750, collisionPosition);
      
      const state = gameOverManager.getGameOverState();
      expect(state.collisionPosition).toEqual(collisionPosition);
    });

    it('should trigger game over with game statistics', () => {
      gameOverManager.triggerGameOver('self', 1200, undefined, mockStats);
      
      const state = gameOverManager.getGameOverState();
      expect(state.gameStats).toEqual(mockStats);
    });

    it('should trigger game over with all parameters', () => {
      const collisionPosition = { x: 50, y: 75 };
      
      gameOverManager.triggerGameOver('boundary', 2000, collisionPosition, mockStats);
      
      const state = gameOverManager.getGameOverState();
      expect(state.isGameOver).toBe(true);
      expect(state.cause).toBe('boundary');
      expect(state.finalScore).toBe(2000);
      expect(state.collisionPosition).toEqual(collisionPosition);
      expect(state.gameStats).toEqual(mockStats);
    });

    it('should update isGameOver status', () => {
      expect(gameOverManager.isGameOver()).toBe(false);
      
      gameOverManager.triggerGameOver('boundary', 100);
      
      expect(gameOverManager.isGameOver()).toBe(true);
    });
  });

  describe('Game Over Reset', () => {
    beforeEach(() => {
      // Set up game over state
      gameOverManager.triggerGameOver('boundary', 1000, { x: 100, y: 100 });
    });

    it('should reset game over state', () => {
      gameOverManager.resetGameOver();
      
      const state = gameOverManager.getGameOverState();
      expect(state.isGameOver).toBe(false);
      expect(state.cause).toBeNull();
      expect(state.finalScore).toBe(0);
      expect(state.timestamp).toBe(0);
      expect(state.collisionPosition).toBeUndefined();
      expect(state.gameStats).toBeUndefined();
    });

    it('should update isGameOver status after reset', () => {
      expect(gameOverManager.isGameOver()).toBe(true);
      
      gameOverManager.resetGameOver();
      
      expect(gameOverManager.isGameOver()).toBe(false);
    });
  });

  describe('Subscription Management', () => {
    it('should add subscribers and track count', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      gameOverManager.subscribe(callback1);
      expect(gameOverManager.getSubscriberCount()).toBe(1);
      
      gameOverManager.subscribe(callback2);
      expect(gameOverManager.getSubscriberCount()).toBe(2);
    });

    it('should notify subscribers on game over trigger', () => {
      const callback = jest.fn();
      gameOverManager.subscribe(callback);
      
      gameOverManager.triggerGameOver('boundary', 1000);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          isGameOver: true,
          cause: 'boundary',
          finalScore: 1000,
        })
      );
    });

    it('should notify subscribers on reset', () => {
      const callback = jest.fn();
      gameOverManager.subscribe(callback);
      
      // Set up game over state
      gameOverManager.triggerGameOver('self', 500);
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Reset
      gameOverManager.resetGameOver();
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isGameOver: false,
          cause: null,
          finalScore: 0,
        })
      );
    });

    it('should notify all subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();
      
      gameOverManager.subscribe(callback1);
      gameOverManager.subscribe(callback2);
      gameOverManager.subscribe(callback3);
      
      gameOverManager.triggerGameOver('boundary', 1000);
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = gameOverManager.subscribe(callback);
      
      expect(gameOverManager.getSubscriberCount()).toBe(1);
      
      unsubscribe();
      
      expect(gameOverManager.getSubscriberCount()).toBe(0);
    });

    it('should not notify unsubscribed callbacks', () => {
      const callback = jest.fn();
      const unsubscribe = gameOverManager.subscribe(callback);
      
      unsubscribe();
      gameOverManager.triggerGameOver('boundary', 1000);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear all subscribers', () => {
      gameOverManager.subscribe(jest.fn());
      gameOverManager.subscribe(jest.fn());
      gameOverManager.subscribe(jest.fn());
      
      expect(gameOverManager.getSubscriberCount()).toBe(3);
      
      gameOverManager.clearSubscribers();
      
      expect(gameOverManager.getSubscriberCount()).toBe(0);
    });
  });

  describe('State Getters', () => {
    it('should get game over cause', () => {
      expect(gameOverManager.getGameOverCause()).toBeNull();
      
      gameOverManager.triggerGameOver('self', 100);
      
      expect(gameOverManager.getGameOverCause()).toBe('self');
    });

    it('should get final score', () => {
      expect(gameOverManager.getFinalScore()).toBe(0);
      
      gameOverManager.triggerGameOver('boundary', 1500);
      
      expect(gameOverManager.getFinalScore()).toBe(1500);
    });

    it('should get collision position', () => {
      expect(gameOverManager.getCollisionPosition()).toBeUndefined();
      
      const position = { x: 200, y: 300 };
      gameOverManager.triggerGameOver('boundary', 100, position);
      
      expect(gameOverManager.getCollisionPosition()).toEqual(position);
    });

    it('should get game statistics', () => {
      expect(gameOverManager.getGameStatistics()).toBeUndefined();
      
      const stats: GameStatistics = {
        duration: 60,
        foodConsumed: 5,
        maxSnakeLength: 10,
        averageSpeed: 1.5,
      };
      
      gameOverManager.triggerGameOver('self', 100, undefined, stats);
      
      expect(gameOverManager.getGameStatistics()).toEqual(stats);
    });
  });

  describe('State Immutability', () => {
    it('should return immutable state copies', () => {
      const state1 = gameOverManager.getGameOverState();
      const state2 = gameOverManager.getGameOverState();
      
      expect(state1).not.toBe(state2); // Different object references
      expect(state1).toEqual(state2); // Same content
    });

    it('should not affect internal state when modifying returned state', () => {
      const state = gameOverManager.getGameOverState();
      
      // Try to modify returned state
      state.isGameOver = true;
      state.finalScore = 999;
      
      // Internal state should be unchanged
      const internalState = gameOverManager.getGameOverState();
      expect(internalState.isGameOver).toBe(false);
      expect(internalState.finalScore).toBe(0);
    });
  });

  describe('Data Export/Import', () => {
    const testState: GameOverState = {
      isGameOver: true,
      cause: 'boundary',
      finalScore: 1500,
      timestamp: 1234567890,
      collisionPosition: { x: 100, y: 200 },
      gameStats: {
        duration: 180,
        foodConsumed: 20,
        maxSnakeLength: 25,
        averageSpeed: 3.0,
      },
    };

    it('should export current state', () => {
      gameOverManager.triggerGameOver(
        'boundary',
        1500,
        { x: 100, y: 200 },
        testState.gameStats
      );
      
      const exportedData = gameOverManager.exportData();
      
      expect(exportedData.isGameOver).toBe(true);
      expect(exportedData.cause).toBe('boundary');
      expect(exportedData.finalScore).toBe(1500);
      expect(exportedData.collisionPosition).toEqual({ x: 100, y: 200 });
      expect(exportedData.gameStats).toEqual(testState.gameStats);
    });

    it('should import state and notify subscribers', () => {
      const callback = jest.fn();
      gameOverManager.subscribe(callback);
      
      gameOverManager.importData(testState);
      
      const importedState = gameOverManager.getGameOverState();
      expect(importedState).toEqual(testState);
      expect(callback).toHaveBeenCalledWith(testState);
    });

    it('should handle importing partial state', () => {
      const partialState: GameOverState = {
        isGameOver: true,
        cause: 'self',
        finalScore: 800,
        timestamp: 9876543210,
      };
      
      gameOverManager.importData(partialState);
      
      const state = gameOverManager.getGameOverState();
      expect(state.isGameOver).toBe(true);
      expect(state.cause).toBe('self');
      expect(state.finalScore).toBe(800);
      expect(state.timestamp).toBe(9876543210);
      expect(state.collisionPosition).toBeUndefined();
      expect(state.gameStats).toBeUndefined();
    });
  });
});