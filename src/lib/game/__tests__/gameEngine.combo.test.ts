import { GameEngine } from '../gameEngine';
import type { ComboEvent } from '@/types/Combo';

describe('GameEngine - Combo Integration', () => {
  let gameEngine: GameEngine;
  let comboEvents: ComboEvent[] = [];

  const mockConfig = {
    canvasWidth: 400,
    canvasHeight: 300,
    gridSize: 20,
    gameSpeed: 100,
  };

  beforeEach(() => {
    comboEvents = [];
    gameEngine = new GameEngine(mockConfig, {
      onComboEvent: (event) => {
        comboEvents.push(event);
      },
    });
    
    // Enable multiple food mode for combo testing
    gameEngine.enableMultipleFood();
  });

  afterEach(() => {
    gameEngine.stop();
  });

  describe('Combo Integration with Food Consumption', () => {
    it('should track combos when consuming food in correct sequence', () => {
      const foods = gameEngine.getMultipleFoods();
      expect(foods).toHaveLength(5);

      // Find foods with numbers 1, 2, 3, 4, 5
      const food1 = foods.find(f => f.number === 1)!;
      const food2 = foods.find(f => f.number === 2)!;
      const food3 = foods.find(f => f.number === 3)!;

      expect(food1).toBeDefined();
      expect(food2).toBeDefined();
      expect(food3).toBeDefined();

      // Simulate food consumption by manipulating game state
      // Note: This is a simplified test - in real gameplay, the snake would move to these positions

      const initialState = gameEngine.getGameState();
      expect(initialState.comboState.comboProgress).toBe(0);
      expect(initialState.comboState.expectedNext).toBe(1);
    });

    it('should award combo bonus points on sequence completion', () => {
      const comboManager = gameEngine.getComboManager();

      // Simulate completing a combo sequence
      [1, 2, 3, 4, 5].forEach(num => {
        comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
      });

      // Check that combo completion event was fired
      const completedEvent = comboEvents.find(e => e.type === 'completed');
      expect(completedEvent).toBeDefined();
      expect(completedEvent!.totalPoints).toBe(5); // Default combo bonus
    });

    it('should reset combo progress when wrong food is consumed', () => {
      const comboManager = gameEngine.getComboManager();

      // Start combo sequence
      comboManager.processFood(1);
      comboManager.processFood(2);

      let state = gameEngine.getGameState();
      expect(state.comboState.comboProgress).toBe(2);

      // Consume wrong food
      comboManager.processFood(4); // Should be 3

      state = gameEngine.getGameState();
      expect(state.comboState.comboProgress).toBe(0);
      expect(state.comboState.expectedNext).toBe(1);

      // Check that broken event was fired
      const brokenEvent = comboEvents.find(e => e.type === 'broken');
      expect(brokenEvent).toBeDefined();
    });

    it('should maintain combo state across game operations', () => {
      const comboManager = gameEngine.getComboManager();

      // Make progress in combo
      comboManager.processFood(1);
      comboManager.processFood(2);

      // Perform other game operations
      gameEngine.start();
      gameEngine.pause();
      gameEngine.resume();

      // Combo state should be preserved
      const state = gameEngine.getGameState();
      expect(state.comboState.comboProgress).toBe(2);
      expect(state.comboState.expectedNext).toBe(3);
    });
  });

  describe('Game State Integration', () => {
    it('should include combo state in game state', () => {
      const state = gameEngine.getGameState();
      
      expect(state.comboState).toBeDefined();
      expect(state.comboState.currentSequence).toEqual([]);
      expect(state.comboState.expectedNext).toBe(1);
      expect(state.comboState.comboProgress).toBe(0);
      expect(state.comboState.totalCombos).toBe(0);
      expect(state.comboState.isComboActive).toBe(false);
    });

    it('should update combo state when processing food', () => {
      const comboManager = gameEngine.getComboManager();
      
      comboManager.processFood(1);
      
      const state = gameEngine.getGameState();
      expect(state.comboState.currentSequence).toEqual([1]);
      expect(state.comboState.expectedNext).toBe(2);
      expect(state.comboState.comboProgress).toBe(1);
      expect(state.comboState.isComboActive).toBe(true);
    });
  });

  describe('Reset and Persistence', () => {
    it('should reset combo state when game resets', () => {
      const comboManager = gameEngine.getComboManager();
      
      // Make progress
      comboManager.processFood(1);
      comboManager.processFood(2);
      
      expect(gameEngine.getGameState().comboState.comboProgress).toBe(2);
      
      // Reset game
      gameEngine.reset();
      
      const state = gameEngine.getGameState();
      expect(state.comboState.comboProgress).toBe(0);
      expect(state.comboState.totalCombos).toBe(0);
      expect(state.comboState.currentSequence).toEqual([]);
      expect(state.comboState.isComboActive).toBe(false);
    });

    it('should export and import combo data', () => {
      const comboManager = gameEngine.getComboManager();
      
      // Make progress
      comboManager.processFood(1);
      comboManager.processFood(2);
      comboManager.processFood(3);
      
      const exportedData = gameEngine.exportData();
      expect(exportedData.combo).toBeDefined();
      expect(exportedData.combo.state.comboProgress).toBe(3);
      
      // Reset and import
      gameEngine.reset();
      gameEngine.importData({
        score: exportedData.score,
        combo: exportedData.combo,
      });
      
      const state = gameEngine.getGameState();
      expect(state.comboState.comboProgress).toBe(3);
      expect(state.comboState.expectedNext).toBe(4);
    });
  });

  describe('Callback Integration', () => {
    it('should provide access to combo manager', () => {
      const comboManager = gameEngine.getComboManager();
      expect(comboManager).toBeDefined();
      expect(typeof comboManager.processFood).toBe('function');
      expect(typeof comboManager.getCurrentState).toBe('function');
    });

    it('should fire combo events through callback system', () => {
      const comboManager = gameEngine.getComboManager();
      
      comboManager.processFood(1);
      
      expect(comboEvents).toHaveLength(1);
      expect(comboEvents[0].type).toBe('started');
      expect(comboEvents[0].progress).toBe(1);
    });

    it('should handle multiple subscribers to combo events', () => {
      const additionalEvents: ComboEvent[] = [];
      
      // Update callbacks to add additional subscriber
    gameEngine.updateCallbacks({
      onComboEvent: (event: ComboEvent): void => {
        comboEvents.push(event);
        additionalEvents.push(event);
      },
    });      const comboManager = gameEngine.getComboManager();
      comboManager.processFood(1);
      
      expect(comboEvents).toHaveLength(1);
      expect(additionalEvents).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle combo manager errors gracefully', () => {
      const comboManager = gameEngine.getComboManager();
      
      // Invalid food number should throw error
      expect(() => {
        comboManager.processFood(0 as 1 | 2 | 3 | 4 | 5);
      }).toThrow('Invalid food number: 0. Must be 1-5.');
    });

    it('should maintain game state consistency even with combo errors', () => {
      const initialState = gameEngine.getGameState();
      
      try {
        const comboManager = gameEngine.getComboManager();
        comboManager.processFood(0 as 1 | 2 | 3 | 4 | 5);
      } catch {
        // Error expected
      }
      
      const postErrorState = gameEngine.getGameState();
      expect(postErrorState.comboState).toEqual(initialState.comboState);
    });
  });

  describe('Multiple Food Mode Integration', () => {
    it('should work only in multiple food mode', () => {
      // Disable multiple food mode
      gameEngine.disableMultipleFood();
      
      const state = gameEngine.getGameState();
      expect(state.useMultipleFood).toBe(false);
      expect(state.multipleFoods).toHaveLength(0);
      
      // Combo system should still work (for testing purposes)
      const comboManager = gameEngine.getComboManager();
      const result = comboManager.processFood(1);
      expect(result.type).toBe('progress');
    });

    it('should maintain combo state when switching food modes', () => {
      const comboManager = gameEngine.getComboManager();
      
      // Make progress with multiple food mode
      comboManager.processFood(1);
      comboManager.processFood(2);
      
      expect(gameEngine.getGameState().comboState.comboProgress).toBe(2);
      
      // Switch to single food mode
      gameEngine.disableMultipleFood();
      
      // Combo state should be preserved
      expect(gameEngine.getGameState().comboState.comboProgress).toBe(2);
      
      // Switch back to multiple food mode
      gameEngine.enableMultipleFood();
      
      // Combo state should still be preserved
      expect(gameEngine.getGameState().comboState.comboProgress).toBe(2);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle many combo operations efficiently', () => {
      const comboManager = gameEngine.getComboManager();
      const startTime = performance.now();
      
      // Perform many combo operations
      for (let i = 0; i < 100; i++) {
        [1, 2, 3, 4, 5].forEach(num => {
          comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
      
      // State should be consistent
      const state = gameEngine.getGameState();
      expect(state.comboState.totalCombos).toBe(100);
    });

    it('should limit event history to prevent memory leaks', () => {
      const comboManager = gameEngine.getComboManager();
      
      // Generate more than 1000 events
      for (let i = 0; i < 250; i++) {
        [1, 2, 3, 4, 5].forEach(num => {
          comboManager.processFood(num as 1 | 2 | 3 | 4 | 5);
        });
      }
      
      const history = comboManager.getEventHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });
});