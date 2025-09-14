import { SnakeGrowthManager } from '../snakeGrowth';
import type { Snake } from '../types';

describe('SnakeGrowthManager', () => {
  let snake: Snake;
  let growthManager: SnakeGrowthManager;

  beforeEach(() => {
    snake = {
      segments: [
        { x: 20, y: 20, id: 'head' },
        { x: 10, y: 20, id: 'body-1' },
        { x: 0, y: 20, id: 'body-2' },
      ],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      isGrowing: false,
    };
    growthManager = new SnakeGrowthManager(snake);
  });

  describe('Basic Growth Operations', () => {
    it('should initialize with no pending growth', () => {
      expect(growthManager.getPendingGrowth()).toBe(0);
      expect(growthManager.isGrowing()).toBe(false);
    });

    it('should add growth to pending queue', () => {
      growthManager.addGrowth(2, 'food');
      expect(growthManager.getPendingGrowth()).toBe(2);
      expect(growthManager.isGrowing()).toBe(true);
    });

    it('should process pending growth one segment at a time', () => {
      growthManager.addGrowth(3, 'food');
      
      // First process
      const result1 = growthManager.processGrowth();
      expect(result1).toBe(true);
      expect(growthManager.getPendingGrowth()).toBe(2);
      expect(snake.isGrowing).toBe(true);

      // Second process
      const result2 = growthManager.processGrowth();
      expect(result2).toBe(true);
      expect(growthManager.getPendingGrowth()).toBe(1);
      expect(snake.isGrowing).toBe(true);

      // Third process
      const result3 = growthManager.processGrowth();
      expect(result3).toBe(true);
      expect(growthManager.getPendingGrowth()).toBe(0);
      expect(snake.isGrowing).toBe(true);

      // Fourth process (no more growth)
      const result4 = growthManager.processGrowth();
      expect(result4).toBe(false);
      expect(growthManager.getPendingGrowth()).toBe(0);
      expect(snake.isGrowing).toBe(false);
    });

    it('should execute growth by clearing the growing flag', () => {
      snake.isGrowing = true;
      growthManager.executeGrowth();
      expect(snake.isGrowing).toBe(false);
    });

    it('should get current snake length', () => {
      expect(growthManager.getSnakeLength()).toBe(3);
    });
  });

  describe('Growth Events and History', () => {
    it('should track growth events in history', () => {
      growthManager.addGrowth(1, 'food');
      growthManager.addGrowth(2, 'bonus');

      const history = growthManager.getGrowthHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({
        segments: 1,
        reason: 'food',
      });
      expect(history[1]).toMatchObject({
        segments: 2,
        reason: 'bonus',
      });
    });

    it('should include timestamps in growth events', () => {
      const beforeTime = Date.now();
      growthManager.addGrowth(1, 'food');
      const afterTime = Date.now();

      const history = growthManager.getGrowthHistory();
      expect(history[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(history[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should get recent growth events', () => {
      // Add 10 growth events
      for (let i = 0; i < 10; i++) {
        growthManager.addGrowth(1, 'food');
      }

      const recentEvents = growthManager.getRecentGrowthEvents(3);
      expect(recentEvents).toHaveLength(3);
      
      // Should be the last 3 events
      const allEvents = growthManager.getGrowthHistory();
      expect(recentEvents).toEqual(allEvents.slice(-3));
    });
  });

  describe('Growth Statistics', () => {
    it('should calculate basic growth statistics', () => {
      growthManager.addGrowth(2, 'food');
      growthManager.addGrowth(1, 'bonus');
      growthManager.addGrowth(3, 'food');

      const stats = growthManager.getStatistics();
      expect(stats.totalGrowth).toBe(6);
      expect(stats.currentLength).toBe(3); // Original snake length
      expect(stats.growthEvents).toBe(3);
      expect(stats.averageGrowthRate).toBeCloseTo(2, 1);
      expect(stats.largestGrowthEvent).toBe(3);
    });

    it('should get total growth by reason', () => {
      growthManager.addGrowth(2, 'food');
      growthManager.addGrowth(1, 'bonus');
      growthManager.addGrowth(3, 'food');

      expect(growthManager.getTotalGrowthByReason('food')).toBe(5);
      expect(growthManager.getTotalGrowthByReason('bonus')).toBe(1);
      expect(growthManager.getTotalGrowthByReason('manual')).toBe(0);
    });

    it('should calculate predicted length', () => {
      growthManager.addGrowth(5, 'food');
      expect(growthManager.getPredictedLength()).toBe(8); // 3 + 5
    });
  });

  describe('Growth Limits and Controls', () => {
    it('should respect maximum pending growth limit', () => {
      growthManager.setMaxPendingGrowth(3);
      growthManager.addGrowth(5, 'food');
      
      // Should only add 3 segments due to limit
      expect(growthManager.getPendingGrowth()).toBe(3);
    });

    it('should add growth with length limit', () => {
      const maxLength = 5;
      const actualGrowth = growthManager.addGrowthWithLimit(5, maxLength, 'food');
      
      // Should only add 2 segments (5 - 3 current length)
      expect(actualGrowth).toBe(2);
      expect(growthManager.getPendingGrowth()).toBe(2);
    });

    it('should check if growth would exceed maximum length', () => {
      growthManager.addGrowth(3, 'food');
      
      expect(growthManager.wouldExceedMaxLength(5)).toBe(true); // 3 + 3 > 5
      expect(growthManager.wouldExceedMaxLength(10)).toBe(false); // 3 + 3 <= 10
    });

    it('should clear pending growth', () => {
      growthManager.addGrowth(5, 'food');
      expect(growthManager.getPendingGrowth()).toBe(5);
      
      growthManager.clearPendingGrowth();
      expect(growthManager.getPendingGrowth()).toBe(0);
      expect(snake.isGrowing).toBe(false);
    });
  });

  describe('Immediate Growth', () => {
    it('should grow snake immediately by adding segments', () => {
      const initialLength = snake.segments.length;
      growthManager.growSnakeImmediate(2);
      
      expect(snake.segments.length).toBe(initialLength + 2);
      
      // New segments should be at tail position
      const tail = snake.segments[initialLength - 1];
      const newSegment1 = snake.segments[initialLength];
      const newSegment2 = snake.segments[initialLength + 1];
      
      expect(newSegment1.x).toBe(tail.x);
      expect(newSegment1.y).toBe(tail.y);
      expect(newSegment2.x).toBe(tail.x);
      expect(newSegment2.y).toBe(tail.y);
    });

    it('should record immediate growth in history', () => {
      growthManager.growSnakeImmediate(1);
      
      const history = growthManager.getGrowthHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        segments: 1,
        reason: 'manual',
      });
    });

    it('should handle zero or negative immediate growth', () => {
      const initialLength = snake.segments.length;
      
      growthManager.growSnakeImmediate(0);
      expect(snake.segments.length).toBe(initialLength);
      
      growthManager.growSnakeImmediate(-1);
      expect(snake.segments.length).toBe(initialLength);
    });
  });

  describe('Growth Rate Calculations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate growth rate over time', () => {
      growthManager.addGrowth(2, 'food');
      jest.advanceTimersByTime(60000); // 1 minute
      growthManager.addGrowth(4, 'food');
      
      const rate = growthManager.getGrowthRate();
      expect(rate).toBeCloseTo(6, 1); // 6 segments per minute
    });

    it('should return zero growth rate with no history', () => {
      expect(growthManager.getGrowthRate()).toBe(0);
    });

    it('should calculate growth efficiency', () => {
      growthManager.addGrowth(1, 'food'); // 1 segment per food
      growthManager.addGrowth(1, 'food'); // 1 segment per food
      growthManager.addGrowth(2, 'bonus'); // bonus doesn't count
      
      const efficiency = growthManager.getGrowthEfficiency();
      expect(efficiency).toBe(1); // 2 segments / 2 food events = 1
    });
  });

  describe('State Management', () => {
    it('should reset to initial state', () => {
      growthManager.addGrowth(5, 'food');
      growthManager.processGrowth();
      
      growthManager.reset();
      
      expect(growthManager.getPendingGrowth()).toBe(0);
      expect(growthManager.getGrowthHistory()).toHaveLength(0);
      expect(snake.isGrowing).toBe(false);
    });

    it('should update snake reference', () => {
      const newSnake: Snake = {
        segments: [{ x: 0, y: 0, id: 'new-head' }],
        direction: 'UP',
        nextDirection: 'UP',
        isGrowing: false,
      };

      growthManager.updateSnakeReference(newSnake);
      expect(growthManager.getSnakeLength()).toBe(1);
    });

    it('should export and import growth data', () => {
      growthManager.addGrowth(3, 'food');
      growthManager.processGrowth(); // Reduce pending to 2

      const exportedData = growthManager.exportData();
      expect(exportedData.pendingGrowth).toBe(2);
      expect(exportedData.growthHistory).toHaveLength(1);

      const newSnake: Snake = {
        segments: [{ x: 0, y: 0, id: 'head' }],
        direction: 'UP',
        nextDirection: 'UP',
        isGrowing: false,
      };
      const newGrowthManager = new SnakeGrowthManager(newSnake);
      
      newGrowthManager.importData(exportedData);
      expect(newGrowthManager.getPendingGrowth()).toBe(2);
      expect(newSnake.isGrowing).toBe(true);
    });
  });

  describe('Status and Debugging', () => {
    it('should provide status information', () => {
      growthManager.addGrowth(2, 'food');
      growthManager.processGrowth();

      const status = growthManager.getStatus();
      expect(status).toMatchObject({
        currentLength: 3,
        pendingGrowth: 1,
        isGrowing: true,
        totalGrowthEvents: 1,
        maxPendingLimit: 10,
      });
      expect(status.lastGrowthTime).toBeGreaterThan(0);
    });

    it('should estimate growth time based on game speed', () => {
      growthManager.addGrowth(3, 'food');
      const gameSpeed = 200; // 200ms per move

      const estimatedTime = growthManager.getEstimatedGrowthTime(gameSpeed);
      expect(estimatedTime).toBe(600); // 3 * 200ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle adding zero growth', () => {
      growthManager.addGrowth(0, 'food');
      expect(growthManager.getPendingGrowth()).toBe(0);
      expect(growthManager.getGrowthHistory()).toHaveLength(0);
    });

    it('should handle negative growth addition', () => {
      growthManager.addGrowth(-1, 'food');
      expect(growthManager.getPendingGrowth()).toBe(0);
      expect(growthManager.getGrowthHistory()).toHaveLength(0);
    });

    it('should handle empty snake segments for immediate growth', () => {
      const emptySnake: Snake = {
        segments: [],
        direction: 'UP',
        nextDirection: 'UP',
        isGrowing: false,
      };
      const emptyGrowthManager = new SnakeGrowthManager(emptySnake);

      emptyGrowthManager.growSnakeImmediate(1);
      expect(emptySnake.segments.length).toBe(0); // Should not add to empty snake
    });
  });

  describe('Performance', () => {
    it('should handle large growth operations efficiently', () => {
      const startTime = performance.now();
      
      // Add many growth events
      for (let i = 0; i < 1000; i++) {
        growthManager.addGrowth(1, 'food');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Should complete in less than 50ms
      expect(growthManager.getPendingGrowth()).toBe(10); // Limited by maxPendingGrowth
      expect(growthManager.getGrowthHistory()).toHaveLength(1000);
    });
  });
});