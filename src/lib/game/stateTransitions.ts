/**
 * Game State Transitions System
 * Provides structured state transition management with validation and callbacks
 */

import { GameStateEnum, type GameStateManager } from './gameState';

/**
 * State transition actions that can be performed
 */
export enum StateTransitionAction {
  START_GAME = 'START_GAME',
  PAUSE_GAME = 'PAUSE_GAME',
  RESUME_GAME = 'RESUME_GAME',
  END_GAME = 'END_GAME',
  RESTART_GAME = 'RESTART_GAME',
  GO_TO_MENU = 'GO_TO_MENU',
  LOAD_GAME = 'LOAD_GAME',
}

/**
 * State transition result interface
 */
export interface StateTransitionResult {
  success: boolean;
  fromState: GameStateEnum;
  toState: GameStateEnum;
  action: StateTransitionAction;
  error?: string;
  timestamp: number;
}

/**
 * State transition rules configuration
 */
export interface StateTransitionRules {
  allowedTransitions: Record<GameStateEnum, GameStateEnum[]>;
  actionMapping: Record<StateTransitionAction, {
    from: GameStateEnum[];
    to: GameStateEnum;
  }>;
  validationRules: Array<(from: GameStateEnum, to: GameStateEnum) => boolean>;
}

/**
 * State transition manager class
 */
export class StateTransitionManager {
  private gameStateManager: GameStateManager;
  private transitionHistory: StateTransitionResult[] = [];
  private rules: StateTransitionRules;

  constructor(gameStateManager: GameStateManager) {
    this.gameStateManager = gameStateManager;
    this.rules = this.createDefaultRules();
  }

  /**
   * Create default transition rules
   */
  private createDefaultRules(): StateTransitionRules {
    return {
      allowedTransitions: {
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
      },
      actionMapping: {
        [StateTransitionAction.START_GAME]: {
          from: [GameStateEnum.MENU, GameStateEnum.LOADING],
          to: GameStateEnum.PLAYING,
        },
        [StateTransitionAction.PAUSE_GAME]: {
          from: [GameStateEnum.PLAYING],
          to: GameStateEnum.PAUSED,
        },
        [StateTransitionAction.RESUME_GAME]: {
          from: [GameStateEnum.PAUSED],
          to: GameStateEnum.PLAYING,
        },
        [StateTransitionAction.END_GAME]: {
          from: [GameStateEnum.PLAYING, GameStateEnum.PAUSED],
          to: GameStateEnum.GAME_OVER,
        },
        [StateTransitionAction.RESTART_GAME]: {
          from: [GameStateEnum.GAME_OVER, GameStateEnum.PLAYING, GameStateEnum.PAUSED],
          to: GameStateEnum.PLAYING,
        },
        [StateTransitionAction.GO_TO_MENU]: {
          from: [
            GameStateEnum.PLAYING,
            GameStateEnum.PAUSED,
            GameStateEnum.GAME_OVER,
            GameStateEnum.LOADING,
          ],
          to: GameStateEnum.MENU,
        },
        [StateTransitionAction.LOAD_GAME]: {
          from: [GameStateEnum.MENU],
          to: GameStateEnum.LOADING,
        },
      },
      validationRules: [
        // Add custom validation rules here if needed
      ],
    };
  }

  /**
   * Execute a state transition action
   */
  public executeAction(action: StateTransitionAction): StateTransitionResult {
    const currentState = this.gameStateManager.getCurrentState();
    const actionRule = this.rules.actionMapping[action];

    // Validate action is possible from current state
    if (!actionRule.from.includes(currentState)) {
      const result: StateTransitionResult = {
        success: false,
        fromState: currentState,
        toState: currentState,
        action,
        error: `Action ${action} not allowed from state ${currentState}`,
        timestamp: Date.now(),
      };
      this.addToHistory(result);
      return result;
    }

    const targetState = actionRule.to;

    // Special handling for restart action
    if (action === StateTransitionAction.RESTART_GAME) {
      return this.handleRestartAction(currentState);
    }

    // Execute the transition
    const transitionResult = this.executeTransition(currentState, targetState, action);
    this.addToHistory(transitionResult);
    return transitionResult;
  }

  /**
   * Handle restart action with special logic
   */
  private handleRestartAction(currentState: GameStateEnum): StateTransitionResult {
    // First go to menu, then start playing
    const menuTransition = this.executeTransition(
      currentState,
      GameStateEnum.MENU,
      StateTransitionAction.RESTART_GAME
    );

    if (menuTransition.success) {
      // Small delay to ensure proper state cleanup
      setTimeout(() => {
        this.executeTransition(
          GameStateEnum.MENU,
          GameStateEnum.PLAYING,
          StateTransitionAction.START_GAME
        );
      }, 100);
    }

    return menuTransition;
  }

  /**
   * Execute a direct state transition
   */
  private executeTransition(
    fromState: GameStateEnum,
    toState: GameStateEnum,
    action: StateTransitionAction
  ): StateTransitionResult {
    // Validate transition is allowed
    if (!this.isTransitionAllowed(fromState, toState)) {
      return {
        success: false,
        fromState,
        toState: fromState,
        action,
        error: `Transition from ${fromState} to ${toState} not allowed`,
        timestamp: Date.now(),
      };
    }

    // Execute custom validation rules
    const validationError = this.validateTransition(fromState, toState);
    if (validationError) {
      return {
        success: false,
        fromState,
        toState: fromState,
        action,
        error: validationError,
        timestamp: Date.now(),
      };
    }

    // Attempt the transition
    const success = this.gameStateManager.transitionTo(toState);

    const result: StateTransitionResult = {
      success,
      fromState,
      toState: success ? toState : fromState,
      action,
      timestamp: Date.now(),
    };

    if (!success) {
      result.error = 'State manager rejected transition';
    }

    return result;
  }

