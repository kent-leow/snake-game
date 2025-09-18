import type { 
  ComboState, 
  ComboResult, 
  ComboEvent, 
  ComboChangeCallback,
  ComboStatistics,
  ComboConfig
} from '@/types/Combo';

import { 
  DEFAULT_COMBO_CONFIG, 
  COMBO_SEQUENCE, 
  SEQUENCE_LENGTH
} from '@/constants/ComboConfig';

/**
 * Manages combo state and sequence tracking for the 1→2→3→4→5 food consumption system
 * Implements a state machine that tracks player progress and awards bonus points
 */
export class ComboManager {
  private state: ComboState;
  private config: ComboConfig;
  private callbacks: ComboChangeCallback[] = [];
  private eventHistory: ComboEvent[] = [];

  constructor(config: Partial<ComboConfig> = {}) {
    this.config = { ...DEFAULT_COMBO_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  /**
   * Process food consumption and update combo state
   */
  public processFood(consumedNumber: 1 | 2 | 3 | 4 | 5): ComboResult {
    // Validate input
    if (!this.isValidFoodNumber(consumedNumber)) {
      throw new Error(`Invalid food number: ${consumedNumber}. Must be 1-5.`);
    }

    let result: ComboResult;

    // Check if this is the expected next number in sequence
    if (this.isExpectedNumber(consumedNumber)) {
      result = this.advanceSequence(consumedNumber);
    } else {
      result = this.breakCombo();
    }

    // Update internal state
    this.state = result.newState;

    // Create and fire combo event
    const comboEvent = this.createComboEvent(result.type, result.pointsAwarded);
    this.recordEvent(comboEvent);
    this.notifyCallbacks(comboEvent);

    return result;
  }

  /**
   * Get current combo state (immutable copy)
   */
  public getCurrentState(): ComboState {
    return { ...this.state };
  }

  /**
   * Reset combo tracking to initial state
   */
  public reset(): void {
    this.state = this.createInitialState();
    this.eventHistory = [];
    
    const resetEvent = this.createComboEvent('broken', 0);
    this.recordEvent(resetEvent);
    this.notifyCallbacks(resetEvent);
  }

  /**
   * Subscribe to combo state changes
   */
  public subscribe(callback: ComboChangeCallback): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get combo statistics
   */
  public getStatistics(): ComboStatistics {
    const completedCombos = this.eventHistory.filter(e => e.type === 'completed').length;
    const totalBonusPoints = completedCombos * this.config.comboBonusPoints;
    const totalFoodEvents = this.eventHistory.filter(
      e => e.type === 'progress' || e.type === 'completed'
    ).length;

    // Calculate longest sequence from history
    let longestSequence = 0;
    for (const event of this.eventHistory) {
      if (event.sequence.length > longestSequence) {
        longestSequence = event.sequence.length;
      }
    }

    // Calculate efficiency (food that contributed to combos)
    const comboFoodCount = this.eventHistory
      .filter(e => e.type === 'progress' || e.type === 'completed')
      .reduce((total, e) => total + e.sequence.length, 0);
    
    const efficiency = totalFoodEvents > 0 ? (comboFoodCount / totalFoodEvents) * 100 : 0;

    return {
      totalCombos: this.state.totalCombos,
      totalBonusPoints,
      currentProgress: this.state.comboProgress,
      longestSequence,
      totalFoodConsumed: totalFoodEvents,
      comboEfficiency: efficiency,
    };
  }

  /**
   * Export combo data for persistence
   */
  public exportData(): {
    state: ComboState;
    config: ComboConfig;
    eventHistory: ComboEvent[];
    timestamp: number;
  } {
    return {
      state: { ...this.state },
      config: { ...this.config },
      eventHistory: [...this.eventHistory],
      timestamp: Date.now(),
    };
  }

  /**
   * Import combo data from persistence
   */
  public importData(data: {
    state: ComboState;
    eventHistory: ComboEvent[];
  }): void {
    this.state = { ...data.state };
    this.eventHistory = [...data.eventHistory];
  }

  /**
   * Get event history
   */
  public getEventHistory(): ComboEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear all callbacks (for cleanup)
   */
  public clearCallbacks(): void {
    this.callbacks = [];
  }

  // Private methods

  /**
   * Create initial combo state
   */
  private createInitialState(): ComboState {
    return {
      currentSequence: [],
      expectedNext: 1,
      comboProgress: 0,
      totalCombos: 0,
      isComboActive: false,
    };
  }

  /**
   * Advance the combo sequence with the consumed number
   */
  private advanceSequence(number: 1 | 2 | 3 | 4 | 5): ComboResult {
    const newSequence = [...this.state.currentSequence, number];
    const newProgress = newSequence.length as 0 | 1 | 2 | 3 | 4 | 5;

    // Check if combo is complete
    if (newProgress === SEQUENCE_LENGTH) {
      return this.completeCombo();
    }

    // Advance progress
    const newState: ComboState = {
      ...this.state,
      currentSequence: newSequence,
      expectedNext: COMBO_SEQUENCE[newProgress],
      comboProgress: newProgress,
      isComboActive: true,
    };

    return {
      type: 'progress',
      newState,
      pointsAwarded: 0, // No bonus points for partial progress
      message: `Combo progress: ${newProgress}/${SEQUENCE_LENGTH}`,
    };
  }

  /**
   * Complete a combo and award bonus points
   */
  private completeCombo(): ComboResult {
    const newState: ComboState = {
      currentSequence: [],
      expectedNext: 1,
      comboProgress: 0,
      totalCombos: this.state.totalCombos + 1,
      isComboActive: false,
    };

    return {
      type: 'complete',
      newState,
      pointsAwarded: this.config.comboBonusPoints,
      message: `Combo completed! +${this.config.comboBonusPoints} bonus points`,
    };
  }

  /**
   * Break the current combo and reset sequence
   */
  private breakCombo(): ComboResult {
    const wasActive = this.state.isComboActive;
    
    const newState: ComboState = {
      currentSequence: [],
      expectedNext: 1,
      comboProgress: 0,
      totalCombos: this.state.totalCombos,
      isComboActive: false,
    };

    const result: ComboResult = {
      type: 'broken',
      newState,
      pointsAwarded: 0,
    };

    if (wasActive) {
      result.message = 'Combo broken! Sequence reset.';
    }

    return result;
  }

  /**
   * Check if the consumed number is the expected next in sequence
   */
  private isExpectedNumber(number: 1 | 2 | 3 | 4 | 5): boolean {
    return number === this.state.expectedNext;
  }

  /**
   * Validate if food number is in valid range
   */
  private isValidFoodNumber(number: number): number is 1 | 2 | 3 | 4 | 5 {
    return number >= 1 && number <= 5 && Number.isInteger(number);
  }

  /**
   * Create a combo event for the given result type
   */
  private createComboEvent(type: ComboResult['type'], pointsAwarded: number): ComboEvent {
    // Map result type to event type
    let eventType: ComboEvent['type'];
    switch (type) {
      case 'progress':
        eventType = this.state.comboProgress === 1 ? 'started' : 'progress';
        break;
      case 'complete':
        eventType = 'completed';
        break;
      case 'broken':
        eventType = 'broken';
        break;
      default:
        eventType = 'broken';
    }

    return {
      type: eventType,
      sequence: [...this.state.currentSequence],
      progress: this.state.comboProgress,
      totalPoints: pointsAwarded,
      timestamp: Date.now(),
    };
  }

  /**
   * Record an event in history (with size limit)
   */
  private recordEvent(event: ComboEvent): void {
    this.eventHistory.push(event);
    
    // Limit history size to prevent memory issues
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }
  }

  /**
   * Notify all subscribers of a combo event
   */
  private notifyCallbacks(event: ComboEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in combo callback:', error);
      }
    });
  }

  /**
   * Get debug information about current state
   */
  public getDebugInfo(): {
    state: ComboState;
    config: ComboConfig;
    callbackCount: number;
    eventCount: number;
    expectedSequence: readonly [1, 2, 3, 4, 5];
  } {
    return {
      state: { ...this.state },
      config: { ...this.config },
      callbackCount: this.callbacks.length,
      eventCount: this.eventHistory.length,
      expectedSequence: COMBO_SEQUENCE,
    };
  }

  /**
   * Validate current state consistency
   */
  public validateState(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check sequence consistency
    if (this.state.currentSequence.length !== this.state.comboProgress) {
      errors.push('Sequence length does not match progress');
    }

    // Check expected next number - only validate when in progress (0 < progress < 5)
    if (this.state.comboProgress > 0 && this.state.comboProgress < SEQUENCE_LENGTH) {
      const progressIndex = this.state.comboProgress as 1 | 2 | 3 | 4; // Safe cast since we checked bounds
      const expectedNext = COMBO_SEQUENCE[progressIndex];
      if (this.state.expectedNext !== expectedNext) {
        errors.push(`Expected next number mismatch: got ${this.state.expectedNext}, expected ${expectedNext}`);
      }
    } else if (this.state.comboProgress === 0) {
      // When progress is 0, should expect 1
      if (this.state.expectedNext !== 1) {
        errors.push(`Expected next number should be 1 when progress is 0, got ${this.state.expectedNext}`);
      }
    } else if (this.state.comboProgress === SEQUENCE_LENGTH) {
      // Progress should never be exactly 5 - it resets to 0 after completion
      errors.push(`Invalid progress state: progress should not be ${SEQUENCE_LENGTH}, should reset to 0 after completion`);
    }

    // Check combo active state
    const shouldBeActive = this.state.comboProgress > 0 && this.state.comboProgress < SEQUENCE_LENGTH;
    if (this.state.isComboActive !== shouldBeActive) {
      errors.push(`Combo active state mismatch: got ${this.state.isComboActive}, expected ${shouldBeActive}`);
    }

    // Check sequence validity
    for (let i = 0; i < this.state.currentSequence.length; i++) {
      if (this.state.currentSequence[i] !== COMBO_SEQUENCE[i]) {
        errors.push(`Invalid sequence at position ${i}: got ${this.state.currentSequence[i]}, expected ${COMBO_SEQUENCE[i]}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}