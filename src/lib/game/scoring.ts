import type { Position } from './types';

/**
 * Score event interface representing different scoring actions
 */
export interface ScoreEvent {
  type: 'food' | 'combo' | 'bonus';
  points: number;
  timestamp: number;
  position?: Position;
}

/**
 * Score statistics interface for analytics
 */
export interface ScoreStatistics {
  totalScore: number;
  totalEvents: number;
  averageScore: number;
  scoreBreakdown: Record<string, number>;
  highestSingleScore: number;
  longestCombo: number;
}

/**
 * Score change callback function type
 */
export type ScoreChangeCallback = (score: number, event: ScoreEvent) => void;

/**
 * Scoring system class for managing game scores and events
 * Provides comprehensive score tracking with event history and statistics
 */
export class ScoringSystem {
  private currentScore: number = 0;
  private scoreHistory: ScoreEvent[] = [];
  private scoreCallbacks: Array<ScoreChangeCallback> = [];
  private comboCount: number = 0;
  private lastScoreTime: number = 0;
  private readonly comboTimeWindow: number = 2000; // 2 seconds for combo

  constructor(initialScore: number = 0) {
    this.currentScore = initialScore;
  }

    /**
   * Add a score event to the system
   */
  public addScore(event: Omit<ScoreEvent, 'timestamp'>): number {
    const scoreEvent: ScoreEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Update current score
    this.currentScore += event.points;
    
    // Add to history (limit to prevent memory issues)
    this.scoreHistory.push(scoreEvent);
    if (this.scoreHistory.length > 1000) {
      this.scoreHistory = this.scoreHistory.slice(-1000);
    }
    
    // Notify subscribers
    this.scoreCallbacks.forEach(callback => {
      callback(this.currentScore, scoreEvent);
    });
    
    // Note: milestone checking should be handled externally
    
    return this.currentScore;
  }

  /**
   * Check if current score event is eligible for combo
   */
  private isComboEligible(event: ScoreEvent): boolean {
    if (this.scoreHistory.length === 0) return true;
    
    const timeSinceLastScore = event.timestamp - this.lastScoreTime;
    return timeSinceLastScore <= this.comboTimeWindow && event.type === 'food';
  }

  /**
   * Get current score
   */
  public getCurrentScore(): number {
    return this.currentScore;
  }

  /**
   * Get score history
   */
  public getScoreHistory(): ScoreEvent[] {
    return [...this.scoreHistory];
  }

  /**
   * Get recent score events (last N events)
   */
  public getRecentEvents(count: number = 5): ScoreEvent[] {
    return this.scoreHistory.slice(-count);
  }