  /**
   * Check if transition is allowed by rules
   */
  private isTransitionAllowed(from: GameStateEnum, to: GameStateEnum): boolean {
    const allowedStates = this.rules.allowedTransitions[from] || [];
    return allowedStates.includes(to);
  }

  /**
   * Run custom validation rules
   */
  private validateTransition(from: GameStateEnum, to: GameStateEnum): string | null {
    for (const rule of this.rules.validationRules) {
      if (!rule(from, to)) {
        return `Custom validation failed for transition ${from} -> ${to}`;
      }
    }
    return null;
  }

  /**
   * Add transition result to history
   */
  private addToHistory(result: StateTransitionResult): void {
    this.transitionHistory.push(result);
    
    // Keep history size manageable
    if (this.transitionHistory.length > 100) {
      this.transitionHistory = this.transitionHistory.slice(-50);
    }
  }

  /**
   * Get transition history
   */
  public getTransitionHistory(): StateTransitionResult[] {
    return [...this.transitionHistory];
  }

  /**
   * Clear transition history
   */
  public clearHistory(): void {
    this.transitionHistory = [];
  }

  /**
   * Get available actions from current state
   */
  public getAvailableActions(): StateTransitionAction[] {
    const currentState = this.gameStateManager.getCurrentState();
    const availableActions: StateTransitionAction[] = [];

    for (const [action, rule] of Object.entries(this.rules.actionMapping)) {
      if (rule.from.includes(currentState)) {
        availableActions.push(action as StateTransitionAction);
      }
    }

    return availableActions;
  }

  /**
   * Check if specific action is available
   */
  public isActionAvailable(action: StateTransitionAction): boolean {
    const currentState = this.gameStateManager.getCurrentState();
    const actionRule = this.rules.actionMapping[action];
    return actionRule ? actionRule.from.includes(currentState) : false;
  }

  /**
   * Get all possible target states from current state
   */
  public getAvailableStates(): GameStateEnum[] {
    const currentState = this.gameStateManager.getCurrentState();
    return this.rules.allowedTransitions[currentState] || [];
  }

  /**
   * Add custom validation rule
   */
  public addValidationRule(rule: (from: GameStateEnum, to: GameStateEnum) => boolean): void {
    this.rules.validationRules.push(rule);
  }

  /**
   * Remove all custom validation rules
   */
  public clearValidationRules(): void {
    this.rules.validationRules = [];
  }

  /**
   * Update transition rules (for testing or custom configurations)
   */
  public updateRules(newRules: Partial<StateTransitionRules>): void {
    this.rules = { ...this.rules, ...newRules };
  }

  /**
   * Reset rules to default
   */
  public resetRules(): void {
    this.rules = this.createDefaultRules();
  }

  /**
   * Get current rules configuration
   */
  public getRules(): StateTransitionRules {
    return { ...this.rules };
  }

  /**
   * Validate current state consistency
   */
  public validateCurrentState(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const currentState = this.gameStateManager.getCurrentState();
    const gameData = this.gameStateManager.getGameData();

    // Check state consistency
    if (gameData.state !== currentState) {
      errors.push(`State mismatch: manager=${currentState}, data=${gameData.state}`);
    }

    // Check state-specific validations
    switch (currentState) {
      case GameStateEnum.PLAYING:
        if (gameData.gameStartTime === 0) {
          errors.push('Playing state should have gameStartTime set');
        }
        break;

      case GameStateEnum.PAUSED:
        if (gameData.pausedTime === 0) {
          errors.push('Paused state should have pausedTime set');
        }
        break;

      case GameStateEnum.GAME_OVER:
        if (gameData.gameStats.duration === 0 && gameData.gameStartTime > 0) {
          errors.push('Game over state should have calculated duration');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export transition system state for debugging
   */
  public exportState(): {
    currentState: GameStateEnum;
    transitionHistory: StateTransitionResult[];
    availableActions: StateTransitionAction[];
    rules: StateTransitionRules;
  } {
    return {
      currentState: this.gameStateManager.getCurrentState(),
      transitionHistory: this.getTransitionHistory(),
      availableActions: this.getAvailableActions(),
      rules: this.getRules(),
    };
  }
}

/**
 * Utility functions for state transitions
 */
export const StateTransitionUtils = {
  /**
   * Create a state machine from GameStateManager
   */
  createStateMachine(gameStateManager: GameStateManager): StateTransitionManager {
    return new StateTransitionManager(gameStateManager);
  },

  /**
   * Get human-readable action name
   */
  getActionDisplayName(action: StateTransitionAction): string {
    const displayNames: Record<StateTransitionAction, string> = {
      [StateTransitionAction.START_GAME]: 'Start Game',
      [StateTransitionAction.PAUSE_GAME]: 'Pause Game',
      [StateTransitionAction.RESUME_GAME]: 'Resume Game',
      [StateTransitionAction.END_GAME]: 'End Game',
      [StateTransitionAction.RESTART_GAME]: 'Restart Game',
      [StateTransitionAction.GO_TO_MENU]: 'Return to Menu',
      [StateTransitionAction.LOAD_GAME]: 'Load Game',
    };
    return displayNames[action] || action;
  },

  /**
   * Get human-readable state name
   */
  getStateDisplayName(state: GameStateEnum): string {
    const displayNames: Record<GameStateEnum, string> = {
      [GameStateEnum.MENU]: 'Main Menu',
      [GameStateEnum.LOADING]: 'Loading',
      [GameStateEnum.PLAYING]: 'Playing',
      [GameStateEnum.PAUSED]: 'Paused',
      [GameStateEnum.GAME_OVER]: 'Game Over',
    };
    return displayNames[state] || state;
  },
};