/**
 * SpeedManager - Progressive speed system for snake game
 * Manages dynamic speed changes based on combo completion and provides smooth transitions
 */

import type { 
  SpeedConfig, 
  SpeedState, 
  SpeedChangeEvent, 
  SpeedChangeCallback,
  SpeedStatistics,
  SpeedTransition,
  EasingFunction,
  SpeedManagerData
} from '@/types/Speed';
import type { ComboEvent } from '@/types/Combo';
import { 
  DEFAULT_SPEED_CONFIG, 
  calculateSpeedCurve,
  validateSpeedConfig
} from '@/constants/SpeedConfig';
import { SpeedEasing } from '@/types/Speed';

/**
 * Core speed management class that handles progressive speed increases
 * based on combo completion with smooth transitions
 */
export class SpeedManager {
  private config: SpeedConfig;
  private state: SpeedState;
  private statistics: SpeedStatistics;
  private callbacks: SpeedChangeCallback[] = [];
  private sessionStartTime: number;
  private easingFunction: EasingFunction;

  /**
   * Create a new SpeedManager instance
   */
  constructor(config: SpeedConfig = DEFAULT_SPEED_CONFIG) {
    const validation = validateSpeedConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid speed config: ${validation.errors.join(', ')}`);
    }

    this.config = { ...config };
    this.state = this.createInitialState();
    this.statistics = this.createInitialStatistics();
    this.sessionStartTime = Date.now();
    this.easingFunction = SpeedEasing.easeOutCubic;
  }

  /**
   * Handle combo completion event - increases speed
   */
  public onComboCompleted(): void {
    const previousSpeed = this.state.currentSpeed;
    const newSpeedLevel = this.state.speedLevel + 1;
    const targetSpeed = calculateSpeedCurve(newSpeedLevel, this.config);

    // Update state
    this.state.speedLevel = newSpeedLevel;
    this.startTransition(targetSpeed);

    // Update statistics
    this.statistics.totalIncreases++;
    this.statistics.currentLevel = newSpeedLevel;
    this.statistics.maxLevelReached = Math.max(
      this.statistics.maxLevelReached, 
      newSpeedLevel
    );

    // Fire change event
    this.notifySpeedChange({
      previousSpeed,
      newSpeed: targetSpeed,
      speedLevel: newSpeedLevel,
      reason: 'combo_completed',
      timestamp: Date.now(),
    });
  }

  /**
   * Handle combo break event - resets speed to base level
   */
  public onComboBreak(): void {
    const previousSpeed = this.state.currentSpeed;
    const targetSpeed = this.config.baseSpeed;

    // Reset state
    this.state.speedLevel = 0;
    this.startTransition(targetSpeed);

    // Update statistics
    this.statistics.totalResets++;
    this.statistics.currentLevel = 0;

    // Fire change event
    this.notifySpeedChange({
      previousSpeed,
      newSpeed: targetSpeed,
      speedLevel: 0,
      reason: 'combo_broken',
      timestamp: Date.now(),
    });
  }

  /**
   * Get current movement speed (ms between moves)
   */
  public getCurrentSpeed(): number {
    return this.state.currentSpeed;
  }

  /**
   * Get current speed level (number of combos completed)
   */
  public getSpeedLevel(): number {
    return this.state.speedLevel;
  }

  /**
   * Get current speed state (immutable copy)
   */
  public getSpeedState(): SpeedState {
    return { ...this.state };
  }

  /**
   * Get speed statistics
   */
  public getStatistics(): SpeedStatistics {
    return { ...this.statistics };
  }

  /**
   * Get current speed configuration
   */
  public getConfig(): SpeedConfig {
    return { ...this.config };
  }

  /**
   * Update speed manager state (should be called every frame during transitions)
   */
  public update(deltaTime: number = 16): void {
    if (!this.state.isTransitioning) {
      return;
    }

    const transition = this.calculateTransition();
    this.state.currentSpeed = transition.currentSpeed;

    // Check if transition is complete
    if (transition.isComplete) {
      this.state.currentSpeed = this.state.targetSpeed;
      this.state.isTransitioning = false;
    }

    // Update statistics
    this.updateStatistics(deltaTime);
  }

  /**
   * Subscribe to speed change events
   */
  public onSpeedChange(callback: SpeedChangeCallback): () => void {
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
   * Set custom easing function for speed transitions
   */
  public setEasingFunction(easingFunction: EasingFunction): void {
    this.easingFunction = easingFunction;
  }

  /**
   * Reset speed manager to initial state
   */
  public reset(): void {
    const previousSpeed = this.state.currentSpeed;
    
    this.state = this.createInitialState();
    // Only increment totalResets if this is not the initial state
    if (this.statistics.totalIncreases > 0 || this.statistics.totalResets > 0) {
      this.statistics.totalResets++;
    }
    this.statistics.currentLevel = 0;
    this.sessionStartTime = Date.now();

    this.notifySpeedChange({
      previousSpeed,
      newSpeed: this.config.baseSpeed,
      speedLevel: 0,
      reason: 'reset',
      timestamp: Date.now(),
    });
  }

  /**
   * Update configuration at runtime
   */
  public updateConfig(newConfig: Partial<SpeedConfig>): void {
    const updatedConfig = { ...this.config, ...newConfig };
    const validation = validateSpeedConfig(updatedConfig);
    
    if (!validation.isValid) {
      throw new Error(`Invalid speed config: ${validation.errors.join(', ')}`);
    }

    this.config = updatedConfig;
    
    // Recalculate current target speed with new configuration
    const newTargetSpeed = calculateSpeedCurve(this.state.speedLevel, this.config);
    if (newTargetSpeed !== this.state.targetSpeed) {
      this.startTransition(newTargetSpeed);
    }
  }

  /**
   * Handle combo events from the combo system
   */
  public handleComboEvent(event: ComboEvent): void {
    switch (event.type) {
      case 'completed':
        this.onComboCompleted();
        break;
      case 'broken':
        this.onComboBreak();
        break;
      // Ignore 'started' and 'progress' events
    }
  }

  /**
   * Export speed manager data for persistence
   */
  public exportData(): SpeedManagerData {
    return {
      state: { ...this.state },
      config: { ...this.config },
      statistics: { ...this.statistics },
      timestamp: Date.now(),
    };
  }

  /**
   * Import speed manager data from persistence
   */
  public importData(data: SpeedManagerData): void {
    // Validate imported config
    const validation = validateSpeedConfig(data.config);
    if (!validation.isValid) {
      console.warn('Invalid imported speed config, using defaults');
      return;
    }

    this.config = { ...data.config };
    this.state = { ...data.state };
    this.statistics = { ...data.statistics };
  }

  /**
   * Check if speed is at maximum level
   */
  public isAtMaxSpeed(): boolean {
    return this.state.targetSpeed <= this.config.maxSpeed;
  }

  /**
   * Get progress towards maximum speed (0-1)
   */
  public getSpeedProgress(): number {
    const totalRange = this.config.baseSpeed - this.config.maxSpeed;
    const currentProgress = this.config.baseSpeed - this.state.targetSpeed;
    return Math.max(0, Math.min(1, currentProgress / totalRange));
  }

  // Private methods

  /**
   * Create initial speed state
   */
  private createInitialState(): SpeedState {
    return {
      currentSpeed: this.config.baseSpeed,
      speedLevel: 0,
      isTransitioning: false,
      targetSpeed: this.config.baseSpeed,
      transitionStartSpeed: this.config.baseSpeed,
      transitionStartTime: 0,
    };
  }

  /**
   * Create initial statistics
   */
  private createInitialStatistics(): SpeedStatistics {
    return {
      currentLevel: 0,
      maxLevelReached: 0,
      totalIncreases: 0,
      totalResets: 0,
      timeAtMaxSpeed: 0,
      averageSpeedLevel: 0,
    };
  }

  /**
   * Start a smooth transition to target speed
   */
  private startTransition(targetSpeed: number): void {
    this.state.transitionStartSpeed = this.state.currentSpeed;
    this.state.targetSpeed = targetSpeed;
    this.state.isTransitioning = true;
    this.state.transitionStartTime = Date.now();
  }

  /**
   * Calculate current transition state
   */
  private calculateTransition(): SpeedTransition {
    if (!this.state.isTransitioning) {
      return {
        currentSpeed: this.state.currentSpeed,
        progress: 1,
        isComplete: true,
        remainingTime: 0,
      };
    }

    const elapsed = Date.now() - this.state.transitionStartTime;
    const progress = Math.min(1, elapsed / this.config.transitionDuration);
    const easedProgress = this.easingFunction(progress);

    const startSpeed = this.state.transitionStartSpeed;
    const targetSpeed = this.state.targetSpeed;
    const currentSpeed = startSpeed + (targetSpeed - startSpeed) * easedProgress;

    return {
      currentSpeed,
      progress,
      isComplete: progress >= 1,
      remainingTime: Math.max(0, this.config.transitionDuration - elapsed),
    };
  }

  /**
   * Update statistics based on current state
   */
  private updateStatistics(deltaTime: number): void {
    this.statistics.currentLevel = this.state.speedLevel;
    
    // Track time at maximum speed
    if (this.isAtMaxSpeed()) {
      this.statistics.timeAtMaxSpeed += deltaTime;
    }

    // Calculate average speed level
    const sessionDuration = Date.now() - this.sessionStartTime;
    if (sessionDuration > 0) {
      // Simplified average calculation - could be more sophisticated
      this.statistics.averageSpeedLevel = 
        (this.statistics.averageSpeedLevel + this.state.speedLevel) / 2;
    }
  }

  /**
   * Notify all subscribers of speed change
   */
  private notifySpeedChange(event: SpeedChangeEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in speed change callback:', error);
      }
    });
  }
}

/**
 * Factory function to create SpeedManager with combo integration
 */
export const createSpeedManager = (config?: SpeedConfig): SpeedManager => {
  return new SpeedManager(config);
};

/**
 * Factory function to create SpeedManager with automatic combo event handling
 */
export const createSpeedManagerWithComboIntegration = (
  comboManager: { subscribe: (callback: (event: ComboEvent) => void) => () => void },
  config?: SpeedConfig
): SpeedManager => {
  const speedManager = new SpeedManager(config);
  
  // Auto-subscribe to combo events
  comboManager.subscribe((event: ComboEvent) => {
    speedManager.handleComboEvent(event);
  });
  
  return speedManager;
};