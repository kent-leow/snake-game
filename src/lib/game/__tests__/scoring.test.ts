import { ScoringSystem } from '../scoring';
import type { ScoreEvent } from '../scoring';

describe('ScoringSystem', () => {
  let scoringSystem: ScoringSystem;

  beforeEach(() => {
    scoringSystem = new ScoringSystem();
  });

  describe('Basic Score Operations', () => {
    it('should initialize with zero score', () => {
      expect(scoringSystem.getCurrentScore()).toBe(0);
    });

    it('should initialize with custom initial score', () => {
      const customScoringSystem = new ScoringSystem(100);
      expect(customScoringSystem.getCurrentScore()).toBe(100);
    });

    it('should add score for food consumption', () => {
      const initialScore = scoringSystem.getCurrentScore();
      const points = 10;

      const newScore = scoringSystem.addScore({
        type: 'food',
        points,
        position: { x: 100, y: 100 },
      });

      expect(newScore).toBe(initialScore + points);
      expect(scoringSystem.getCurrentScore()).toBe(initialScore + points);
    });

    it('should add score for bonus events', () => {
      const initialScore = scoringSystem.getCurrentScore();
      const points = 50;

      const newScore = scoringSystem.addScore({
        type: 'bonus',
        points,
      });

      expect(newScore).toBe(initialScore + points);
      expect(scoringSystem.getCurrentScore()).toBe(initialScore + points);
    });

    it('should reset score to zero', () => {
      scoringSystem.addScore({ type: 'food', points: 100 });
      expect(scoringSystem.getCurrentScore()).toBe(100);

      scoringSystem.resetScore();
      expect(scoringSystem.getCurrentScore()).toBe(0);
    });
  });

  describe('Score History', () => {
    it('should track score events in history', () => {
      const event1 = { type: 'food' as const, points: 10 };
      const event2 = { type: 'bonus' as const, points: 50 };

      scoringSystem.addScore(event1);
      scoringSystem.addScore(event2);

      const history = scoringSystem.getScoreHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({
        type: 'food',
        points: 10,
      });
      expect(history[1]).toMatchObject({
        type: 'bonus',
        points: 50,
      });
    });

    it('should include timestamps in score events', () => {
      const beforeTime = Date.now();
      scoringSystem.addScore({ type: 'food', points: 10 });
      const afterTime = Date.now();

      const history = scoringSystem.getScoreHistory();
      expect(history[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(history[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should get recent events', () => {
      // Add 10 events
      for (let i = 0; i < 10; i++) {
        scoringSystem.addScore({ type: 'food', points: 10 });
      }

      const recentEvents = scoringSystem.getRecentEvents(5);
      expect(recentEvents).toHaveLength(5);
      
      // Should be the last 5 events
      const allEvents = scoringSystem.getScoreHistory();
      expect(recentEvents).toEqual(allEvents.slice(-5));
    });
  });

  describe('Score Callbacks', () => {
    it('should notify subscribers of score changes', () => {
      const callback = jest.fn();
      const unsubscribe = scoringSystem.subscribeToScoreChanges(callback);

      scoringSystem.addScore({ type: 'food', points: 10 });

      expect(callback).toHaveBeenCalledWith(10, expect.objectContaining({
        type: 'food',
        points: 10,
      }));

      unsubscribe();
    });

    it('should allow multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      scoringSystem.subscribeToScoreChanges(callback1);
      scoringSystem.subscribeToScoreChanges(callback2);

      scoringSystem.addScore({ type: 'food', points: 10 });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe callbacks correctly', () => {
      const callback = jest.fn();
      const unsubscribe = scoringSystem.subscribeToScoreChanges(callback);

      scoringSystem.addScore({ type: 'food', points: 10 });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      scoringSystem.addScore({ type: 'food', points: 10 });
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Combo System', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should track combo count for consecutive food consumption', () => {
      scoringSystem.addScore({ type: 'food', points: 10 });
      expect(scoringSystem.getCurrentCombo()).toBe(1);

      // Advance time by 1 second (within combo window)
      jest.advanceTimersByTime(1000);
      scoringSystem.addScore({ type: 'food', points: 10 });
      expect(scoringSystem.getCurrentCombo()).toBe(2);
    });

    it('should reset combo when time window expires', () => {
      scoringSystem.addScore({ type: 'food', points: 10 });
      expect(scoringSystem.getCurrentCombo()).toBe(1);

      // Advance time beyond combo window (3 seconds)
      jest.advanceTimersByTime(3000);
      scoringSystem.addScore({ type: 'food', points: 10 });
      expect(scoringSystem.getCurrentCombo()).toBe(1); // Reset to 1
    });

    it('should add combo bonus points for consecutive food', () => {
      // First food - no combo bonus
      scoringSystem.addScore({ type: 'food', points: 10 });
      expect(scoringSystem.getCurrentScore()).toBe(10);

      // Second food within combo window - should get bonus
      jest.advanceTimersByTime(1000);
      scoringSystem.addScore({ type: 'food', points: 10 });
      expect(scoringSystem.getCurrentScore()).toBeGreaterThan(20); // 10 + 10 + bonus
    });
  });

  describe('Statistics', () => {
    it('should calculate basic statistics', () => {
      scoringSystem.addScore({ type: 'food', points: 10 });
      scoringSystem.addScore({ type: 'food', points: 20 });
      scoringSystem.addScore({ type: 'bonus', points: 50 });

      const stats = scoringSystem.getStatistics();
      expect(stats.totalScore).toBe(80);
      expect(stats.totalEvents).toBe(3);
      expect(stats.averageScore).toBeCloseTo(26.67, 1);
    });

    it('should break down scores by type', () => {
      scoringSystem.addScore({ type: 'food', points: 10 });
      scoringSystem.addScore({ type: 'food', points: 20 });
      scoringSystem.addScore({ type: 'bonus', points: 50 });

      const stats = scoringSystem.getStatistics();
      expect(stats.scoreBreakdown.food).toBe(30);
      expect(stats.scoreBreakdown.bonus).toBe(50);
    });

    it('should track highest single score', () => {
      scoringSystem.addScore({ type: 'food', points: 10 });
      scoringSystem.addScore({ type: 'bonus', points: 100 });
      scoringSystem.addScore({ type: 'food', points: 20 });

      const stats = scoringSystem.getStatistics();
      expect(stats.highestSingleScore).toBe(100);
    });
  });

  describe('Utility Methods', () => {
    it('should format score for display', () => {
      scoringSystem.addScore({ type: 'food', points: 1234 });
      expect(scoringSystem.getFormattedScore()).toBe('1,234');
    });

    it('should add bonus score with convenience method', () => {
      const initialScore = scoringSystem.getCurrentScore();
      const points = 25;
      const position = { x: 50, y: 50 };

      const newScore = scoringSystem.addBonusScore(points, position);
      expect(newScore).toBe(initialScore + points);
      
      const history = scoringSystem.getScoreHistory();
      expect(history[0]).toMatchObject({
        type: 'bonus',
        points,
        position,
      });
    });

    it('should check milestones correctly', () => {
      const milestones = [100, 500, 1000];
      
      // Score 50 points - no milestone
      scoringSystem.addScore({ type: 'food', points: 50 });
      expect(scoringSystem.checkMilestone(milestones)).toBeNull();

      // Score 60 more points (total 110) - should hit 100 milestone
      scoringSystem.addScore({ type: 'food', points: 60 });
      expect(scoringSystem.checkMilestone(milestones)).toBe(100);
    });

    it('should export and import data correctly', () => {
      scoringSystem.addScore({ type: 'food', points: 10 });
      scoringSystem.addScore({ type: 'bonus', points: 50 });

      const exportedData = scoringSystem.exportData();
      expect(exportedData.score).toBe(60);
      expect(exportedData.history).toHaveLength(2);

      const newScoringSystem = new ScoringSystem();
      newScoringSystem.importData(exportedData);

      expect(newScoringSystem.getCurrentScore()).toBe(60);
      expect(newScoringSystem.getScoreHistory()).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero and negative points', () => {
      scoringSystem.addScore({ type: 'food', points: 0 });
      expect(scoringSystem.getCurrentScore()).toBe(0);

      scoringSystem.addScore({ type: 'bonus', points: -10 });
      expect(scoringSystem.getCurrentScore()).toBe(-10);
    });

    it('should handle events without position', () => {
      const event: Omit<ScoreEvent, 'timestamp'> = {
        type: 'bonus',
        points: 25,
      };

      expect(() => {
        scoringSystem.addScore(event);
      }).not.toThrow();

      const history = scoringSystem.getScoreHistory();
      expect(history[0].position).toBeUndefined();
    });

    it('should clear all subscribers', () => {
      const callback = jest.fn();
      scoringSystem.subscribeToScoreChanges(callback);
      
      scoringSystem.clearSubscribers();
      scoringSystem.addScore({ type: 'food', points: 10 });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle large number of score events efficiently', () => {
      const startTime = performance.now();
      
      // Add 1000 score events
      for (let i = 0; i < 1000; i++) {
        scoringSystem.addScore({ type: 'food', points: 10 });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
      expect(scoringSystem.getCurrentScore()).toBe(10000);
      expect(scoringSystem.getScoreHistory()).toHaveLength(1000);
    });
  });
});