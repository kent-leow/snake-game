/**
 * @jest-environment jsdom
 */

import {
  StateTransitionManager,
  StateTransitionAction,
} from '../stateTransitions';
import { GameStateManager, GameStateEnum } from '../gameState';

describe('StateTransitionManager', () => {
  let gameStateManager: GameStateManager;
  let transitionManager: StateTransitionManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager();
    transitionManager = new StateTransitionManager(gameStateManager);
  });

  afterEach(() => {
    transitionManager.clearHistory();
  });

  describe('Action Execution', () => {
    it('should execute START_GAME action from MENU', () => {
      const result = transitionManager.executeAction(StateTransitionAction.START_GAME);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe(GameStateEnum.MENU);
      expect(result.toState).toBe(GameStateEnum.PLAYING);
      expect(result.action).toBe(StateTransitionAction.START_GAME);
      expect(result.error).toBeUndefined();
    });

    it('should execute PAUSE_GAME action from PLAYING', () => {
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      const result = transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe(GameStateEnum.PLAYING);
      expect(result.toState).toBe(GameStateEnum.PAUSED);
    });

    it('should execute RESUME_GAME action from PAUSED', () => {
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);
      const result = transitionManager.executeAction(StateTransitionAction.RESUME_GAME);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe(GameStateEnum.PAUSED);
      expect(result.toState).toBe(GameStateEnum.PLAYING);
    });

    it('should reject invalid actions', () => {
      // Cannot pause from MENU
      const result = transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);
      
      expect(result.success).toBe(false);
      expect(result.fromState).toBe(GameStateEnum.MENU);
      expect(result.toState).toBe(GameStateEnum.MENU);
      expect(result.error).toContain('not allowed from state');
    });

    it('should handle RESTART_GAME action', async () => {
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      const result = transitionManager.executeAction(StateTransitionAction.RESTART_GAME);
      
      expect(result.success).toBe(true);
      expect(result.toState).toBe(GameStateEnum.MENU);
      
      // Wait for automatic start after restart
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(gameStateManager.getCurrentState()).toBe(GameStateEnum.PLAYING);
    });

    it('should execute GO_TO_MENU from any state', () => {
      // From PLAYING
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      let result = transitionManager.executeAction(StateTransitionAction.GO_TO_MENU);
      expect(result.success).toBe(true);
      expect(result.toState).toBe(GameStateEnum.MENU);

      // From PAUSED
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);
      result = transitionManager.executeAction(StateTransitionAction.GO_TO_MENU);
      expect(result.success).toBe(true);
      expect(result.toState).toBe(GameStateEnum.MENU);
    });
  });

  describe('Action Availability', () => {
    it('should correctly identify available actions from MENU', () => {
      const availableActions = transitionManager.getAvailableActions();
      expect(availableActions).toContain(StateTransitionAction.START_GAME);
      expect(availableActions).toContain(StateTransitionAction.LOAD_GAME);
      expect(availableActions).not.toContain(StateTransitionAction.PAUSE_GAME);
    });

    it('should correctly identify available actions from PLAYING', () => {
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      const availableActions = transitionManager.getAvailableActions();
      
      expect(availableActions).toContain(StateTransitionAction.PAUSE_GAME);
      expect(availableActions).toContain(StateTransitionAction.END_GAME);
      expect(availableActions).toContain(StateTransitionAction.GO_TO_MENU);
      expect(availableActions).toContain(StateTransitionAction.RESTART_GAME);
      expect(availableActions).not.toContain(StateTransitionAction.RESUME_GAME);
    });

    it('should correctly identify available actions from PAUSED', () => {
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);
      const availableActions = transitionManager.getAvailableActions();
      
      expect(availableActions).toContain(StateTransitionAction.RESUME_GAME);
      expect(availableActions).toContain(StateTransitionAction.END_GAME);
      expect(availableActions).toContain(StateTransitionAction.GO_TO_MENU);
      expect(availableActions).not.toContain(StateTransitionAction.PAUSE_GAME);
    });

    it('should check specific action availability', () => {
      // From MENU
      expect(transitionManager.isActionAvailable(StateTransitionAction.START_GAME)).toBe(true);
      expect(transitionManager.isActionAvailable(StateTransitionAction.PAUSE_GAME)).toBe(false);

      // From PLAYING
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      expect(transitionManager.isActionAvailable(StateTransitionAction.PAUSE_GAME)).toBe(true);
      expect(transitionManager.isActionAvailable(StateTransitionAction.RESUME_GAME)).toBe(false);
    });
  });

  describe('Available States', () => {
    it('should return available target states from current state', () => {
      // From MENU
      let availableStates = transitionManager.getAvailableStates();
      expect(availableStates).toContain(GameStateEnum.PLAYING);
      expect(availableStates).toContain(GameStateEnum.LOADING);
      expect(availableStates).not.toContain(GameStateEnum.PAUSED);

      // From PLAYING
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      availableStates = transitionManager.getAvailableStates();
      expect(availableStates).toContain(GameStateEnum.PAUSED);
      expect(availableStates).toContain(GameStateEnum.GAME_OVER);
      expect(availableStates).toContain(GameStateEnum.MENU);
    });
  });

  describe('Transition History', () => {
    it('should track transition history', () => {
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);
      transitionManager.executeAction(StateTransitionAction.RESUME_GAME);

      const history = transitionManager.getTransitionHistory();
      expect(history).toHaveLength(3);
      
      expect(history[0].action).toBe(StateTransitionAction.START_GAME);
      expect(history[1].action).toBe(StateTransitionAction.PAUSE_GAME);
      expect(history[2].action).toBe(StateTransitionAction.RESUME_GAME);
    });

    it('should clear transition history', () => {
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);
      
      expect(transitionManager.getTransitionHistory()).toHaveLength(2);
      
      transitionManager.clearHistory();
      expect(transitionManager.getTransitionHistory()).toHaveLength(0);
    });

    it('should limit history size', () => {
      // Execute many transitions
      for (let i = 0; i < 150; i++) {
        if (i % 2 === 0) {
          transitionManager.executeAction(StateTransitionAction.START_GAME);
        } else {
          transitionManager.executeAction(StateTransitionAction.GO_TO_MENU);
        }
      }

      const history = transitionManager.getTransitionHistory();
      expect(history.length).toBeLessThanOrEqual(100); // Should be trimmed
    });
  });

  describe('Validation Rules', () => {
    it('should validate current state consistency', () => {
      const validation = transitionManager.validateCurrentState();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should add and use custom validation rules', () => {
      let customRuleCalled = false;
      const customRule = (_from: GameStateEnum, to: GameStateEnum) => {
        customRuleCalled = true;
        // Deny all transitions to PLAYING
        return to !== GameStateEnum.PLAYING;
      };

      transitionManager.addValidationRule(customRule);
      
      const result = transitionManager.executeAction(StateTransitionAction.START_GAME);
      expect(customRuleCalled).toBe(true);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Custom validation failed');
    });

    it('should clear custom validation rules', () => {
      const customRule = () => false; // Deny all transitions
      transitionManager.addValidationRule(customRule);
      
      // Should fail with custom rule
      let result = transitionManager.executeAction(StateTransitionAction.START_GAME);
      expect(result.success).toBe(false);

      transitionManager.clearValidationRules();
      
      // Should succeed after clearing rules
      result = transitionManager.executeAction(StateTransitionAction.START_GAME);
      expect(result.success).toBe(true);
    });
  });

  describe('Configuration Management', () => {
    it('should update transition rules', () => {
      // Mock the GameStateManager's transitionTo method for this test
      const originalTransitionTo = gameStateManager.transitionTo;
      gameStateManager.transitionTo = jest.fn().mockReturnValue(true);
      
      const originalRules = transitionManager.getRules();
      const newRules = {
        allowedTransitions: {
          ...originalRules.allowedTransitions,
          [GameStateEnum.MENU]: [...originalRules.allowedTransitions[GameStateEnum.MENU], GameStateEnum.GAME_OVER],
        },
        actionMapping: {
          ...originalRules.actionMapping,
          [StateTransitionAction.END_GAME]: {
            from: [GameStateEnum.PLAYING, GameStateEnum.PAUSED, GameStateEnum.MENU],
            to: GameStateEnum.GAME_OVER,
          },
        },
      };

      transitionManager.updateRules(newRules);
      
      // Should now allow direct transition to GAME_OVER from MENU
      const result = transitionManager.executeAction(StateTransitionAction.END_GAME);
      expect(result.success).toBe(true);
      expect(result.toState).toBe(GameStateEnum.GAME_OVER);
      
      // Restore original method
      gameStateManager.transitionTo = originalTransitionTo;
    });

    it('should reset rules to default', () => {
      // Modify rules to be restrictive
      const originalRules = transitionManager.getRules();
      const restrictiveRules = {
        allowedTransitions: {
          ...originalRules.allowedTransitions,
          [GameStateEnum.MENU]: [], // No transitions allowed from MENU
        },
      };
      
      transitionManager.updateRules(restrictiveRules);

      // Should not work with modified rules
      let result = transitionManager.executeAction(StateTransitionAction.START_GAME);
      expect(result.success).toBe(false);

      // Reset to default
      transitionManager.resetRules();
      
      // Should work with default rules
      result = transitionManager.executeAction(StateTransitionAction.START_GAME);
      expect(result.success).toBe(true);
    });

    it('should get current rules configuration', () => {
      const rules = transitionManager.getRules();
      
      expect(rules.allowedTransitions).toBeDefined();
      expect(rules.actionMapping).toBeDefined();
      expect(rules.validationRules).toBeDefined();
      expect(Array.isArray(rules.validationRules)).toBe(true);
    });
  });

  describe('Export and State Management', () => {
    it('should export transition system state', () => {
      transitionManager.executeAction(StateTransitionAction.START_GAME);
      transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);

      const exportedState = transitionManager.exportState();
      
      expect(exportedState.currentState).toBe(GameStateEnum.PAUSED);
      expect(exportedState.transitionHistory).toHaveLength(2);
      expect(exportedState.availableActions).toContain(StateTransitionAction.RESUME_GAME);
      expect(exportedState.rules).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid action execution', () => {
      expect(() => {
        transitionManager.executeAction(StateTransitionAction.START_GAME);
        transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);
        transitionManager.executeAction(StateTransitionAction.RESUME_GAME);
        transitionManager.executeAction(StateTransitionAction.END_GAME);
        transitionManager.executeAction(StateTransitionAction.GO_TO_MENU);
      }).not.toThrow();
    });

    it('should handle invalid action gracefully', () => {
      // Try to execute action that doesn't exist in enum (mock scenario)
      const result = transitionManager.executeAction('INVALID_ACTION' as StateTransitionAction);
      expect(result.success).toBe(false);
    });

    it('should maintain consistency after failed transitions', () => {
      const initialState = gameStateManager.getCurrentState();
      
      // Try invalid transition
      transitionManager.executeAction(StateTransitionAction.PAUSE_GAME);
      
      expect(gameStateManager.getCurrentState()).toBe(initialState);
    });

    it('should handle state validation errors', () => {
      // This would require manipulating internal state which might not be possible
      // But we can test the validation method exists and works
      const validation = transitionManager.validateCurrentState();
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
    });
  });
});