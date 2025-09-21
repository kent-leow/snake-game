/**
 * Integration tests for SpeedManager with GameEngine
 * Tests the complete speed system integration including combo events and game loop timing
 */

import { GameEngine } from '../gameEngine';
import type { GameEngineConfig, GameEngineCallbacks } from '../gameEngine';
import { SpeedManager } from '../../../game/SpeedManager';
import { DEFAULT_SPEED_CONFIG } from '../../../constants/SpeedConfig';
import type { ComboEvent } from '../../../types/Combo';
import type { SpeedConfig } from '../../../types/Speed';

describe('SpeedManager Integration', () => {
  let gameEngine: GameEngine;
  let speedManager: SpeedManager;
  let mockCallbacks: GameEngineCallbacks;

  const defaultConfig: GameEngineConfig = {
    canvasWidth: 800,
    canvasHeight: 600,
    gridSize: 20,
    initialScore: 0,
  };

  beforeEach(() => {
    mockCallbacks = {
      onComboEvent: jest.fn(),
      onScoreChange: jest.fn(),
      onFoodEaten: jest.fn(),
      onGameOver: jest.fn(),
    };

    gameEngine = new GameEngine(defaultConfig, mockCallbacks);
    speedManager = gameEngine.getSpeedManager();
  });

  describe('GameEngine Integration', () => {
    it('should initialize speed manager with default configuration', () => {
      const config = speedManager.getConfig();
      expect(config).toEqual(DEFAULT_SPEED_CONFIG);
      
      const state = speedManager.getSpeedState();
      expect(state.currentSpeed).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
      expect(state.speedLevel).toBe(0);
    });

    it('should initialize speed manager with custom configuration', () => {
      const customSpeedConfig: SpeedConfig = {
        baseSpeed: 200,
        speedIncrement: 20,
        maxSpeed: 80,
        minSpeed: 400,
        transitionDuration: 1000,
      };

      const customConfig: GameEngineConfig = {
        ...defaultConfig,
        speedConfig: customSpeedConfig,
      };

      const customGameEngine = new GameEngine(customConfig);
      const customSpeedManager = customGameEngine.getSpeedManager();

      expect(customSpeedManager.getConfig()).toEqual(customSpeedConfig);
      expect(customSpeedManager.getCurrentSpeed()).toBe(200);
    });

    it('should provide access to speed manager through public methods', () => {
      expect(gameEngine.getSpeedManager()).toBeInstanceOf(SpeedManager);
      expect(gameEngine.getCurrentSpeed()).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
      expect(gameEngine.getSpeedLevel()).toBe(0);
      expect(gameEngine.isAtMaxSpeed()).toBe(false);
      
      const stats = gameEngine.getSpeedStatistics();
      expect(stats.currentLevel).toBe(0);
      expect(stats.totalIncreases).toBe(0);
    });

    it('should reset speed manager when game starts', () => {
      // Simulate some combo progress
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();
      expect(speedManager.getSpeedLevel()).toBe(2);

      // Start game should reset speed
      gameEngine.start();
      expect(speedManager.getSpeedLevel()).toBe(0);
      expect(speedManager.getCurrentSpeed()).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
    });
  });

  describe('Game Loop Speed Integration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      gameEngine.start();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should use current speed for movement timing', () => {
      const initialSpeed = gameEngine.getCurrentSpeed();
      
      // Mock the performance.now() to control timing
      const mockPerformanceNow = jest.spyOn(performance, 'now');
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => currentTime);

      // First update - should not move (no time passed)
      expect(gameEngine.update()).toBe(true);
      
      // Advance time by less than current speed - should not move
      currentTime += initialSpeed - 1;
      expect(gameEngine.update()).toBe(true);
      
      // Advance time by current speed - should move
      currentTime += 1;
      const shouldUpdate = gameEngine.update();
      expect(shouldUpdate).toBeDefined(); // Movement attempted

      mockPerformanceNow.mockRestore();
    });

    it('should update speed when combos are completed', () => {
      const initialSpeed = gameEngine.getCurrentSpeed();
      
      // Simulate combo completion through the combo manager
      const comboManager = gameEngine.getComboManager();
      
      // Complete a combo sequence: 1->2->3->4->5
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });

      // Speed target should have changed
      const speedManager = gameEngine.getSpeedManager();
      expect(speedManager.getSpeedState().targetSpeed).toBeLessThan(initialSpeed);
      expect(gameEngine.getSpeedLevel()).toBe(1);
    });

    it('should reset speed when combos are broken', () => {
      // Complete a combo first
      const comboManager = gameEngine.getComboManager();
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });

      expect(gameEngine.getSpeedLevel()).toBe(1);
      
      // Break the combo
      comboManager.processFood(1);
      comboManager.processFood(3); // Should be 2, so this breaks it

      expect(gameEngine.getSpeedLevel()).toBe(0);
      expect(gameEngine.getCurrentSpeed()).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
    });

    it('should handle smooth speed transitions during gameplay', () => {
      const initialSpeed = gameEngine.getCurrentSpeed();
      
      // Trigger speed change
      speedManager.onComboCompleted();
      
      // Should be transitioning
      const state = speedManager.getSpeedState();
      expect(state.isTransitioning).toBe(true);
      
      // Advance time partially through transition
      jest.advanceTimersByTime(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      speedManager.update(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      
      const midTransitionSpeed = gameEngine.getCurrentSpeed();
      expect(midTransitionSpeed).toBeGreaterThan(state.targetSpeed);
      expect(midTransitionSpeed).toBeLessThan(initialSpeed);
      
      // Complete transition
      jest.advanceTimersByTime(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      speedManager.update(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      
      const finalSpeed = gameEngine.getCurrentSpeed();
      expect(finalSpeed).toBe(state.targetSpeed);
      expect(speedManager.getSpeedState().isTransitioning).toBe(false);
    });
  });

  describe('Combo Event Integration', () => {
    it('should automatically handle combo events from combo manager', () => {
      const comboManager = gameEngine.getComboManager();
      const initialSpeed = gameEngine.getCurrentSpeed();

      // Track combo events
      const comboEvents: ComboEvent[] = [];
      comboManager.subscribe((event) => {
        comboEvents.push(event);
      });

      // Complete a combo
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });

      // Should have received completed event and speed should have changed
      const completedEvent = comboEvents.find(e => e.type === 'completed');
      expect(completedEvent).toBeDefined();
      expect(gameEngine.getSpeedManager().getSpeedState().targetSpeed).toBeLessThan(initialSpeed);
      expect(gameEngine.getSpeedLevel()).toBe(1);
    });

    it('should handle multiple rapid combo events correctly', () => {
      const comboManager = gameEngine.getComboManager();

      // Complete multiple combos rapidly
      for (let combo = 0; combo < 3; combo++) {
        [1, 2, 3, 4, 5].forEach(num => {
          comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
        });
      }

      expect(gameEngine.getSpeedLevel()).toBe(3);
      
      // Break combo
      comboManager.processFood(1);
      comboManager.processFood(3); // Wrong number

      expect(gameEngine.getSpeedLevel()).toBe(0);
    });

    it('should maintain speed consistency across game engine operations', () => {
      const comboManager = gameEngine.getComboManager();
      
      // Complete combo
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });

      const speedFromEngine = gameEngine.getCurrentSpeed();
      const speedFromManager = speedManager.getCurrentSpeed();
      const speedLevelFromEngine = gameEngine.getSpeedLevel();
      const speedLevelFromManager = speedManager.getSpeedLevel();

      expect(speedFromEngine).toBe(speedFromManager);
      expect(speedLevelFromEngine).toBe(speedLevelFromManager);
    });
  });

  describe('Performance and Edge Cases', () => {
    beforeEach(() => {
      gameEngine.start();
    });

    it('should handle maximum speed correctly', () => {
      const comboManager = gameEngine.getComboManager();
      
      // Complete many combos to reach max speed
      for (let combo = 0; combo < 20; combo++) {
        [1, 2, 3, 4, 5].forEach(num => {
          comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
        });
      }

      expect(gameEngine.isAtMaxSpeed()).toBe(true);
      expect(gameEngine.getSpeedManager().getSpeedState().targetSpeed).toBe(DEFAULT_SPEED_CONFIG.maxSpeed);
      
      // Additional combos should not decrease speed further
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });

      expect(gameEngine.getSpeedManager().getSpeedState().targetSpeed).toBe(DEFAULT_SPEED_CONFIG.maxSpeed);
    });

    it('should handle game pause and resume correctly', () => {
      speedManager.onComboCompleted();
      
      const speedBeforePause = gameEngine.getCurrentSpeed();
      const levelBeforePause = gameEngine.getSpeedLevel();

      gameEngine.pause();
      gameEngine.resume();

      expect(gameEngine.getCurrentSpeed()).toBe(speedBeforePause);
      expect(gameEngine.getSpeedLevel()).toBe(levelBeforePause);
    });

    it('should handle game stop and restart correctly', () => {
      // Make some progress
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();
      
      expect(gameEngine.getSpeedLevel()).toBe(2);

      gameEngine.stop();
      gameEngine.start();

      // Speed should reset on restart
      expect(gameEngine.getSpeedLevel()).toBe(0);
      expect(gameEngine.getCurrentSpeed()).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
    });

    it('should maintain accurate statistics across game sessions', () => {
      const comboManager = gameEngine.getComboManager();
      
      // Complete some combos
      for (let combo = 0; combo < 3; combo++) {
        [1, 2, 3, 4, 5].forEach(num => {
          comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
        });
      }

      // Break combo
      comboManager.processFood(1);
      comboManager.processFood(4); // Wrong number

      const stats = gameEngine.getSpeedStatistics();
      expect(stats.totalIncreases).toBe(3);
      expect(stats.totalResets).toBe(1);
      expect(stats.maxLevelReached).toBe(3);
      expect(stats.currentLevel).toBe(0);
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle invalid speed configuration gracefully', () => {
      const invalidConfig: GameEngineConfig = {
        ...defaultConfig,
        speedConfig: {
          baseSpeed: -100, // Invalid
          speedIncrement: 10,
          maxSpeed: 50,
          minSpeed: 200,
          transitionDuration: 500,
        },
      };

      expect(() => new GameEngine(invalidConfig)).toThrow();
    });

    it('should use default configuration when no speed config provided', () => {
      const configWithoutSpeed: GameEngineConfig = {
        canvasWidth: 800,
        canvasHeight: 600,
        gridSize: 20,
      };

      const engine = new GameEngine(configWithoutSpeed);
      const manager = engine.getSpeedManager();

      expect(manager.getConfig()).toEqual(DEFAULT_SPEED_CONFIG);
    });
  });
});