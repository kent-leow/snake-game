import type { Snake, SnakeSegment } from './types';

/**
 * Growth event interface for tracking growth actions
 */
export interface GrowthEvent {
  segments: number;
  timestamp: number;
  reason: 'food' | 'bonus' | 'manual';
}

/**
 * Growth statistics interface
 */
export interface GrowthStatistics {
  totalGrowth: number;
  currentLength: number;
  growthEvents: number;
  averageGrowthRate: number;
  largestGrowthEvent: number;
}

/**
 * Snake growth manager class for handling snake growth mechanics
 * Provides smooth and predictable snake growth with event tracking
 */
export class SnakeGrowthManager {
  private snake: Snake;
  private pendingGrowth: number = 0;
  private growthHistory: GrowthEvent[] = [];
  private maxPendingGrowth: number = 10; // Prevent excessive queuing

  constructor(snake: Snake) {
    this.snake = snake;
  }

  /**
   * Add growth segments to the pending queue
   */
  public addGrowth(segments: number = 1, reason: GrowthEvent['reason'] = 'food'): void {
    if (segments <= 0) return;

    // Limit pending growth to prevent excessive accumulation
    const actualGrowth = Math.min(segments, this.maxPendingGrowth - this.pendingGrowth);
    
    // Always record the growth event, even if limited
    this.growthHistory.push({
      segments: segments, // Record the requested amount
      timestamp: Date.now(),
      reason,
    });
    
    if (actualGrowth > 0) {
      this.pendingGrowth += actualGrowth;
      this.snake.isGrowing = true;
    }
  }

  /**
   * Process pending growth (called during movement)
   */
  public processGrowth(): boolean {
    if (this.pendingGrowth > 0) {
      this.snake.isGrowing = true;
      this.pendingGrowth--;
      return true;
    }
    
    this.snake.isGrowing = false;
    return false;
  }

  /**
   * Execute the actual growth by not removing tail during movement
   * This method is called by the movement system when isGrowing is true
   */
  public executeGrowth(): void {
    // Growth is handled by the movement system by not removing the tail
    // This method just clears the growing flag for the current step
    this.snake.isGrowing = false;
  }

  /**
   * Manually grow the snake by adding a segment at the tail
   */
  public growSnakeImmediate(segments: number = 1): void {
    if (segments <= 0 || this.snake.segments.length === 0) return;

    const tail = this.snake.segments[this.snake.segments.length - 1];
    
    for (let i = 0; i < segments; i++) {
      // Create new segment at the tail position
      const newSegment: SnakeSegment = {
        x: tail.x,
        y: tail.y,
        id: `body-${this.snake.segments.length + i}-${Date.now()}`,
      };
      
      this.snake.segments.push(newSegment);
    }

    // Record immediate growth event
    this.growthHistory.push({
      segments,
      timestamp: Date.now(),
      reason: 'manual',
    });
  }

  /**
   * Get current pending growth count
   */
  public getPendingGrowth(): number {
    return this.pendingGrowth;
  }

  /**
   * Get current snake length
   */
  public getSnakeLength(): number {
    return this.snake.segments.length;
  }

  /**
   * Get total growth since start
   */
  public getTotalGrowth(): number {
    return this.growthHistory.reduce((total, event) => total + event.segments, 0);
  }

  /**
   * Check if snake is currently growing
   */
  public isGrowing(): boolean {
    return this.snake.isGrowing || this.pendingGrowth > 0;
  }

  /**
   * Get growth statistics
   */
  public getStatistics(): GrowthStatistics {
    const totalSegments = this.getTotalGrowth();
    const eventCount = this.growthHistory.length;
    
    return {
      totalGrowth: totalSegments,
      currentLength: this.getSnakeLength(),
      growthEvents: eventCount,
      averageGrowthRate: eventCount > 0 ? totalSegments / eventCount : 0,
      largestGrowthEvent: this.getLargestGrowthEvent(),
    };
  }

  /**
   * Get largest single growth event
   */
  private getLargestGrowthEvent(): number {
    return this.growthHistory.reduce((max, event) => 
      Math.max(max, event.segments), 0
    );
  }

  /**
   * Get growth history
   */
  public getGrowthHistory(): GrowthEvent[] {
    return [...this.growthHistory];
  }

  /**
   * Get recent growth events
   */
  public getRecentGrowthEvents(count: number = 5): GrowthEvent[] {
    return this.growthHistory.slice(-count);
  }

