/**
 * Game State Machine Implementation
 * Provides a formal state machine wrapper around the game state management system
 */

import { 
  GameStateManager, 
  GameStateEnum, 
  type GameStateData 
} from './gameState';
import { 
  StateTransitionManager, 
  StateTransitionAction, 
  type StateTransitionResult 
} from './stateTransitions';

/**
 * State machine event interface
 */
export interface StateMachineEvent {
  type: StateTransitionAction;
  payload?: any;
  timestamp: number;
}

/**
 * State machine configuration
 */
export interface StateMachineConfig {
  enableLogging: boolean;
  enableHistory: boolean;
  maxHistorySize: number;
  validateTransitions: boolean;
}

/**
 * State machine status
 */
export interface StateMachineStatus {
  currentState: GameStateEnum;
  previousState: GameStateEnum | null;
  isTransitioning: boolean;
  lastTransition: StateTransitionResult | null;
  eventQueue: StateMachineEvent[];
  uptime: number;
}

/**
 * Game State Machine class - formal state machine implementation
 */
export class GameStateMachine {
  private gameStateManager: GameStateManager;
  private transitionManager: StateTransitionManager;
  private config: StateMachineConfig;
  private isTransitioning: boolean = false;
  private previousState: GameStateEnum | null = null;
  private lastTransition: StateTransitionResult | null = null;
  private eventQueue: StateMachineEvent[] = [];
  private startTime: number = Date.now();
  private transitionHistory: StateTransitionResult[] = [];

  constructor(config: Partial<StateMachineConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableHistory: true,
      maxHistorySize: 100,
      validateTransitions: true,
      ...config,
    };

    this.gameStateManager = new GameStateManager();
    this.transitionManager = new StateTransitionManager(this.gameStateManager);