  /**
   * Subscribe to score changes
   */
  public subscribeToScoreChanges(callback: ScoreChangeCallback): () => void {
    this.scoreCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.scoreCallbacks.indexOf(callback);
      if (index > -1) {
        this.scoreCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Reset score to initial state
   */
  public resetScore(): void {
    this.currentScore = 0;
    this.scoreHistory = [];
    this.comboCount = 0;
    this.lastScoreTime = 0;
  }

    /**
   * Calculate detailed statistics about scoring
   */
  public getStatistics(): ScoreStatistics {
    const totalEvents = this.scoreHistory.length;
    const totalScore = this.getCurrentScore();
    const averageScore = totalEvents > 0 ? totalScore / totalEvents : 0;

    // Calculate score breakdown by type
    const breakdown: Record<string, number> = {
      food: 0,
      bonus: 0,
      combo: 0,
    };

    this.scoreHistory.forEach(event => {
      breakdown[event.type] += event.points;
    });

    return {
      totalScore,
      totalEvents,
      averageScore,
      scoreBreakdown: breakdown,
      highestSingleScore: Math.max(...this.scoreHistory.map(e => e.points), 0),
      longestCombo: this.getCurrentCombo(),
    };
  }

  /**
   * Get current combo count
   */

  /**
   * Get highest single score event
   */
  private getHighestSingleScore(): number {
    return this.scoreHistory.reduce((max, event) => 
      Math.max(max, event.points), 0
    );
  }

  /**
   * Calculate longest combo streak
   */
  private getLongestCombo(): number {
    let maxCombo = 0;
    let currentCombo = 0;
    let lastTime = 0;

    for (const event of this.scoreHistory) {
      if (event.type === 'food' || event.type === 'combo') {
        if (lastTime === 0 || (event.timestamp - lastTime) <= this.comboTimeWindow) {
          currentCombo++;
          maxCombo = Math.max(maxCombo, currentCombo);
        } else {
          currentCombo = 1;
        }
        lastTime = event.timestamp;
      } else {
        currentCombo = 0;
      }
    }

    return maxCombo;
  }

  /**
   * Add score for food consumption  
   */
  public addFoodScore(position?: Position, multiplier: number = 1): number {
    const basePoints = 10;
    const points = basePoints * multiplier;
    
    const event: Omit<ScoreEvent, 'timestamp'> = {
      type: 'food',
      points,
      ...(position && { position }),
    };
    
    return this.addScore(event);
  }

  /**
   * Get current combo count
   */
  public getCurrentCombo(): number {
    return this.comboCount;
  }

  /**
   * Add bonus score (special events, achievements, etc.)
   */
  public addBonusScore(points: number, position?: Position): number {
    const event: Omit<ScoreEvent, 'timestamp'> = {
      type: 'bonus',
      points,
    };
    
    if (position) {
      event.position = position;
    }
    
    this.addScore(event);
    return points;
  }

  /**
   * Get score for display with formatting
   */
  public getFormattedScore(): string {
    return this.currentScore.toLocaleString();
  }

  /**
   * Get score events in time range
   */
  public getEventsInTimeRange(startTime: number, endTime: number): ScoreEvent[] {
    return this.scoreHistory.filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Get total score from specific event type
   */
  public getScoreByType(type: ScoreEvent['type']): number {
    return this.scoreHistory
      .filter(event => event.type === type)
      .reduce((total, event) => total + event.points, 0);
  }

  /**
   * Check if score is at a milestone
   */
  public checkMilestone(milestones: number[]): number | null {
    const lastEvent = this.scoreHistory[this.scoreHistory.length - 1];
    if (!lastEvent) return null;

    const previousScore = this.currentScore - lastEvent.points;
    
    for (const milestone of milestones) {
      if (previousScore < milestone && this.currentScore >= milestone) {
        return milestone;
      }
    }

    return null;
  }

  /**
   * Export score data for persistence
   */
  public exportData(): {
    score: number;
    history: ScoreEvent[];
    timestamp: number;
  } {
    return {
      score: this.currentScore,
      history: this.scoreHistory,
      timestamp: Date.now(),
    };
  }

  /**
   * Import score data from persistence
   */
  public importData(data: {
    score: number;
    history: ScoreEvent[];
  }): void {
    this.currentScore = data.score;
    this.scoreHistory = data.history;
    
    // Recalculate combo state
    if (this.scoreHistory.length > 0) {
      const lastEvent = this.scoreHistory[this.scoreHistory.length - 1];
      this.lastScoreTime = lastEvent.timestamp;
      
      // Calculate current combo
      this.comboCount = this.calculateCurrentCombo();
    }
  }

  /**
   * Calculate current combo from history
   */
  private calculateCurrentCombo(): number {
    if (this.scoreHistory.length === 0) return 0;

    let combo = 0;
    const now = Date.now();
    
    // Count back from the latest event
    for (let i = this.scoreHistory.length - 1; i >= 0; i--) {
      const event = this.scoreHistory[i];
      const timeDiff = i === this.scoreHistory.length - 1 
        ? now - event.timestamp 
        : this.scoreHistory[i + 1].timestamp - event.timestamp;

      if ((event.type === 'food' || event.type === 'combo') && 
          timeDiff <= this.comboTimeWindow) {
        combo++;
      } else {
        break;
      }
    }

    return combo;
  }

  /**
   * Clear all subscribers (useful for cleanup)
   */
  public clearSubscribers(): void {
    this.scoreCallbacks = [];
  }

  /**
   * Get scoring system status for debugging
   */
  public getStatus(): {
    currentScore: number;
    eventCount: number;
    comboCount: number;
    subscriberCount: number;
    lastScoreAge: number;
  } {
    return {
      currentScore: this.currentScore,
      eventCount: this.scoreHistory.length,
      comboCount: this.comboCount,
      subscriberCount: this.scoreCallbacks.length,
      lastScoreAge: this.lastScoreTime > 0 ? Date.now() - this.lastScoreTime : 0,
    };
  }
}