  /**
   * Set maximum pending growth limit
   */
  public setMaxPendingGrowth(max: number): void {
    this.maxPendingGrowth = Math.max(1, max);
  }

  /**
   * Clear pending growth (useful for reset or special events)
   */
  public clearPendingGrowth(): void {
    this.pendingGrowth = 0;
    this.snake.isGrowing = false;
  }

  /**
   * Reset growth manager to initial state
   */
  public reset(): void {
    this.pendingGrowth = 0;
    this.growthHistory = [];
    this.snake.isGrowing = false;
  }

  /**
   * Get growth events by reason
   */
  public getGrowthByReason(reason: GrowthEvent['reason']): GrowthEvent[] {
    return this.growthHistory.filter(event => event.reason === reason);
  }

  /**
   * Get total growth by reason
   */
  public getTotalGrowthByReason(reason: GrowthEvent['reason']): number {
    return this.getGrowthByReason(reason)
      .reduce((total, event) => total + event.segments, 0);
  }

  /**
   * Get growth rate (segments per minute)
   */
  public getGrowthRate(): number {
    if (this.growthHistory.length === 0) return 0;

    const firstEvent = this.growthHistory[0];
    const lastEvent = this.growthHistory[this.growthHistory.length - 1];
    const timeSpan = lastEvent.timestamp - firstEvent.timestamp;

    if (timeSpan === 0) return 0;

    const totalGrowth = this.getTotalGrowth();
    const minutesElapsed = timeSpan / (1000 * 60);

    return totalGrowth / minutesElapsed;
  }

  /**
   * Predict snake length after pending growth
   */
  public getPredictedLength(): number {
    return this.getSnakeLength() + this.pendingGrowth;
  }

  /**
   * Check if growth would exceed maximum length
   */
  public wouldExceedMaxLength(maxLength: number): boolean {
    return this.getPredictedLength() > maxLength;
  }

  /**
   * Add growth with maximum length check
   */
  public addGrowthWithLimit(
    segments: number = 1, 
    maxLength: number,
    reason: GrowthEvent['reason'] = 'food'
  ): number {
    const availableGrowth = Math.max(0, maxLength - this.getPredictedLength());
    const actualGrowth = Math.min(segments, availableGrowth);
    
    if (actualGrowth > 0) {
      this.addGrowth(actualGrowth, reason);
    }
    
    return actualGrowth;
  }

  /**
   * Get growth manager status for debugging
   */
  public getStatus(): {
    currentLength: number;
    pendingGrowth: number;
    isGrowing: boolean;
    totalGrowthEvents: number;
    maxPendingLimit: number;
    lastGrowthTime: number;
  } {
    const lastEvent = this.growthHistory[this.growthHistory.length - 1];
    
    return {
      currentLength: this.getSnakeLength(),
      pendingGrowth: this.pendingGrowth,
      isGrowing: this.snake.isGrowing,
      totalGrowthEvents: this.growthHistory.length,
      maxPendingLimit: this.maxPendingGrowth,
      lastGrowthTime: lastEvent ? lastEvent.timestamp : 0,
    };
  }

  /**
   * Update snake reference (useful when snake is recreated)
   */
  public updateSnakeReference(snake: Snake): void {
    this.snake = snake;
  }

  /**
   * Export growth data for persistence
   */
  public exportData(): {
    pendingGrowth: number;
    growthHistory: GrowthEvent[];
    timestamp: number;
  } {
    return {
      pendingGrowth: this.pendingGrowth,
      growthHistory: this.growthHistory,
      timestamp: Date.now(),
    };
  }

  /**
   * Import growth data from persistence
   */
  public importData(data: {
    pendingGrowth: number;
    growthHistory: GrowthEvent[];
  }): void {
    this.pendingGrowth = data.pendingGrowth;
    this.growthHistory = data.growthHistory;
    
    // Update growing state based on pending growth
    this.snake.isGrowing = this.pendingGrowth > 0;
  }

  /**
   * Calculate expected growth time
   */
  public getEstimatedGrowthTime(gameSpeed: number): number {
    if (this.pendingGrowth === 0) return 0;
    
    // Estimate time based on game speed (milliseconds per move)
    return this.pendingGrowth * gameSpeed;
  }

  /**
   * Get growth efficiency (growth per food consumed)
   */
  public getGrowthEfficiency(): number {
    const foodGrowth = this.getTotalGrowthByReason('food');
    const foodEvents = this.getGrowthByReason('food').length;
    
    return foodEvents > 0 ? foodGrowth / foodEvents : 0;
  }
}