    this.setupEventHandlers();
  }

  /**
   * Set up event handlers for state transitions
   */
  private setupEventHandlers(): void {
    // Subscribe to state transitions
    this.gameStateManager.onStateTransition((from, to) => {
      this.previousState = from;
      this.isTransitioning = false;
      
      if (this.config.enableLogging) {
        console.log(`State machine: ${from} -> ${to}`);
      }
    });
  }

  /**
   * Send an event to the state machine
   */
  public send(event: StateTransitionAction, payload?: any): StateTransitionResult {
    const machineEvent: StateMachineEvent = {
      type: event,
      payload,
      timestamp: Date.now(),
    };

    // Add to event queue if enabled
    if (this.config.enableHistory) {
      this.eventQueue.push(machineEvent);
      if (this.eventQueue.length > this.config.maxHistorySize) {
        this.eventQueue = this.eventQueue.slice(-this.config.maxHistorySize / 2);
      }
    }

    // Validate transition if enabled
    if (this.config.validateTransitions) {
      if (!this.transitionManager.isActionAvailable(event)) {
        const result: StateTransitionResult = {
          success: false,
          fromState: this.getCurrentState(),
          toState: this.getCurrentState(),
          action: event,
          error: `Action ${event} not available in current state`,
          timestamp: Date.now(),
        };
        
        this.lastTransition = result;
        return result;
      }
    }

    // Set transitioning flag
    this.isTransitioning = true;

    // Execute the transition
    const result = this.transitionManager.executeAction(event);
    
    this.lastTransition = result;
    
    // Add to history
    if (this.config.enableHistory) {
      this.transitionHistory.push(result);
      if (this.transitionHistory.length > this.config.maxHistorySize) {
        this.transitionHistory = this.transitionHistory.slice(-this.config.maxHistorySize / 2);
      }
    }

    return result;
  }

  /**
   * Get current state
   */
  public getCurrentState(): GameStateEnum {
    return this.gameStateManager.getCurrentState();
  }

  /**
   * Get current game data
   */
  public getContext(): GameStateData {
    return this.gameStateManager.getGameData();
  }

  /**
   * Get state machine status
   */
  public getStatus(): StateMachineStatus {
    return {
      currentState: this.getCurrentState(),
      previousState: this.previousState,
      isTransitioning: this.isTransitioning,
      lastTransition: this.lastTransition,
      eventQueue: [...this.eventQueue],
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Check if the state machine can handle a specific event
   */
  public canHandle(event: StateTransitionAction): boolean {
    return this.transitionManager.isActionAvailable(event);
  }

  /**
   * Get all available events for current state
   */
  public getAvailableEvents(): StateTransitionAction[] {
    return this.transitionManager.getAvailableActions();
  }

  /**
   * Check if state machine is in a specific state
   */
  public isInState(state: GameStateEnum): boolean {
    return this.getCurrentState() === state;
  }

  /**
   * Check if state machine matches any of the provided states
   */
  public isInAnyState(states: GameStateEnum[]): boolean {
    return states.includes(this.getCurrentState());
  }

  /**
   * Wait for state machine to reach a specific state
   */
  public async waitForState(
    targetState: GameStateEnum, 
    timeout: number = 5000
  ): Promise<boolean> {
    if (this.isInState(targetState)) {
      return true;
    }

    return new Promise((resolve) => {
      const unsubscribe = this.gameStateManager.onStateChange(targetState, () => {
        unsubscribe();
        resolve(true);
      });

      // Set timeout
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);
    });
  }

  /**
   * Reset state machine to initial state
   */
  public reset(): void {
    this.gameStateManager.transitionTo(GameStateEnum.MENU);
    this.previousState = null;
    this.isTransitioning = false;
    this.lastTransition = null;
    this.eventQueue = [];
    this.transitionHistory = [];
    this.startTime = Date.now();
  }

  /**
   * Get transition history
   */
  public getTransitionHistory(): StateTransitionResult[] {
    return [...this.transitionHistory];
  }

  /**
   * Get event queue
   */
  public getEventQueue(): StateMachineEvent[] {
    return [...this.eventQueue];
  }

  /**
   * Clear history and event queue
   */
  public clearHistory(): void {
    this.transitionHistory = [];
    this.eventQueue = [];
  }

  /**
   * Export state machine state for debugging/persistence
   */
  public exportState(): {
    currentState: GameStateEnum;
    gameData: GameStateData;
    status: StateMachineStatus;
    transitionHistory: StateTransitionResult[];
    eventQueue: StateMachineEvent[];
  } {
    return {
      currentState: this.getCurrentState(),
      gameData: this.getContext(),
      status: this.getStatus(),
      transitionHistory: this.getTransitionHistory(),
      eventQueue: this.getEventQueue(),
    };
  }

  /**
   * Get state machine configuration
   */
  public getConfig(): StateMachineConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<StateMachineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get underlying managers for advanced usage
   */
  public getManagers(): {
    stateManager: GameStateManager;
    transitionManager: StateTransitionManager;
  } {
    return {
      stateManager: this.gameStateManager,
      transitionManager: this.transitionManager,
    };
  }

  /**
   * Validate current state consistency
   */
  public validate(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check transition manager validation
    const transitionValidation = this.transitionManager.validateCurrentState();
    if (!transitionValidation.isValid) {
      errors.push(...transitionValidation.errors);
    }

    // Check if transitioning flag is consistent
    if (this.isTransitioning && this.lastTransition && this.lastTransition.success) {
      warnings.push('State machine may be stuck in transitioning state');
    }

    // Check event queue size
    if (this.eventQueue.length > this.config.maxHistorySize * 0.8) {
      warnings.push('Event queue is approaching maximum size');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Create a snapshot of current state for testing
   */
  public createSnapshot(): {
    state: GameStateEnum;
    data: GameStateData;
    timestamp: number;
  } {
    return {
      state: this.getCurrentState(),
      data: this.getContext(),
      timestamp: Date.now(),
    };
  }

  /**
   * Restore from a snapshot (for testing)
   */
  public restoreSnapshot(snapshot: {
    state: GameStateEnum;
    data: GameStateData;
  }): boolean {
    try {
      this.gameStateManager.importState(snapshot.data);
      return this.gameStateManager.transitionTo(snapshot.state);
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      return false;
    }
  }
}

/**
 * Factory function to create a game state machine
 */
export function createGameStateMachine(
  config?: Partial<StateMachineConfig>
): GameStateMachine {
  return new GameStateMachine(config);
}

/**
 * Utility functions for state machine operations
 */
export const StateMachineUtils = {
  /**
   * Create a state machine with specific configuration presets
   */
  createWithPreset(preset: 'development' | 'production' | 'testing'): GameStateMachine {
    const presets: Record<typeof preset, StateMachineConfig> = {
      development: {
        enableLogging: true,
        enableHistory: true,
        maxHistorySize: 200,
        validateTransitions: true,
      },
      production: {
        enableLogging: false,
        enableHistory: false,
        maxHistorySize: 50,
        validateTransitions: true,
      },
      testing: {
        enableLogging: true,
        enableHistory: true,
        maxHistorySize: 1000,
        validateTransitions: true,
      },
    };

    return new GameStateMachine(presets[preset]);
  },

  /**
   * Create a state machine from existing managers (placeholder for future enhancement)
   */
  createFromManagers(
    _gameStateManager: GameStateManager,
    _transitionManager: StateTransitionManager,
    config?: Partial<StateMachineConfig>
  ): GameStateMachine {
    const machine = new GameStateMachine(config);
    // Replace internal managers - this would require exposing more methods
    // For now, this is a placeholder for future enhancement
    return machine;
  },
};