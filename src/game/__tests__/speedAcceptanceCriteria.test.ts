/**
 * Acceptance Criteria Tests for Progressive Speed System
 * Tests the specific GIVEN/WHEN/THEN scenarios from the task specification
 */

import { SpeedManager } from '@/game/SpeedManager';
import { GameEngine } from '@/lib/game/gameEngine';
import { DEFAULT_SPEED_CONFIG } from '@/constants/SpeedConfig';
import type { GameEngineConfig } from '@/lib/game/gameEngine';
import type { ComboEvent } from '@/types/Combo';

describe('Progressive Speed System - Acceptance Criteria', () => {
  let speedManager: SpeedManager;
  let gameEngine: GameEngine;

  const defaultConfig: GameEngineConfig = {
    canvasWidth: 800,
    canvasHeight: 600,
    gridSize: 20,
    initialScore: 0,
  };

  beforeEach(() => {
    speedManager = new SpeedManager();
    gameEngine = new GameEngine(defaultConfig);
  });

  describe('AC-1: Speed increases with combo completion', () => {
    /**
     * GIVEN combo completed WHEN sequence 1→2→3→4→5 finishes THEN snake speed increases by one increment
     */
    it('should increase snake speed by one increment when combo sequence 1→2→3→4→5 finishes', () => {
      // GIVEN: Initial speed state
      const initialSpeed = speedManager.getCurrentSpeed();
      const initialLevel = speedManager.getSpeedLevel();
      expect(initialSpeed).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
      expect(initialLevel).toBe(0);

      // WHEN: Combo sequence 1→2→3→4→5 finishes (combo completed)
      speedManager.onComboCompleted();

      // THEN: Snake speed increases by one increment
      const newLevel = speedManager.getSpeedLevel();
      
      expect(newLevel).toBe(initialLevel + 1);
      expect(speedManager.getSpeedState().targetSpeed).toBe(
        initialSpeed - DEFAULT_SPEED_CONFIG.speedIncrement
      );
    });

    it('should integrate combo completion with game engine correctly', () => {
      // GIVEN: Game engine with combo manager
      const comboManager = gameEngine.getComboManager();
      const initialSpeed = gameEngine.getCurrentSpeed();

      // WHEN: Complete combo sequence 1→2→3→4→5
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });

      // THEN: Game engine speed increases
      expect(gameEngine.getSpeedLevel()).toBe(1);
      expect(gameEngine.getSpeedManager().getSpeedState().targetSpeed).toBe(
        initialSpeed - DEFAULT_SPEED_CONFIG.speedIncrement
      );
    });
  });

  describe('AC-2: Speed resets on combo break', () => {
    /**
     * GIVEN combo broken WHEN wrong food eaten THEN snake speed resets to base level immediately
     */
    it('should reset snake speed to base level immediately when combo is broken', () => {
      // GIVEN: Some combo progress and increased speed
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();
      
      expect(speedManager.getSpeedLevel()).toBe(3);
      const targetSpeed = speedManager.getSpeedState().targetSpeed;
      expect(targetSpeed).toBeLessThan(DEFAULT_SPEED_CONFIG.baseSpeed);

      // WHEN: Combo broken (wrong food eaten)
      speedManager.onComboBreak();

      // THEN: Snake speed resets to base level immediately
      const resetLevel = speedManager.getSpeedLevel();
      
      expect(resetLevel).toBe(0);
      expect(speedManager.getSpeedState().targetSpeed).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
    });

    it('should integrate combo break with game engine correctly', () => {
      // GIVEN: Game with combo progress
      const comboManager = gameEngine.getComboManager();
      
      // Complete some combos first
      for (let i = 0; i < 2; i++) {
        [1, 2, 3, 4, 5].forEach(num => {
          comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
        });
      }
      
      expect(gameEngine.getSpeedLevel()).toBe(2);

      // WHEN: Wrong food eaten (combo broken)
      comboManager.processFood(1); // Start new combo
      comboManager.processFood(4); // Wrong! Should be 2

      // THEN: Speed resets to base level
      expect(gameEngine.getSpeedLevel()).toBe(0);
      expect(gameEngine.getSpeedManager().getSpeedState().targetSpeed).toBe(
        DEFAULT_SPEED_CONFIG.baseSpeed
      );
    });
  });

  describe('AC-3: Multiple combo speed increases', () => {
    /**
     * GIVEN speed increases WHEN multiple combos completed THEN each combo adds one speed increment
     */
    it('should add one speed increment for each combo completed', () => {
      // GIVEN: Initial speed state
      const initialSpeed = DEFAULT_SPEED_CONFIG.baseSpeed;
      expect(speedManager.getCurrentSpeed()).toBe(initialSpeed);

      // WHEN: Multiple combos completed
      const combosToComplete = 5;
      for (let i = 0; i < combosToComplete; i++) {
        speedManager.onComboCompleted();
      }

      // THEN: Each combo adds one speed increment
      expect(speedManager.getSpeedLevel()).toBe(combosToComplete);
      expect(speedManager.getSpeedState().targetSpeed).toBe(
        initialSpeed - (combosToComplete * DEFAULT_SPEED_CONFIG.speedIncrement)
      );
    });

    it('should maintain cumulative speed increases across multiple combos', () => {
      // Track speed changes
      const speedChanges: number[] = [];
      speedChanges.push(speedManager.getCurrentSpeed());

      // WHEN: Complete multiple combos
      for (let i = 1; i <= 4; i++) {
        speedManager.onComboCompleted();
        speedChanges.push(speedManager.getSpeedState().targetSpeed);
      }

      // THEN: Each combo consistently adds the same increment
      for (let i = 1; i < speedChanges.length; i++) {
        const speedDecrease = speedChanges[i - 1] - speedChanges[i];
        expect(speedDecrease).toBe(DEFAULT_SPEED_CONFIG.speedIncrement);
      }
    });

    it('should handle multiple combos through game engine', () => {
      // GIVEN: Game engine setup
      const comboManager = gameEngine.getComboManager();
      const initialSpeed = gameEngine.getCurrentSpeed();

      // WHEN: Multiple combos completed
      const combosToComplete = 3;
      for (let combo = 0; combo < combosToComplete; combo++) {
        [1, 2, 3, 4, 5].forEach(num => {
          comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
        });
      }

      // THEN: Each combo added one speed increment
      expect(gameEngine.getSpeedLevel()).toBe(combosToComplete);
      expect(gameEngine.getSpeedManager().getSpeedState().targetSpeed).toBe(
        initialSpeed - (combosToComplete * DEFAULT_SPEED_CONFIG.speedIncrement)
      );
    });
  });

  describe('AC-4: Maximum speed cap enforcement', () => {
    /**
     * GIVEN maximum speed WHEN reached THEN speed increases stop at defined cap
     */
    it('should stop speed increases at defined maximum speed cap', () => {
      // GIVEN: Calculate how many combos needed to reach max speed
      const combosToMax = Math.ceil(
        (DEFAULT_SPEED_CONFIG.baseSpeed - DEFAULT_SPEED_CONFIG.maxSpeed) / 
        DEFAULT_SPEED_CONFIG.speedIncrement
      );

      // WHEN: Complete enough combos to reach and exceed max speed
      const extraCombos = 5;
      for (let i = 0; i < combosToMax + extraCombos; i++) {
        speedManager.onComboCompleted();
      }

      // THEN: Speed increases stop at defined cap
      expect(speedManager.getSpeedState().targetSpeed).toBe(DEFAULT_SPEED_CONFIG.maxSpeed);
      expect(speedManager.isAtMaxSpeed()).toBe(true);
      
      // Additional combos should not decrease speed further
      const maxTargetSpeed = speedManager.getSpeedState().targetSpeed;
      speedManager.onComboCompleted();
      expect(speedManager.getSpeedState().targetSpeed).toBe(maxTargetSpeed);
    });

    it('should maintain max speed cap through speed calculations', () => {
      // WHEN: Force speed manager to very high level
      for (let i = 0; i < 50; i++) {
        speedManager.onComboCompleted();
      }

      // THEN: Speed should never go below max speed
      expect(speedManager.getSpeedState().targetSpeed).toBeGreaterThanOrEqual(DEFAULT_SPEED_CONFIG.maxSpeed);
      expect(speedManager.getSpeedState().targetSpeed).toBe(DEFAULT_SPEED_CONFIG.maxSpeed);
    });

    it('should enforce max speed cap through game engine', () => {
      // GIVEN: Game engine with combo manager
      const comboManager = gameEngine.getComboManager();

      // WHEN: Complete many combos to exceed max speed
      for (let combo = 0; combo < 20; combo++) {
        [1, 2, 3, 4, 5].forEach(num => {
          comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
        });
      }

      // THEN: Game engine respects max speed cap
      expect(gameEngine.getSpeedManager().getSpeedState().targetSpeed).toBe(DEFAULT_SPEED_CONFIG.maxSpeed);
      expect(gameEngine.isAtMaxSpeed()).toBe(true);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle rapid combo completion and break cycles', () => {
      // GIVEN: Initial state
      expect(speedManager.getSpeedLevel()).toBe(0);

      // WHEN: Rapid combo completion and break cycle
      for (let cycle = 0; cycle < 3; cycle++) {
        // Complete combo
        speedManager.onComboCompleted();
        speedManager.onComboCompleted();
        
        // Break combo
        speedManager.onComboBreak();
      }

      // THEN: Should end at base speed
      expect(speedManager.getSpeedLevel()).toBe(0);
      expect(speedManager.getSpeedState().targetSpeed).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
    });

    it('should handle speed transitions correctly during gameplay', () => {
      // Use fake timers for controlled testing
      jest.useFakeTimers();

      // GIVEN: Start with combo completion
      speedManager.onComboCompleted();
      
      // WHEN: Speed is transitioning
      expect(speedManager.getSpeedState().isTransitioning).toBe(true);

      // THEN: Partial transition should show intermediate speed
      jest.advanceTimersByTime(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      speedManager.update(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      
      const midTransitionSpeed = speedManager.getCurrentSpeed();
      expect(midTransitionSpeed).toBeGreaterThan(speedManager.getSpeedState().targetSpeed);
      expect(midTransitionSpeed).toBeLessThan(DEFAULT_SPEED_CONFIG.baseSpeed);

      // Complete transition
      jest.advanceTimersByTime(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      speedManager.update(DEFAULT_SPEED_CONFIG.transitionDuration / 2);
      
      expect(speedManager.getSpeedState().isTransitioning).toBe(false);
      expect(speedManager.getCurrentSpeed()).toBe(speedManager.getSpeedState().targetSpeed);

      jest.useRealTimers();
    });

    it('should maintain speed consistency across reset operations', () => {
      // GIVEN: Some progression
      speedManager.onComboCompleted();
      speedManager.onComboCompleted();

      // WHEN: Reset operation
      speedManager.reset();

      // THEN: Should be back to initial state
      expect(speedManager.getSpeedLevel()).toBe(0);
      expect(speedManager.getCurrentSpeed()).toBe(DEFAULT_SPEED_CONFIG.baseSpeed);
      expect(speedManager.getSpeedState().isTransitioning).toBe(false);
    });

    it('should handle invalid speed configurations properly', () => {
      // GIVEN: Invalid configuration attempt
      const invalidConfig = {
        baseSpeed: -100,
        speedIncrement: 10,
        maxSpeed: 200,
        minSpeed: 50,
        transitionDuration: 500,
      };

      // THEN: Should throw error on invalid config
      expect(() => new SpeedManager(invalidConfig)).toThrow();
    });
  });

  describe('Integration with Combo Events', () => {
    it('should handle all combo event types correctly', () => {
      const mockComboEvents: ComboEvent[] = [
        {
          type: 'started',
          sequence: [1],
          progress: 1,
          totalPoints: 0,
          timestamp: Date.now(),
        },
        {
          type: 'progress',
          sequence: [1, 2, 3],
          progress: 3,
          totalPoints: 0,
          timestamp: Date.now(),
        },
        {
          type: 'completed',
          sequence: [1, 2, 3, 4, 5],
          progress: 5,
          totalPoints: 100,
          timestamp: Date.now(),
        },
        {
          type: 'broken',
          sequence: [1, 2],
          progress: 0,
          totalPoints: 0,
          timestamp: Date.now(),
        },
      ];

      let finalLevel = 0;

      // Process each event type
      mockComboEvents.forEach(event => {
        speedManager.handleComboEvent(event);
        
        switch (event.type) {
          case 'completed':
            finalLevel++;
            expect(speedManager.getSpeedLevel()).toBe(finalLevel);
            break;
          case 'broken':
            finalLevel = 0;
            expect(speedManager.getSpeedLevel()).toBe(0);
            break;
          case 'started':
          case 'progress':
            // Should not change speed level
            expect(speedManager.getSpeedLevel()).toBe(finalLevel);
            break;
        }
      });
    });
  });
});