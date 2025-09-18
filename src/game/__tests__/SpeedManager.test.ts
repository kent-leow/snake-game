/**
 * Comprehensive unit tests for SpeedManager
 * Tests speed progression, combo integration, transitions, and edge cases
 */

import { SpeedManager } from '@/game/SpeedManager';
import { DEFAULT_SPEED_CONFIG, calculateSpeedCurve } from '@/constants/SpeedConfig';
import type { SpeedConfig, SpeedChangeEvent } from '@/types/Speed';
import type { ComboEvent } from '@/types/Combo';

describe('SpeedManager', () => {
  let speedManager: SpeedManager;
  let mockSpeedChangeCallback: jest.Mock<void, [SpeedChangeEvent]>;

  beforeEach(() => {
    speedManager = new SpeedManager();
    mockSpeedChangeCallback = jest.fn();
    speedManager.onSpeedChange(mockSpeedChangeCallback);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const state = speedManager.getSpeedState();
      const config = speedManager.getConfig();

      expect(state.currentSpeed).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
      expect(state.speedLevel).toBe(0);
      expect(state.isTransitioning).toBe(false);
      expect(config).toEqual(DEFAULT_SPEED_CONFIG);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: SpeedConfig = {
        baseSpeed: 200,
        speedIncrement: 20,
        maxSpeed: 80,
        minSpeed: 400,
        transitionDuration: 1000,
      };

      const customSpeedManager = new SpeedManager(customConfig);
      const state = customSpeedManager.getSpeedState();
      const config = customSpeedManager.getConfig();

      expect(state.currentSpeed).toBe(200);
      expect(config).toEqual(customConfig);
    });

    it('should throw error for invalid configuration', () => {
      const invalidConfig: SpeedConfig = {
        baseSpeed: 100,
        speedIncrement: 10,
        maxSpeed: 200, // Invalid: maxSpeed > baseSpeed
        minSpeed: 50,
        transitionDuration: 500,
      };

      expect(() => new SpeedManager(invalidConfig)).toThrow();
    });
  });

  describe('combo event handling', () => {
    it('should increase speed when combo is completed', () => {
      const completedEvent: ComboEvent = {
        type: 'completed',
        sequence: [1, 2, 3, 4, 5],
        progress: 5,
        totalPoints: 100,
        timestamp: Date.now(),
      };

      speedManager.handleComboEvent(completedEvent);

      const state = speedManager.getSpeedState();
      expect(state.speedLevel).toBe(1);
      expect(state.targetSpeed).toBe(DEFAULT_SPEED_CONFIG.baseSpeed - DEFAULT_SPEED_CONFIG.speedIncrement);
      expect(mockSpeedChangeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'combo_completed',
          speedLevel: 1,
        })
      );
    });

    it('should reset speed when combo is broken', () => {
      // First complete a combo
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();
      
      expect(speedManager.getSpeedLevel()).toBe(2);

      const brokenEvent: ComboEvent = {
        type: 'broken',
        sequence: [1, 2],
        progress: 0,
        totalPoints: 0,
        timestamp: Date.now(),
      };

      speedManager.handleComboEvent(brokenEvent);

      const state = speedManager.getSpeedState();
      expect(state.speedLevel).toBe(0);
      expect(state.targetSpeed).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
      expect(mockSpeedChangeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'combo_broken',
          speedLevel: 0,
        })
      );
    });

    it('should ignore started and progress combo events', () => {
      const startedEvent: ComboEvent = {
        type: 'started',
        sequence: [1],
        progress: 1,
        totalPoints: 0,
        timestamp: Date.now(),
      };

      const progressEvent: ComboEvent = {
        type: 'progress',
        sequence: [1, 2],
        progress: 2,
        totalPoints: 0,
        timestamp: Date.now(),
      };

      speedManager.handleComboEvent(startedEvent);
      speedManager.handleComboEvent(progressEvent);

      expect(speedManager.getSpeedLevel()).toBe(0);
      expect(mockSpeedChangeCallback).not.toHaveBeenCalled();
    });
  });

  describe('speed progression', () => {
    it('should increase speed with each combo completion', () => {
      const initialSpeed = speedManager.getCurrentSpeed();

      speedManager.onComboCompleted();
      expect(speedManager.getSpeedState().targetSpeed).toBeLessThan(initialSpeed);
      expect(speedManager.getSpeedLevel()).toBe(1);

      speedManager.onComboCompleted();
      expect(speedManager.getSpeedLevel()).toBe(2);
      expect(speedManager.getSpeedState().targetSpeed).toBe(
        DEFAULT_SPEED_CONFIG.baseSpeed - 2 * DEFAULT_SPEED_CONFIG.speedIncrement
      );
    });

    it('should respect maximum speed limit', () => {
      // Complete enough combos to reach max speed
      const combosToMax = Math.ceil(
        (DEFAULT_SPEED_CONFIG.baseSpeed - DEFAULT_SPEED_CONFIG.maxSpeed) / 
        DEFAULT_SPEED_CONFIG.speedIncrement
      ) + 5; // Extra to ensure we hit the cap

      for (let i = 0; i < combosToMax; i++) {
        speedManager.onComboCompleted();
      }

      expect(speedManager.getSpeedState().targetSpeed).toBe(DEFAULT_SPEED_CONFIG.maxSpeed);
      expect(speedManager.isAtMaxSpeed()).toBe(true);
    });

    it('should calculate speed curve correctly', () => {
      const config = DEFAULT_SPEED_CONFIG;
      
      expect(calculateSpeedCurve(0, config)).toBe(config.baseSpeed);
      expect(calculateSpeedCurve(1, config)).toBe(config.baseSpeed - config.speedIncrement);
      expect(calculateSpeedCurve(2, config)).toBe(config.baseSpeed - 2 * config.speedIncrement);
      
      // Test max speed cap
      const maxLevel = Math.ceil((config.baseSpeed - config.maxSpeed) / config.speedIncrement) + 10;
      expect(calculateSpeedCurve(maxLevel, config)).toBe(config.maxSpeed);
    });
  });

  describe('speed transitions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should transition smoothly between speeds', () => {
      const initialSpeed = speedManager.getCurrentSpeed();
      
      speedManager.onComboCompleted();
      
      // Should be transitioning
      let state = speedManager.getSpeedState();
      expect(state.isTransitioning).toBe(true);
      expect(state.currentSpeed).toBe(initialSpeed); // Should still be at initial speed
      
      // Advance time partially through transition
      jest.advanceTimersByTime(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      speedManager.update(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      
      state = speedManager.getSpeedState();
      expect(state.currentSpeed).toBeGreaterThan(state.targetSpeed);
      expect(state.currentSpeed).toBeLessThan(initialSpeed);
      
      // Complete transition
      jest.advanceTimersByTime(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      speedManager.update(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      
      state = speedManager.getSpeedState();
      expect(state.isTransitioning).toBe(false);
      expect(state.currentSpeed).toBe(state.targetSpeed);
    });

    it('should handle multiple rapid speed changes', () => {
      speedManager.onComboCompleted();
      jest.advanceTimersByTime(100); // Partial transition
      speedManager.update(100);
      
      speedManager.onComboCompleted();
      jest.advanceTimersByTime(100);
      speedManager.update(100);
      
      speedManager.onComboBreak();
      
      const state = speedManager.getSpeedState();
      expect(state.speedLevel).toBe(0);
      expect(state.targetSpeed).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
    });
  });

  describe('statistics tracking', () => {
    it('should track speed level statistics', () => {
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();

      const stats = speedManager.getStatistics();
      expect(stats.currentLevel).toBe(3);
      expect(stats.maxLevelReached).toBe(3);
      expect(stats.totalIncreases).toBe(3);
      expect(stats.totalResets).toBe(0);
    });

    it('should track resets correctly', () => {
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();
      speedManager.onComboBreak();
      speedManager.onComboCompleted();
      speedManager.reset();

      const stats = speedManager.getStatistics();
      expect(stats.currentLevel).toBe(0);
      expect(stats.maxLevelReached).toBe(2);
      expect(stats.totalIncreases).toBe(3);
      expect(stats.totalResets).toBe(2); // One from combo break, one from manual reset
    });
  });

  describe('configuration management', () => {
    it('should update configuration at runtime', () => {
      const newConfig: Partial<SpeedConfig> = {
        baseSpeed: 200,
        speedIncrement: 25,
      };

      speedManager.updateConfig(newConfig);

      const config = speedManager.getConfig();
      expect(config.baseSpeed).toBe(200);
      expect(config.speedIncrement).toBe(25);
      expect(config.maxSpeed).toBe(DEFAULT_SPEED_CONFIG.maxSpeed); // Should keep original
    });

    it('should reject invalid configuration updates', () => {
      const invalidConfig: Partial<SpeedConfig> = {
        maxSpeed: 300, // Invalid: would be greater than baseSpeed
      };

      expect(() => speedManager.updateConfig(invalidConfig)).toThrow();
    });

    it('should recalculate target speed when config changes', () => {
      speedManager.onComboCompleted(); // Level 1
      
      const newConfig: Partial<SpeedConfig> = {
        speedIncrement: 30, // Increase from default 15
      };

      speedManager.updateConfig(newConfig);

      const state = speedManager.getSpeedState();
      expect(state.targetSpeed).toBe(DEFAULT_SPEED_CONFIG.baseSpeed - 30);
    });
  });

  describe('data persistence', () => {
    it('should export data correctly', () => {
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();

      const exportedData = speedManager.exportData();

      expect(exportedData.state.speedLevel).toBe(2);
      expect(exportedData.config).toEqual(DEFAULT_SPEED_CONFIG);
      expect(exportedData.statistics.totalIncreases).toBe(2);
      expect(exportedData.timestamp).toBeCloseTo(Date.now(), -2);
    });

    it('should import data correctly', () => {
      const importData = {
        state: {
          currentSpeed: 120,
          speedLevel: 3,
          isTransitioning: false,
          targetSpeed: 120,
          transitionStartTime: Date.now(),
        },
        config: DEFAULT_SPEED_CONFIG,
        statistics: {
          currentLevel: 3,
          maxLevelReached: 5,
          totalIncreases: 7,
          totalResets: 2,
          timeAtMaxSpeed: 1000,
          averageSpeedLevel: 2.5,
        },
        timestamp: Date.now(),
      };

      speedManager.importData(importData);

      const state = speedManager.getSpeedState();
      const stats = speedManager.getStatistics();

      expect(state.speedLevel).toBe(3);
      expect(state.currentSpeed).toBe(120);
      expect(stats.totalIncreases).toBe(7);
      expect(stats.maxLevelReached).toBe(5);
    });

    it('should handle invalid import data gracefully', () => {
      const invalidData = {
        state: {
          currentSpeed: 120,
          speedLevel: 3,
          isTransitioning: false,
          targetSpeed: 120,
          transitionStartTime: Date.now(),
        },
        config: {
          baseSpeed: -100, // Invalid
          speedIncrement: 10,
          maxSpeed: 50,
          minSpeed: 200,
          transitionDuration: 500,
        },
        statistics: {
          currentLevel: 3,
          maxLevelReached: 5,
          totalIncreases: 7,
          totalResets: 2,
          timeAtMaxSpeed: 1000,
          averageSpeedLevel: 2.5,
        },
        timestamp: Date.now(),
      };

      // Should not throw and should keep original config
      speedManager.importData(invalidData);
      const config = speedManager.getConfig();
      expect(config).toEqual(DEFAULT_SPEED_CONFIG);
    });
  });

  describe('callback management', () => {
    it('should allow multiple speed change subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      speedManager.onSpeedChange(callback1);
      speedManager.onSpeedChange(callback2);

      speedManager.onComboCompleted();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should allow unsubscribing from speed changes', () => {
      const callback = jest.fn();
      const unsubscribe = speedManager.onSpeedChange(callback);

      speedManager.onComboCompleted();
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      speedManager.onComboCompleted();
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test callback error');
      });
      const normalCallback = jest.fn();

      speedManager.onSpeedChange(errorCallback);
      speedManager.onSpeedChange(normalCallback);

      // Should not throw and should call all callbacks
      expect(() => speedManager.onComboCompleted()).not.toThrow();
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle update with zero delta time', () => {
      speedManager.onComboCompleted();
      
      expect(() => speedManager.update(0)).not.toThrow();
      
      const state = speedManager.getSpeedState();
      expect(state.isTransitioning).toBe(true);
    });

    it('should handle negative delta time', () => {
      speedManager.onComboCompleted();
      
      expect(() => speedManager.update(-100)).not.toThrow();
    });

    it('should maintain speed progress calculation accuracy', () => {
      const progress1 = speedManager.getSpeedProgress();
      expect(progress1).toBe(0);

      speedManager.onComboCompleted();
      const progress2 = speedManager.getSpeedProgress();
      expect(progress2).toBeGreaterThan(0);
      expect(progress2).toBeLessThanOrEqual(1);

      // Complete enough combos to reach max speed
      for (let i = 0; i < 20; i++) {
        speedManager.onComboCompleted();
      }

      const progress3 = speedManager.getSpeedProgress();
      expect(progress3).toBe(1);
    });
  });

  describe('easing functions', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should use custom easing function', () => {
      // Linear easing for predictable testing
      speedManager.setEasingFunction((t) => t);

      const initialSpeed = speedManager.getCurrentSpeed();
      speedManager.onComboCompleted();

      // At 50% through transition should be exactly halfway
      jest.advanceTimersByTime(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      speedManager.update(DEFAULT_SPEED_CONFIG.transitionDuration / 2);

      const state = speedManager.getSpeedState();
      const expectedMidSpeed = (initialSpeed + state.targetSpeed) / 2;
      expect(state.currentSpeed).toBeCloseTo(expectedMidSpeed, 1);
    });
  });
});