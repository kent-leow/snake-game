/**
 * @jest-environment jsdom
 */

import { PerformanceMonitor } from '../PerformanceMonitor';

// Mock performance.now
const mockPerformanceNow = jest.fn(() => Date.now());

// Setup global mocks
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: mockPerformanceNow,
});

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset time to a consistent starting point
    mockPerformanceNow.mockReturnValue(1000);
  });

  describe('initialization', () => {
    it('should initialize with enabled state', () => {
      const enabledMonitor = new PerformanceMonitor(true);
      expect(enabledMonitor.isEnabled()).toBe(true);
      enabledMonitor.destroy();
    });

    it('should initialize with disabled state', () => {
      const disabledMonitor = new PerformanceMonitor(false);
      expect(disabledMonitor.isEnabled()).toBe(false);
      disabledMonitor.destroy();
    });

    it('should have default metrics', () => {
      performanceMonitor = new PerformanceMonitor(true);
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.fps).toBe(0);
      expect(metrics.averageFrameTime).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.enabled).toBe(true);
    });
  });

  describe('frame tracking', () => {
    beforeEach(() => {
      performanceMonitor = new PerformanceMonitor(true);
    });

    afterEach(() => {
      performanceMonitor.destroy();
    });

    it('should track frames when enabled', () => {
      let currentTime = 1000;
      mockPerformanceNow.mockImplementation(() => currentTime);

      performanceMonitor.startFrame();
      
      currentTime += 16.67; // Simulate 60 FPS
      mockPerformanceNow.mockReturnValue(currentTime);
      performanceMonitor.endFrame();

      expect(performanceMonitor.getCurrentFPS()).toBe(0); // FPS only calculated after 1 second
    });

    it('should calculate FPS after 1 second', () => {
      let currentTime = 1000;
      mockPerformanceNow.mockImplementation(() => currentTime);

      // Simulate 60 frames over 1 second
      for (let i = 0; i < 60; i++) {
        performanceMonitor.startFrame();
        currentTime += 16.67;
        mockPerformanceNow.mockReturnValue(currentTime);
        performanceMonitor.endFrame();
      }

      expect(performanceMonitor.getCurrentFPS()).toBeGreaterThan(0);
    });

    it('should not track frames when disabled', () => {
      const disabledMonitor = new PerformanceMonitor(false);
      
      disabledMonitor.startFrame();
      disabledMonitor.endFrame();
      
      expect(disabledMonitor.getCurrentFPS()).toBe(0);
      disabledMonitor.destroy();
    });

    it('should calculate average frame time', () => {
      let currentTime = 1000;
      mockPerformanceNow.mockImplementation(() => currentTime);

      // Add some frame times
      performanceMonitor.startFrame();
      currentTime += 16;
      mockPerformanceNow.mockReturnValue(currentTime);
      performanceMonitor.endFrame();

      performanceMonitor.startFrame();
      currentTime += 20;
      mockPerformanceNow.mockReturnValue(currentTime);
      performanceMonitor.endFrame();

      performanceMonitor.startFrame();
      currentTime += 18;
      mockPerformanceNow.mockReturnValue(currentTime);
      performanceMonitor.endFrame();

      const avgFrameTime = performanceMonitor.getAverageFrameTime();
      // Should be a reasonable average frame time
      expect(avgFrameTime).toBeGreaterThan(0);
      expect(avgFrameTime).toBeLessThan(30);
    });
  });

  describe('error tracking', () => {
    beforeEach(() => {
      performanceMonitor = new PerformanceMonitor(true);
    });

    afterEach(() => {
      performanceMonitor.destroy();
    });

    it('should record errors', () => {
      expect(performanceMonitor.getMetrics().errorCount).toBe(0);
      
      performanceMonitor.recordError();
      expect(performanceMonitor.getMetrics().errorCount).toBe(1);
      
      performanceMonitor.recordError();
      expect(performanceMonitor.getMetrics().errorCount).toBe(2);
    });
  });

  describe('state management', () => {
    beforeEach(() => {
      performanceMonitor = new PerformanceMonitor(false);
    });

    afterEach(() => {
      performanceMonitor.destroy();
    });

    it('should enable and disable monitoring', () => {
      expect(performanceMonitor.isEnabled()).toBe(false);
      
      performanceMonitor.enable();
      expect(performanceMonitor.isEnabled()).toBe(true);
      
      performanceMonitor.disable();
      expect(performanceMonitor.isEnabled()).toBe(false);
    });

    it('should reset metrics', () => {
      // Add some data
      performanceMonitor.enable();
      performanceMonitor.recordError();
      performanceMonitor.startFrame();
      performanceMonitor.endFrame();
      
      expect(performanceMonitor.getMetrics().errorCount).toBe(1);
      
      performanceMonitor.reset();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.errorCount).toBe(0);
      expect(metrics.fps).toBe(0);
      expect(metrics.averageFrameTime).toBe(0);
    });
  });

  describe('metrics retrieval', () => {
    beforeEach(() => {
      performanceMonitor = new PerformanceMonitor(true);
    });

    afterEach(() => {
      performanceMonitor.destroy();
    });

    it('should provide complete metrics object', () => {
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('averageFrameTime');
      expect(metrics).toHaveProperty('errorCount');
      expect(metrics).toHaveProperty('enabled');
      
      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.averageFrameTime).toBe('number');
      expect(typeof metrics.errorCount).toBe('number');
      expect(typeof metrics.enabled).toBe('boolean');
    });

    it('should reflect current enabled state in metrics', () => {
      let metrics = performanceMonitor.getMetrics();
      expect(metrics.enabled).toBe(true);
      
      performanceMonitor.disable();
      metrics = performanceMonitor.getMetrics();
      expect(metrics.enabled).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources when destroyed', () => {
      performanceMonitor = new PerformanceMonitor(true);
      
      // Add some data
      performanceMonitor.recordError();
      expect(performanceMonitor.getMetrics().errorCount).toBe(1);
      
      performanceMonitor.destroy();
      
      // Should be reset and disabled
      expect(performanceMonitor.isEnabled()).toBe(false);
      expect(performanceMonitor.getMetrics().errorCount).toBe(0);
    });

    it('should handle multiple destroy calls safely', () => {
      performanceMonitor = new PerformanceMonitor(true);
      
      performanceMonitor.destroy();
      performanceMonitor.destroy(); // Should not throw
      
      expect(performanceMonitor.isEnabled()).toBe(false);
    });
  });
});