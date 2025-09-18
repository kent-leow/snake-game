import { ScoreManager } from '../ScoreManager';

describe('ScoreManager', () => {
  let scoreManager: ScoreManager;

  beforeEach(() => {
    scoreManager = new ScoreManager();
  });

  describe('Initialization', () => {
    it('should initialize with zero score', () => {
      expect(scoreManager.getCurrentScore()).toBe(0);
    });

    it('should initialize with custom initial score', () => {
      const customScoreManager = new ScoreManager(100);
      expect(customScoreManager.getCurrentScore()).toBe(100);
    });

    it('should initialize with empty score breakdown', () => {
      const breakdown = scoreManager.getScoreBreakdown();
      expect(breakdown).toEqual({
        currentScore: 0,
        totalCombos: 0,
        basePointsEarned: 0,
        comboBonusEarned: 0,
        averageComboLength: 0,
      });
    });

    it('should initialize with empty score history', () => {
      expect(scoreManager.getScoreHistory()).toEqual([]);
    });
  });

  describe('Basic Score Operations', () => {
    it('should add food points correctly', () => {
      scoreManager.addFoodPoints(10);
      
      expect(scoreManager.getCurrentScore()).toBe(10);
      
      const breakdown = scoreManager.getScoreBreakdown();
      expect(breakdown.basePointsEarned).toBe(10);
      expect(breakdown.comboBonusEarned).toBe(0);
    });

    it('should add combo bonus correctly', () => {
      scoreManager.addComboBonus(5);
      
      expect(scoreManager.getCurrentScore()).toBe(5);
      
      const breakdown = scoreManager.getScoreBreakdown();
      expect(breakdown.basePointsEarned).toBe(0);
      expect(breakdown.comboBonusEarned).toBe(5);
      expect(breakdown.totalCombos).toBe(1);
    });

    it('should add combined score correctly', () => {
      const breakdown = scoreManager.addScore(10, 5);
      
      expect(breakdown.basePoints).toBe(10);
      expect(breakdown.comboBonus).toBe(5);
      expect(breakdown.totalPoints).toBe(15);
      expect(breakdown.timestamp).toBeGreaterThan(0);
      
      expect(scoreManager.getCurrentScore()).toBe(15);
    });

    it('should handle multiple score additions', () => {
      scoreManager.addScore(10, 0); // Food only
      scoreManager.addScore(10, 5); // Food + combo
      scoreManager.addScore(0, 5);  // Combo only
      
      expect(scoreManager.getCurrentScore()).toBe(30);
      
      const gameScore = scoreManager.getScoreBreakdown();
      expect(gameScore.basePointsEarned).toBe(20);
      expect(gameScore.comboBonusEarned).toBe(10);
      expect(gameScore.totalCombos).toBe(2);
    });
  });

  describe('Score History', () => {
    it('should track score breakdown history', () => {
      scoreManager.addScore(10, 0);
      scoreManager.addScore(10, 5);
      
      const history = scoreManager.getScoreHistory();
      expect(history).toHaveLength(2);
      
      expect(history[0]).toEqual({
        basePoints: 10,
        comboBonus: 0,
        totalPoints: 10,
        timestamp: expect.any(Number),
      });
      
      expect(history[1]).toEqual({
        basePoints: 10,
        comboBonus: 5,
        totalPoints: 15,
        timestamp: expect.any(Number),
      });
    });

    it('should return recent breakdowns', () => {
      // Add 10 score events
      for (let i = 0; i < 10; i++) {
        scoreManager.addScore(10, i % 2 === 0 ? 5 : 0);
      }
      
      const recent = scoreManager.getRecentBreakdowns(3);
      expect(recent).toHaveLength(3);
      
      // Should be the last 3 entries
      const allHistory = scoreManager.getScoreHistory();
      expect(recent).toEqual(allHistory.slice(-3));
    });

    it('should limit history size to prevent memory issues', () => {
      // Add more than 1000 entries
      for (let i = 0; i < 1050; i++) {
        scoreManager.addScore(1, 0);
      }
      
      const history = scoreManager.getScoreHistory();
      expect(history).toHaveLength(1000);
      expect(scoreManager.getCurrentScore()).toBe(1050);
    });
  });

  describe('Score Statistics', () => {
    it('should calculate average combo length correctly', () => {
      // Simulate combos with different bonus amounts
      scoreManager.addScore(10, 5);  // 1-length combo
      scoreManager.addScore(10, 10); // 2-length combo
      scoreManager.addScore(10, 5);  // 1-length combo
      
      const breakdown = scoreManager.getScoreBreakdown();
      expect(breakdown.averageComboLength).toBeCloseTo(1.33, 2);
    });

    it('should track total combos accurately', () => {
      scoreManager.addScore(10, 0);  // No combo
      scoreManager.addScore(10, 5);  // Combo
      scoreManager.addScore(10, 0);  // No combo
      scoreManager.addScore(10, 5);  // Combo
      
      const breakdown = scoreManager.getScoreBreakdown();
      expect(breakdown.totalCombos).toBe(2);
    });

    it('should calculate efficiency metrics', () => {
      scoreManager.addScore(10, 5);  // Food + combo
      scoreManager.addScore(10, 0);  // Food only
      scoreManager.addScore(10, 5);  // Food + combo
      
      const metrics = scoreManager.getEfficiencyMetrics();
      
      // 2 combos out of 3 events = 66.67% efficiency
      expect(metrics.comboEfficiency).toBeCloseTo(66.67, 1);
      
      // 40 total points / 3 events = 13.33 points per event
      expect(metrics.averagePointsPerEvent).toBeCloseTo(13.33, 1);
      
      // 10 combo points / 40 total = 25% contribution
      expect(metrics.comboContribution).toBe(25);
    });
  });

  describe('Event Callbacks', () => {
    it('should notify subscribers of score updates', () => {
      const mockCallback = jest.fn();
      const unsubscribe = scoreManager.onScoreUpdate(mockCallback);
      
      scoreManager.addScore(10, 5);
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentScore: 15,
          totalCombos: 1,
          basePointsEarned: 10,
          comboBonusEarned: 5,
        }),
        expect.objectContaining({
          basePoints: 10,
          comboBonus: 5,
          totalPoints: 15,
          timestamp: expect.any(Number),
        })
      );
      
      unsubscribe();
    });

    it('should allow unsubscribing from updates', () => {
      const mockCallback = jest.fn();
      const unsubscribe = scoreManager.onScoreUpdate(mockCallback);
      
      scoreManager.addScore(10, 0);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      scoreManager.addScore(10, 0);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();
      
      scoreManager.onScoreUpdate(errorCallback);
      scoreManager.onScoreUpdate(normalCallback);
      
      // Should not throw error and should call normal callback
      expect(() => scoreManager.addScore(10, 0)).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });

    it('should clear all callbacks', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      scoreManager.onScoreUpdate(mockCallback1);
      scoreManager.onScoreUpdate(mockCallback2);
      
      scoreManager.clearCallbacks();
      scoreManager.addScore(10, 0);
      
      expect(mockCallback1).not.toHaveBeenCalled();
      expect(mockCallback2).not.toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state to initial values', () => {
      // Add some data
      scoreManager.addScore(10, 5);
      scoreManager.addScore(10, 0);
      
      expect(scoreManager.getCurrentScore()).toBeGreaterThan(0);
      expect(scoreManager.getScoreHistory()).not.toHaveLength(0);
      
      scoreManager.reset();
      
      expect(scoreManager.getCurrentScore()).toBe(0);
      expect(scoreManager.getScoreHistory()).toHaveLength(0);
      
      const breakdown = scoreManager.getScoreBreakdown();
      expect(breakdown).toEqual({
        currentScore: 0,
        totalCombos: 0,
        basePointsEarned: 0,
        comboBonusEarned: 0,
        averageComboLength: 0,
      });
    });
  });

  describe('Data Persistence', () => {
    it('should export data correctly', () => {
      scoreManager.addScore(10, 5);
      scoreManager.addScore(10, 0);
      
      const exportedData = scoreManager.exportData();
      
      expect(exportedData).toEqual({
        score: 25,
        totals: expect.objectContaining({
          currentScore: 25,
          totalCombos: 1,
          basePointsEarned: 20,
          comboBonusEarned: 5,
        }),
        history: expect.arrayContaining([
          expect.objectContaining({
            basePoints: 10,
            comboBonus: 5,
            totalPoints: 15,
          }),
        ]),
        timestamp: expect.any(Number),
      });
    });

    it('should import data correctly', () => {
      const testData = {
        score: 50,
        totals: {
          currentScore: 50,
          totalCombos: 2,
          basePointsEarned: 40,
          comboBonusEarned: 10,
          averageComboLength: 1,
        },
        history: [
          { basePoints: 10, comboBonus: 5, totalPoints: 15, timestamp: Date.now() },
          { basePoints: 10, comboBonus: 0, totalPoints: 10, timestamp: Date.now() },
          { basePoints: 20, comboBonus: 5, totalPoints: 25, timestamp: Date.now() },
        ],
      };
      
      scoreManager.importData(testData);
      
      expect(scoreManager.getCurrentScore()).toBe(50);
      expect(scoreManager.getScoreHistory()).toHaveLength(3);
      
      const breakdown = scoreManager.getScoreBreakdown();
      expect(breakdown.totalCombos).toBe(2);
      expect(breakdown.basePointsEarned).toBe(40);
      expect(breakdown.comboBonusEarned).toBe(10);
    });
  });

  describe('State Validation', () => {
    it('should validate consistent state', () => {
      scoreManager.addScore(10, 5);
      scoreManager.addScore(10, 0);
      
      const validation = scoreManager.validateState();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should provide debug information', () => {
      scoreManager.addScore(10, 5);
      scoreManager.addScore(10, 0);
      
      const debugInfo = scoreManager.getDebugInfo();
      
      expect(debugInfo).toEqual({
        currentScore: 25,
        breakdownCounts: {
          total: 2,
          withBase: 2,
          withCombo: 1,
        },
        historySize: 2,
        callbackCount: 0,
        lastBreakdown: expect.objectContaining({
          basePoints: 10,
          comboBonus: 0,
          totalPoints: 10,
        }),
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should update score within acceptable time (performance test)', () => {
      const startTime = performance.now();
      
      // Simulate rapid score updates
      for (let i = 0; i < 100; i++) {
        scoreManager.addScore(10, i % 2 === 0 ? 5 : 0);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete 100 updates in reasonable time (less than 50ms)
      expect(totalTime).toBeLessThan(50);
    });
  });

  describe('Integration with Combo System', () => {
    it('should handle combo scoring according to task specification', () => {
      // Test the exact scenario from task: base points (10) + combo bonus (5)
      const breakdown = scoreManager.addScore(10, 5);
      
      expect(breakdown.basePoints).toBe(10);
      expect(breakdown.comboBonus).toBe(5);
      expect(breakdown.totalPoints).toBe(15);
      expect(scoreManager.getCurrentScore()).toBe(15);
      
      const gameScore = scoreManager.getScoreBreakdown();
      expect(gameScore.currentScore).toBe(15);
      expect(gameScore.basePointsEarned).toBe(10);
      expect(gameScore.comboBonusEarned).toBe(5);
      expect(gameScore.totalCombos).toBe(1);
    });

    it('should handle food consumption without combo', () => {
      // Test base points only
      const breakdown = scoreManager.addScore(10, 0);
      
      expect(breakdown.basePoints).toBe(10);
      expect(breakdown.comboBonus).toBe(0);
      expect(breakdown.totalPoints).toBe(10);
      
      const gameScore = scoreManager.getScoreBreakdown();
      expect(gameScore.totalCombos).toBe(0);
    });

    it('should provide accurate score breakdown for debugging', () => {
      // Multiple foods with some combos
      scoreManager.addScore(10, 0);  // Food 1: no combo
      scoreManager.addScore(10, 5);  // Food 2: combo
      scoreManager.addScore(10, 0);  // Food 3: no combo  
      scoreManager.addScore(10, 5);  // Food 4: combo
      
      const pointsByType = scoreManager.getPointsByType();
      expect(pointsByType).toEqual({
        base: 40,
        combo: 10,
        total: 50,
      });
      
      const gameScore = scoreManager.getScoreBreakdown();
      expect(gameScore.totalCombos).toBe(2);
      expect(gameScore.averageComboLength).toBe(1); // Each combo worth 5 points = 1 length
    });
  });
});