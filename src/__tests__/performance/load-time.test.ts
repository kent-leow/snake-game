/**
 * @jest-environment jsdom
 */

import { PerformanceMonitor } from '../../lib/performance';

// Mock performance.now() for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
    timeOrigin: 0,
    getEntriesByType: jest.fn(),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
    },
  },
  writable: true,
});

// Mock fetch for API testing
global.fetch = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16); // ~60fps
  return 1;
});

describe('Load Time Performance Tests', () => {
  beforeEach(() => {
    mockPerformanceNow.mockClear();
    (global.fetch as jest.Mock).mockClear();
    jest.clearAllTimers();
  });

  describe('Page Load Time Measurement', () => {
    it('should measure load time under 5 seconds threshold', () => {
      // Mock performance timing for fast load
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Constructor start time
        .mockReturnValueOnce(4000); // End time (3 seconds later)

      // Mock empty navigation entries to use fallback timing
      (performance.getEntriesByType as jest.Mock).mockReturnValue([]);

      const monitor = new PerformanceMonitor();
      const loadTime = monitor.measurePageLoadTime();
      
      expect(loadTime).toBe(3000);
      expect(loadTime).toBeLessThan(5000); // 5 second threshold
    });

    it('should identify slow load times exceeding threshold', () => {
      // Mock performance timing for slow load
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Constructor start time
        .mockReturnValueOnce(8000); // End time (7 seconds later)

      // Mock empty navigation entries to use fallback timing
      (performance.getEntriesByType as jest.Mock).mockReturnValue([]);

      const monitor = new PerformanceMonitor();
      const loadTime = monitor.measurePageLoadTime();
      
      expect(loadTime).toBe(7000);
      expect(loadTime).toBeGreaterThan(5000); // Exceeds 5 second threshold
    });

    it('should use Navigation Timing API when available', () => {
      const mockNavEntry = {
        loadEventEnd: 2500,
        fetchStart: 100,
      };

      (performance.getEntriesByType as jest.Mock).mockReturnValue([mockNavEntry]);
      
    it('should use Navigation Timing API when available', () => {
      const mockNavEntry = {
        loadEventEnd: 2500,
        fetchStart: 100,
      };

      (performance.getEntriesByType as jest.Mock).mockReturnValue([mockNavEntry]);
      
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Constructor start time
        .mockReturnValueOnce(4000); // End time

      const monitor = new PerformanceMonitor();
      const loadTime = monitor.measurePageLoadTime();
      
      expect(performance.getEntriesByType).toHaveBeenCalledWith('navigation');
      // Should use Navigation Timing API result
      expect(loadTime).toBe(2400); // loadEventEnd - fetchStart
    });
  });

  describe('Performance Metrics Recording', () => {
    it('should record performance metrics correctly', () => {
      // Mock consistent timing for metrics recording
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Constructor start time
        .mockReturnValueOnce(2000); // Current time for loadTime calculation
      
      const monitor = new PerformanceMonitor();
      const metrics = monitor.recordMetrics();
      
      expect(metrics).toMatchObject({
        loadTime: 1000,
        apiResponseTime: 0, // No API calls yet
        gameFrameRate: 0, // No frame rate monitoring yet
        timestamp: expect.any(Number),
      });
      
      expect(metrics.memoryUsage).toMatchObject({
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
      });
    });

    it('should maintain metrics history with size limit', () => {
      // Mock consistent timing
      mockPerformanceNow
        .mockReturnValue(1000); // Consistent timing
      
      const monitor = new PerformanceMonitor();
      
      // Record more than 100 metrics to test size limit
      for (let i = 0; i < 110; i++) {
        monitor.recordMetrics();
      }
      
      const summary = monitor.getPerformanceSummary();
      expect(summary.metrics.length).toBeLessThanOrEqual(10); // Last 10 metrics
    });
  });

  describe('Performance Health Checks', () => {
    it('should report healthy status when all thresholds are met', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Constructor
        .mockReturnValueOnce(3000); // 2 seconds load time
      
      const monitor = new PerformanceMonitor();
      const health = monitor.checkPerformanceHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.checks.performance).toBe(true);
      expect(health.checks.memory).toBe(true);
    });

    it('should report degraded status when some thresholds exceed limits', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Constructor
        .mockReturnValueOnce(7000); // 6 seconds load time (exceeds 5s threshold)
      
      const monitor = new PerformanceMonitor();
      const health = monitor.checkPerformanceHealth();
      
      expect(health.status).toBe('degraded');
      expect(health.checks.performance).toBe(false);
    });

    it('should include uptime in health check', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000) // Constructor start time
        .mockReturnValueOnce(6000); // Current time
      
      const monitor = new PerformanceMonitor();
      const health = monitor.checkPerformanceHealth();
      
      expect(health.uptime).toBe(5000);
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should track memory usage in MB', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);
      
      const monitor = new PerformanceMonitor();
      const summary = monitor.getPerformanceSummary();
      const health = summary.health;
      
      expect(health.checks.memory).toBe(true); // 50MB < 100MB threshold
    });

    it('should detect high memory usage', () => {
      // Mock high memory usage
      (performance as any).memory.usedJSHeapSize = 150 * 1024 * 1024; // 150MB
      
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);
      
      const monitor = new PerformanceMonitor();
      const health = monitor.checkPerformanceHealth();
      
      expect(health.checks.memory).toBe(false); // 150MB > 100MB threshold
      
      // Restore original memory value
      (performance as any).memory.usedJSHeapSize = 50 * 1024 * 1024;
    });
  });

  describe('Performance Summary', () => {
    it('should provide comprehensive performance summary', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);
      
      const monitor = new PerformanceMonitor();
      const summary = monitor.getPerformanceSummary();
      
      expect(summary).toMatchObject({
        metrics: expect.any(Array),
        apiMetrics: expect.any(Array),
        gameMetrics: null, // No game monitoring started
        health: expect.any(Object),
        thresholds: {
          LOAD_TIME_MAX: 5000,
          API_RESPONSE_MAX: 2000,
          MIN_FPS: 30,
          MAX_MEMORY_MB: 100,
        },
      });
    });

    it('should export performance data for analysis', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);
      
      const monitor = new PerformanceMonitor();
      const exportData = monitor.exportPerformanceData();
      
      expect(exportData).toMatchObject({
        timestamp: expect.any(String),
        metrics: expect.any(Array),
        apiMetrics: expect.any(Array),
        gameMetrics: null,
        thresholds: expect.any(Object),
        browserInfo: expect.any(Object),
      });
      
      expect(exportData.browserInfo).toMatchObject({
        userAgent: expect.any(String),
        language: expect.any(String),
        platform: expect.any(String),
        cookieEnabled: expect.any(Boolean),
      });
    });
  });

  describe('Metrics Cleanup', () => {
    it('should clear all stored metrics', () => {
      mockPerformanceNow.mockReturnValue(1000);
      
      const monitor = new PerformanceMonitor();
      
      // Add some metrics
      monitor.recordMetrics();
      monitor.measureApiResponse('/test');
      
      let summary = monitor.getPerformanceSummary();
      expect(summary.metrics.length).toBeGreaterThan(0);
      
      // Clear metrics
      monitor.clearMetrics();
      
      summary = monitor.getPerformanceSummary();
      expect(summary.metrics.length).toBe(0);
      expect(summary.apiMetrics.length).toBe(0);
      expect(summary.gameMetrics).toBeNull();
    });
  });
});

