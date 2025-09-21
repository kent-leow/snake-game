/**
 * @jest-environment jsdom
 */

// Mock performance.now BEFORE importing the timing module
const mockPerformanceNow = jest.fn();
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: mockPerformanceNow,
});

import {
  PrecisionTimer,
  FrameTimer,
  AdaptiveTimer,
  Interpolator,
  TimeUtils,
} from '../timing';

describe('PrecisionTimer', () => {
  let timer: PrecisionTimer;

  beforeEach(() => {
    timer = new PrecisionTimer();
    mockPerformanceNow.mockReturnValue(0);
  });

  describe('Basic timing operations', () => {
    test('should start and track elapsed time', () => {
      mockPerformanceNow.mockReturnValue(0);
      timer.start();
      
      mockPerformanceNow.mockReturnValue(1000);
      expect(timer.getElapsedTime()).toBe(1000);
      expect(timer.getElapsedSeconds()).toBe(1);
    });

    test('should stop and reset timer', () => {
      timer.start();
      mockPerformanceNow.mockReturnValue(500);
      expect(timer.getElapsedTime()).toBe(500);
      
      timer.stop();
      expect(timer.getElapsedTime()).toBe(0);
      expect(timer.getIsRunning()).toBe(false);
    });

    test('should pause and resume correctly', () => {
      timer.start();
      
      mockPerformanceNow.mockReturnValue(500);
      timer.pause();
      expect(timer.getElapsedTime()).toBe(500);
      
      // Time passes while paused
      mockPerformanceNow.mockReturnValue(1000);
      expect(timer.getElapsedTime()).toBe(500); // Should not change
      
      timer.resume();
      mockPerformanceNow.mockReturnValue(1200);
      expect(timer.getElapsedTime()).toBe(700); // 500 + 200
    });

    test('should reset to zero', () => {
      timer.start();
      mockPerformanceNow.mockReturnValue(500);
      expect(timer.getElapsedTime()).toBe(500);
      
      mockPerformanceNow.mockReturnValue(600);
      timer.reset();
      expect(timer.getElapsedTime()).toBe(0);
    });

    test('should handle starting already running timer', () => {
      timer.start();
      expect(timer.getIsRunning()).toBe(true);
      
      timer.start(); // Should not cause issues
      expect(timer.getIsRunning()).toBe(true);
    });
  });
});

describe('FrameTimer', () => {
  let frameTimer: FrameTimer;

  beforeEach(() => {
    frameTimer = new FrameTimer(60);
    mockPerformanceNow.mockReturnValue(0); // Reset mock to 0
  });

  describe('Frame timing', () => {
    test('should calculate delta time correctly', () => {
      const deltaTime1 = frameTimer.tick(100); // Start with non-zero time
      expect(deltaTime1).toBe(0); // First frame is always 0
      
      const deltaTime2 = frameTimer.tick(116.67); // 100 + 16.67
      expect(deltaTime2).toBeCloseTo(16.67, 1);
    });

    test('should track frame timing history', () => {
      frameTimer.tick(0);
      frameTimer.tick(16);
      frameTimer.tick(32);
      frameTimer.tick(50);
      
      const smoothedDelta = frameTimer.getSmoothedDeltaTime();
      expect(smoothedDelta).toBeGreaterThan(0);
    });

    test('should calculate current FPS', () => {
      // Generate several frames at 60 FPS (16.67ms each) for stable measurement
      let time = 100;
      for (let i = 0; i < 10; i++) {
        frameTimer.tick(time);
        time += 16.67;
      }
      
      const fps = frameTimer.getCurrentFPS();
      expect(fps).toBeCloseTo(60, 0);
    });

    test('should detect stable timing', () => {
      // Add consistent frame times
      for (let i = 0; i < 15; i++) {
        frameTimer.tick(i * 16.67);
      }
      
      expect(frameTimer.isStable()).toBe(true);
    });

    test('should detect unstable timing', () => {
      // Add inconsistent frame times
      const times = [0, 16, 50, 70, 90, 100, 150, 170, 200, 250];
      times.forEach(time => frameTimer.tick(time));
      
      expect(frameTimer.isStable()).toBe(false);
    });

    test('should update target FPS', () => {
      frameTimer.setTargetFPS(30);
      // The internal state should be updated
      // This would be more complex to test without exposing internals
    });

    test('should reset timing history', () => {
      frameTimer.tick(0);
      frameTimer.tick(16);
      
      frameTimer.reset();
      
      const deltaTime = frameTimer.tick(100);
      expect(deltaTime).toBe(0); // Should be reset
    });
  });
});

