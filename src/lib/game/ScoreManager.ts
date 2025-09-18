/**
 * Score breakdown for individual scoring events
 */
export interface ScoreBreakdown {
  basePoints: number;
  comboBonus: number;
  totalPoints: number;
  timestamp: number;
}

/**
 * Comprehensive game score statistics
 */
export interface GameScore {
  currentScore: number;
  totalCombos: number;
  basePointsEarned: number;
  comboBonusEarned: number;
  averageComboLength: number;
}

/**
 * Score change callback function type
 */
export type ScoreChangeCallback = (score: GameScore, breakdown: ScoreBreakdown) => void;

/**
 * Enhanced ScoreManager that handles both base food points and combo bonus points
 * Provides unified scoring interface with detailed breakdown and statistics
 */
export class ScoreManager {
  private currentScore: number = 0;
  private totalCombos: number = 0;
  private basePointsEarned: number = 0;
  private comboBonusEarned: number = 0;
  private scoreHistory: ScoreBreakdown[] = [];
  private callbacks: ScoreChangeCallback[] = [];
  private comboLengths: number[] = [];

  constructor(initialScore: number = 0) {
    this.currentScore = initialScore;
  }

  /**
   * Add base food points without combo bonus
   */
  public addFoodPoints(basePoints: number): void {
    this.addScore(basePoints, 0);
  }

  /**
   * Add combo bonus points
   */
  public addComboBonus(bonusPoints: number): void {
    this.addScore(0, bonusPoints);
  }

  /**
   * Add score with both base points and combo bonus
   * Returns detailed breakdown for transparency and debugging
   */
  public addScore(basePoints: number, comboBonus: number): ScoreBreakdown {
    const breakdown: ScoreBreakdown = {
      basePoints,
      comboBonus,
      totalPoints: basePoints + comboBonus,
      timestamp: Date.now(),
    };

    // Update running totals
    this.currentScore += breakdown.totalPoints;
    this.basePointsEarned += basePoints;
    this.comboBonusEarned += comboBonus;

    // Track combo completion
    if (comboBonus > 0) {
      this.totalCombos++;
      // Estimate combo length based on bonus (assuming 5 points per combo)
      const estimatedLength = Math.max(1, Math.floor(comboBonus / 5));
      this.comboLengths.push(estimatedLength);
    }

    // Add to history with size limit
    this.scoreHistory.push(breakdown);
    if (this.scoreHistory.length > 1000) {
      this.scoreHistory = this.scoreHistory.slice(-1000);
    }

    // Notify subscribers
    this.notifyScoreUpdate(breakdown);

    return breakdown;
  }

  /**
   * Get current total score
   */
  public getCurrentScore(): number {
    return this.currentScore;
  }

  /**
   * Get comprehensive score breakdown and statistics
   */
  public getScoreBreakdown(): GameScore {
    const averageComboLength = this.comboLengths.length > 0
      ? this.comboLengths.reduce((sum, length) => sum + length, 0) / this.comboLengths.length
      : 0;

    return {
      currentScore: this.currentScore,
      totalCombos: this.totalCombos,
      basePointsEarned: this.basePointsEarned,
      comboBonusEarned: this.comboBonusEarned,
      averageComboLength,
    };
  }

  /**
   * Get score breakdown history
   */
  public getScoreHistory(): ScoreBreakdown[] {
    return [...this.scoreHistory];
  }

  /**
   * Get recent score breakdowns (last N events)
   */
  public getRecentBreakdowns(count: number = 5): ScoreBreakdown[] {
    return this.scoreHistory.slice(-count);
  }

  /**
   * Reset score manager to initial state
   */
  public reset(): void {
    this.currentScore = 0;
    this.totalCombos = 0;
    this.basePointsEarned = 0;
    this.comboBonusEarned = 0;
    this.scoreHistory = [];
    this.comboLengths = [];
  }