describe('Performance Thresholds Validation', () => {
  it('should enforce 5-second load time requirement', () => {
    const monitor = new PerformanceMonitor();
    
    // Test passing threshold
    mockPerformanceNow.mockReturnValue(4000);
    let health = monitor.checkPerformanceHealth();
    expect(health.checks.performance).toBe(true);
    
    // Test failing threshold
    mockPerformanceNow.mockReturnValue(6000);
    health = monitor.checkPerformanceHealth();
    expect(health.checks.performance).toBe(false);
  });

  it('should enforce API response time requirements', async () => {
    const monitor = new PerformanceMonitor();
    
    // Mock fast API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
    
    mockPerformanceNow
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(1500); // End time (1.5 seconds)
    
    const result = await monitor.measureApiResponse('/api/test');
    
    expect(result.responseTime).toBe(1500);
    expect(result.responseTime).toBeLessThan(2000); // 2 second threshold
    expect(result.success).toBe(true);
  });

  it('should detect API response time violations', async () => {
    const monitor = new PerformanceMonitor();
    
    // Mock slow API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
    
    mockPerformanceNow
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(3000); // End time (3 seconds)
    
    const result = await monitor.measureApiResponse('/api/test');
    
    expect(result.responseTime).toBe(3000);
    expect(result.responseTime).toBeGreaterThan(2000); // Exceeds 2 second threshold
  });
});