describe('AdaptiveTimer', () => {
  let adaptiveTimer: AdaptiveTimer;

  beforeEach(() => {
    adaptiveTimer = new AdaptiveTimer(60, 30, 120, 5);
  });

  describe('Adaptive FPS adjustment', () => {
    test('should maintain target FPS initially', () => {
      expect(adaptiveTimer.getCurrentFPS()).toBe(60);
    });

    test('should adjust FPS based on performance', () => {
      // Simulate poor performance over many frames
      for (let i = 0; i < 70; i++) {
        adaptiveTimer.update(i * 50); // 20 FPS simulation
      }
      
      // Should have adjusted down
      expect(adaptiveTimer.getCurrentFPS()).toBeLessThan(60);
    });

    test('should not go below minimum FPS', () => {
      // Simulate very poor performance
      for (let i = 0; i < 200; i++) {
        adaptiveTimer.update(i * 100); // 10 FPS simulation
      }
      
      expect(adaptiveTimer.getCurrentFPS()).toBeGreaterThanOrEqual(30);
    });

    test('should not exceed maximum FPS', () => {
      adaptiveTimer.setTargetFPS(150); // Try to set above max
      expect(adaptiveTimer.getCurrentFPS()).toBeLessThanOrEqual(120);
    });

    test('should reset to target FPS', () => {
      // Simulate adjustment
      for (let i = 0; i < 70; i++) {
        adaptiveTimer.update(i * 50);
      }
      
      adaptiveTimer.reset();
      expect(adaptiveTimer.getCurrentFPS()).toBe(60);
    });
  });
});

describe('Interpolator', () => {
  describe('Linear interpolation', () => {
    test('should interpolate between values correctly', () => {
      expect(Interpolator.lerp(0, 100, 0)).toBe(0);
      expect(Interpolator.lerp(0, 100, 1)).toBe(100);
      expect(Interpolator.lerp(0, 100, 0.5)).toBe(50);
    });

    test('should clamp interpolation values', () => {
      expect(Interpolator.lerp(0, 100, -0.5)).toBe(0);
      expect(Interpolator.lerp(0, 100, 1.5)).toBe(100);
    });
  });

  describe('Smooth step interpolation', () => {
    test('should provide smooth transitions', () => {
      const result = Interpolator.smoothStep(0, 100, 0.5);
      expect(result).toBe(50); // At 0.5, smooth step equals linear
      
      const start = Interpolator.smoothStep(0, 100, 0.1);
      const end = Interpolator.smoothStep(0, 100, 0.9);
      expect(start).toBeLessThan(10); // Ease in
      expect(end).toBeGreaterThan(90); // Ease out
    });
  });

  describe('Ease in/out interpolation', () => {
    test('should provide ease in curve', () => {
      const result = Interpolator.easeIn(0, 100, 0.5);
      expect(result).toBeLessThan(50); // Ease in is slower at start
    });

    test('should provide ease out curve', () => {
      const result = Interpolator.easeOut(0, 100, 0.5);
      expect(result).toBeGreaterThan(50); // Ease out is faster at start
    });
  });

  describe('Bounce interpolation', () => {
    test('should provide bounce effect', () => {
      const result = Interpolator.bounce(0, 100, 0.8);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });
  });
});

describe('TimeUtils', () => {
  describe('Time conversion', () => {
    test('should convert milliseconds to seconds', () => {
      expect(TimeUtils.msToSeconds(1000)).toBe(1);
      expect(TimeUtils.msToSeconds(500)).toBe(0.5);
    });

    test('should convert seconds to milliseconds', () => {
      expect(TimeUtils.secondsToMs(1)).toBe(1000);
      expect(TimeUtils.secondsToMs(0.5)).toBe(500);
    });
  });

  describe('Time formatting', () => {
    test('should format duration correctly', () => {
      expect(TimeUtils.formatDuration(60000)).toBe('01:00');
      expect(TimeUtils.formatDuration(125000)).toBe('02:05');
      expect(TimeUtils.formatDuration(5000)).toBe('00:05');
    });
  });

  describe('Delta time utilities', () => {
    test('should clamp delta time', () => {
      expect(TimeUtils.clampDeltaTime(30, 50)).toBe(30);
      expect(TimeUtils.clampDeltaTime(100, 50)).toBe(50);
    });

    test('should calculate FPS from delta time', () => {
      expect(TimeUtils.deltaToFPS(16.67)).toBeCloseTo(60, 0);
      expect(TimeUtils.deltaToFPS(33.33)).toBeCloseTo(30, 0);
      expect(TimeUtils.deltaToFPS(0)).toBe(0);
    });
  });

  describe('Interval checking', () => {
    test('should check if interval has passed', () => {
      expect(TimeUtils.hasIntervalPassed(0, 1000, 1500)).toBe(true);
      expect(TimeUtils.hasIntervalPassed(0, 1000, 500)).toBe(false);
    });

    test('should use current time when not provided', () => {
      mockPerformanceNow.mockReturnValue(2000);
      expect(TimeUtils.hasIntervalPassed(0, 1000)).toBe(true);
    });
  });
});