import { ComboManager } from '../ComboManager';
import type { ComboState, ComboResult, ComboEvent } from '../../../types/Combo';
import { DEFAULT_COMBO_CONFIG, COMBO_SEQUENCE } from '../../../constants/ComboConfig';

describe('ComboManager', () => {
  let comboManager: ComboManager;
  let callbackEvents: ComboEvent[] = [];

  beforeEach(() => {
    comboManager = new ComboManager();
    callbackEvents = [];
    
    // Subscribe to combo events
    comboManager.subscribe((event) => {
      callbackEvents.push(event);
    });
  });

  afterEach(() => {
    comboManager.clearCallbacks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const state = comboManager.getCurrentState();
      
      expect(state.currentSequence).toEqual([]);
      expect(state.expectedNext).toBe(1);
      expect(state.comboProgress).toBe(0);
      expect(state.totalCombos).toBe(0);
      expect(state.isComboActive).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customConfig = { comboBonusPoints: 10 };
      const customComboManager = new ComboManager(customConfig);
      const debugInfo = customComboManager.getDebugInfo();
      
      expect(debugInfo.config.comboBonusPoints).toBe(10);
    });

    it('should validate initial state', () => {
      const validation = comboManager.validateState();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('Food Processing - Valid Sequence', () => {
    it('should process food number 1 correctly', () => {
      const result = comboManager.processFood(1);
      
      expect(result.type).toBe('progress');
      expect(result.pointsAwarded).toBe(0);
      expect(result.newState.currentSequence).toEqual([1]);
      expect(result.newState.expectedNext).toBe(2);
      expect(result.newState.comboProgress).toBe(1);
      expect(result.newState.isComboActive).toBe(true);
      expect(result.message).toBe('Combo progress: 1/5');
    });

    it('should progress through the full sequence 1→2→3→4→5', () => {
      const results: ComboResult[] = [];
      
      // Process sequence 1→2→3→4
      for (let i = 1; i <= 4; i++) {
        const result = comboManager.processFood(i as 1 | 2 | 3 | 4 | 5);
        results.push(result);
        
        expect(result.type).toBe('progress');
        expect(result.pointsAwarded).toBe(0);
        expect(result.newState.comboProgress).toBe(i);
        expect(result.newState.isComboActive).toBe(true);
      }
      
      // Process final food (5) - should complete combo
      const finalResult = comboManager.processFood(5);
      results.push(finalResult);
      
      expect(finalResult.type).toBe('complete');
      expect(finalResult.pointsAwarded).toBe(DEFAULT_COMBO_CONFIG.comboBonusPoints);
      expect(finalResult.newState.currentSequence).toEqual([]);
      expect(finalResult.newState.expectedNext).toBe(1);
      expect(finalResult.newState.comboProgress).toBe(0);
      expect(finalResult.newState.totalCombos).toBe(1);
      expect(finalResult.newState.isComboActive).toBe(false);
      expect(finalResult.message).toBe(`Combo completed! +${DEFAULT_COMBO_CONFIG.comboBonusPoints} bonus points`);
    });

    it('should allow multiple combo completions', () => {
      // Complete first combo
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });
      
      let state = comboManager.getCurrentState();
      expect(state.totalCombos).toBe(1);
      
      // Complete second combo
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });
      
      state = comboManager.getCurrentState();
      expect(state.totalCombos).toBe(2);
    });
  });

  describe('Food Processing - Invalid Sequence', () => {
    it('should break combo when wrong number is consumed', () => {
      // Start combo with 1, 2
      comboManager.processFood(1);
      comboManager.processFood(2);
      
      // Consume wrong number (4 instead of 3)
      const result = comboManager.processFood(4);
      
      expect(result.type).toBe('broken');
      expect(result.pointsAwarded).toBe(0);
      expect(result.newState.currentSequence).toEqual([]);
      expect(result.newState.expectedNext).toBe(1);
      expect(result.newState.comboProgress).toBe(0);
      expect(result.newState.isComboActive).toBe(false);
      expect(result.message).toBe('Combo broken! Sequence reset.');
    });

    it('should break combo when starting with wrong number', () => {
      const result = comboManager.processFood(3);
      
      expect(result.type).toBe('broken');
      expect(result.pointsAwarded).toBe(0);
      expect(result.newState.expectedNext).toBe(1);
      expect(result.newState.comboProgress).toBe(0);
      expect(result.newState.isComboActive).toBe(false);
    });

    it('should reset properly after combo break', () => {
      // Start and break combo
      comboManager.processFood(1);
      comboManager.processFood(3); // Wrong number
      
      // Should be able to start new combo
      const result = comboManager.processFood(1);
      
      expect(result.type).toBe('progress');
      expect(result.newState.comboProgress).toBe(1);
      expect(result.newState.isComboActive).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for invalid food numbers', () => {
      expect(() => comboManager.processFood(0 as 1 | 2 | 3 | 4 | 5)).toThrow('Invalid food number: 0. Must be 1-5.');
      expect(() => comboManager.processFood(6 as 1 | 2 | 3 | 4 | 5)).toThrow('Invalid food number: 6. Must be 1-5.');
      expect(() => comboManager.processFood(-1 as 1 | 2 | 3 | 4 | 5)).toThrow('Invalid food number: -1. Must be 1-5.');
      expect(() => comboManager.processFood(1.5 as 1 | 2 | 3 | 4 | 5)).toThrow('Invalid food number: 1.5. Must be 1-5.');
    });
  });

  describe('Event System', () => {
    it('should fire started event on first food', () => {
      comboManager.processFood(1);
      
      expect(callbackEvents).toHaveLength(1);
      expect(callbackEvents[0].type).toBe('started');
      expect(callbackEvents[0].sequence).toEqual([1]);
      expect(callbackEvents[0].progress).toBe(1);
    });

    it('should fire progress events during sequence', () => {
      [1, 2, 3].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });
      
      expect(callbackEvents).toHaveLength(3);
      expect(callbackEvents[0].type).toBe('started');
      expect(callbackEvents[1].type).toBe('progress');
      expect(callbackEvents[2].type).toBe('progress');
    });

    it('should fire completed event on combo completion', () => {
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });
      
      const completedEvent = callbackEvents.find(e => e.type === 'completed');
      expect(completedEvent).toBeDefined();
      expect(completedEvent!.totalPoints).toBe(DEFAULT_COMBO_CONFIG.comboBonusPoints);
    });

    it('should fire broken event on sequence break', () => {
      comboManager.processFood(1);
      comboManager.processFood(3); // Wrong number
      
      const brokenEvent = callbackEvents.find(e => e.type === 'broken');
      expect(brokenEvent).toBeDefined();
      expect(brokenEvent!.totalPoints).toBe(0);
    });

    it('should handle callback errors gracefully', () => {
      comboManager.subscribe(() => {
        throw new Error('Test callback error');
      });
      
      // Should not throw
      expect(() => comboManager.processFood(1)).not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      // Complete one combo
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });
      
      // Start another combo and break it
      comboManager.processFood(1);
      comboManager.processFood(2);
      comboManager.processFood(4); // Break
      
      const stats = comboManager.getStatistics();
      
      expect(stats.totalCombos).toBe(1);
      expect(stats.totalBonusPoints).toBe(DEFAULT_COMBO_CONFIG.comboBonusPoints);
      expect(stats.currentProgress).toBe(0); // Broken combo resets progress
      expect(stats.totalFoodConsumed).toBe(5); // Only completed and progress events count
    });

    it('should calculate longest sequence correctly', () => {
      // Start combo and break it at 3
      [1, 2, 3, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });
      
      const stats = comboManager.getStatistics();
      expect(stats.longestSequence).toBe(3); // Longest valid sequence
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      // Make some progress
      comboManager.processFood(1);
      comboManager.processFood(2);
      
      comboManager.reset();
      
      const state = comboManager.getCurrentState();
      expect(state.currentSequence).toEqual([]);
      expect(state.expectedNext).toBe(1);
      expect(state.comboProgress).toBe(0);
      expect(state.totalCombos).toBe(0);
      expect(state.isComboActive).toBe(false);
    });

    it('should clear event history on reset', () => {
      comboManager.processFood(1);
      expect(comboManager.getEventHistory()).toHaveLength(1);
      
      comboManager.reset();
      expect(comboManager.getEventHistory()).toHaveLength(1); // Reset event
    });
  });

  describe('Data Persistence', () => {
    it('should export and import data correctly', () => {
      // Make some progress
      [1, 2, 3].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });
      
      const exportedData = comboManager.exportData();
      
      expect(exportedData.state.comboProgress).toBe(3);
      expect(exportedData.eventHistory).toHaveLength(3);
      
      // Create new manager and import
      const newManager = new ComboManager();
      newManager.importData({
        state: exportedData.state,
        eventHistory: exportedData.eventHistory,
      });
      
      const importedState = newManager.getCurrentState();
      expect(importedState.comboProgress).toBe(3);
      expect(importedState.expectedNext).toBe(4);
      expect(newManager.getEventHistory()).toHaveLength(3);
    });
  });

  describe('State Validation', () => {
    it('should validate consistent state', () => {
      comboManager.processFood(1);
      comboManager.processFood(2);
      
      const validation = comboManager.validateState();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should detect state inconsistencies through manual state manipulation', () => {
      // This tests the validation logic by creating an invalid state through import
      const invalidState: ComboState = {
        currentSequence: [1, 2],
        expectedNext: 5, // Should be 3
        comboProgress: 2,
        totalCombos: 0,
        isComboActive: true,
      };
      
      comboManager.importData({
        state: invalidState,
        eventHistory: [],
      });
      
      const validation = comboManager.validateState();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Expected next number mismatch: got 5, expected 3');
    });
  });

  describe('Debug Information', () => {
    it('should provide comprehensive debug info', () => {
      const debugInfo = comboManager.getDebugInfo();
      
      expect(debugInfo.state).toBeDefined();
      expect(debugInfo.config).toBeDefined();
      expect(debugInfo.callbackCount).toBe(1); // One callback from beforeEach
      expect(debugInfo.eventCount).toBe(0);
      expect(debugInfo.expectedSequence).toEqual(COMBO_SEQUENCE);
    });
  });

  describe('Subscription Management', () => {
    it('should allow unsubscribing from events', () => {
      let eventCount = 0;
      const unsubscribe = comboManager.subscribe(() => {
        eventCount++;
      });
      
      comboManager.processFood(1);
      expect(eventCount).toBe(1);
      
      unsubscribe();
      comboManager.processFood(2);
      expect(eventCount).toBe(1); // Should not increment
    });

    it('should clear all callbacks', () => {
      comboManager.subscribe(() => {});
      comboManager.subscribe(() => {});
      
      expect(comboManager.getDebugInfo().callbackCount).toBe(3); // 2 + 1 from beforeEach
      
      comboManager.clearCallbacks();
      expect(comboManager.getDebugInfo().callbackCount).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid consecutive calls', () => {
      const results = [1, 2, 3, 4, 5].map(num => 
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5)
      );
      
      expect(results[4].type).toBe('complete');
      expect(results[4].pointsAwarded).toBe(DEFAULT_COMBO_CONFIG.comboBonusPoints);
    });

    it('should maintain state consistency after multiple operations', () => {
      // Complex sequence of operations
      comboManager.processFood(1);
      comboManager.processFood(2);
      comboManager.processFood(5); // Break
      comboManager.processFood(1);
      comboManager.processFood(2);
      comboManager.processFood(3);
      comboManager.processFood(4);
      comboManager.processFood(5); // Complete
      
      const state = comboManager.getCurrentState();
      expect(state.totalCombos).toBe(1);
      expect(state.comboProgress).toBe(0);
      expect(state.isComboActive).toBe(false);
      
      const validation = comboManager.validateState();
      expect(validation.isValid).toBe(true);
    });

    it('should handle maximum event history limit', () => {
      // Create more than 1000 events to test history limit
      for (let i = 0; i < 250; i++) {
        [1, 2, 3, 4, 5].forEach(num => {
          comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
        });
      }
      
      const history = comboManager.getEventHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Acceptance Criteria Validation', () => {
    it('GIVEN player eats food blocks in sequence 1→2→3→4→5 WHEN sequence completes THEN combo bonus of 5 points is awarded', () => {
      let totalBonusPoints = 0;
      comboManager.subscribe((event) => {
        if (event.type === 'completed') {
          totalBonusPoints += event.totalPoints;
        }
      });
      
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });
      
      expect(totalBonusPoints).toBe(5);
    });

    it('GIVEN player eating food blocks in correct sequence WHEN next correct number eaten THEN combo progress advances', () => {
      comboManager.processFood(1);
      expect(comboManager.getCurrentState().comboProgress).toBe(1);
      
      comboManager.processFood(2);
      expect(comboManager.getCurrentState().comboProgress).toBe(2);
      
      comboManager.processFood(3);
      expect(comboManager.getCurrentState().comboProgress).toBe(3);
    });

    it('GIVEN player eating food blocks WHEN wrong number in sequence eaten THEN combo progress resets to 0', () => {
      comboManager.processFood(1);
      comboManager.processFood(2);
      expect(comboManager.getCurrentState().comboProgress).toBe(2);
      
      comboManager.processFood(4); // Wrong number
      expect(comboManager.getCurrentState().comboProgress).toBe(0);
    });

    it('GIVEN combo completion WHEN achieved THEN new combo tracking begins immediately', () => {
      // Complete first combo
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });
      
      const state = comboManager.getCurrentState();
      expect(state.totalCombos).toBe(1);
      expect(state.comboProgress).toBe(0);
      expect(state.expectedNext).toBe(1);
      expect(state.isComboActive).toBe(false);
      
      // Start new combo immediately
      const result = comboManager.processFood(1);
      expect(result.type).toBe('progress');
      expect(result.newState.comboProgress).toBe(1);
    });
  });
});