  /**
   * Subscribe to score updates with detailed breakdown
   */
  public onScoreUpdate(callback: ScoreChangeCallback): () => void {
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
   * Clear all score update callbacks
   */
  public clearCallbacks(): void {
    this.callbacks = [];
  }

  /**
   * Get total points by type
   */
  public getPointsByType(): { base: number; combo: number; total: number } {
    return {
      base: this.basePointsEarned,
      combo: this.comboBonusEarned,
      total: this.currentScore,
    };
  }

  /**
   * Get score efficiency metrics
   */
  public getEfficiencyMetrics(): {
    comboEfficiency: number;
    averagePointsPerEvent: number;
    comboContribution: number;
  } {
    const totalEvents = this.scoreHistory.length;
    const comboEvents = this.scoreHistory.filter(h => h.comboBonus > 0).length;
    
    const comboEfficiency = totalEvents > 0 
      ? (comboEvents / totalEvents) * 100 
      : 0;
    
    const averagePointsPerEvent = totalEvents > 0 
      ? this.currentScore / totalEvents 
      : 0;
    
    const comboContribution = this.currentScore > 0 
      ? (this.comboBonusEarned / this.currentScore) * 100 
      : 0;

    return {
      comboEfficiency,
      averagePointsPerEvent,
      comboContribution,
    };
  }

  /**
   * Export score data for persistence
   */
  public exportData(): {
    score: number;
    totals: GameScore;
    history: ScoreBreakdown[];
    timestamp: number;
  } {
    return {
      score: this.currentScore,
      totals: this.getScoreBreakdown(),
      history: this.scoreHistory,
      timestamp: Date.now(),
    };
  }

  /**
   * Import score data from persistence
   */
  public importData(data: {
    score: number;
    totals: GameScore;
    history: ScoreBreakdown[];
  }): void {
    this.currentScore = data.score;
    this.totalCombos = data.totals.totalCombos;
    this.basePointsEarned = data.totals.basePointsEarned;
    this.comboBonusEarned = data.totals.comboBonusEarned;
    this.scoreHistory = data.history;
    
    // Rebuild combo lengths from history
    this.comboLengths = this.scoreHistory
      .filter(breakdown => breakdown.comboBonus > 0)
      .map(breakdown => Math.max(1, Math.floor(breakdown.comboBonus / 5)));
  }

  /**
   * Validate internal state consistency for debugging
   */
  public validateState(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check score consistency
    const calculatedScore = this.basePointsEarned + this.comboBonusEarned;
    if (this.currentScore !== calculatedScore) {
      errors.push(`Score mismatch: current=${this.currentScore}, calculated=${calculatedScore}`);
    }

    // Check history consistency
    const historyBase = this.scoreHistory.reduce((sum, b) => sum + b.basePoints, 0);
    const historyCombo = this.scoreHistory.reduce((sum, b) => sum + b.comboBonus, 0);
    
    if (this.basePointsEarned !== historyBase) {
      errors.push(`Base points mismatch: tracked=${this.basePointsEarned}, history=${historyBase}`);
    }
    
    if (this.comboBonusEarned !== historyCombo) {
      errors.push(`Combo bonus mismatch: tracked=${this.comboBonusEarned}, history=${historyCombo}`);
    }

    // Check combo count consistency
    const historyComboCount = this.scoreHistory.filter(b => b.comboBonus > 0).length;
    if (this.totalCombos !== historyComboCount) {
      errors.push(`Combo count mismatch: tracked=${this.totalCombos}, history=${historyComboCount}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get debug information about current state
   */
  public getDebugInfo(): {
    currentScore: number;
    breakdownCounts: Record<string, number>;
    historySize: number;
    callbackCount: number;
    lastBreakdown?: ScoreBreakdown;
  } {
    const recentBreakdown = this.scoreHistory[this.scoreHistory.length - 1];
    
    return {
      currentScore: this.currentScore,
      breakdownCounts: {
        total: this.scoreHistory.length,
        withBase: this.scoreHistory.filter(b => b.basePoints > 0).length,
        withCombo: this.scoreHistory.filter(b => b.comboBonus > 0).length,
      },
      historySize: this.scoreHistory.length,
      callbackCount: this.callbacks.length,
      lastBreakdown: recentBreakdown,
    };
  }

  /**
   * Notify all subscribers of score update
   */
  private notifyScoreUpdate(breakdown: ScoreBreakdown): void {
    const gameScore = this.getScoreBreakdown();
    
    this.callbacks.forEach(callback => {
      try {
        callback(gameScore, breakdown);
      } catch (error) {
        console.error('Error in score update callback:', error);
      }
    });
  }
}