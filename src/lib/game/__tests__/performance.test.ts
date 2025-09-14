/**
 * @jest-environment jsdom
 */

import {
  PerformanceMonitor,
  detectDevicePerformance,
  getOptimizationSuggestions,
  getAdaptiveQualitySettings,
} from '@/lib/game/performance';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
global.performance = { now: mockPerformanceNow } as any;

// Mock navigator for device detection
const mockNavigator = {
  hardwareConcurrency: 4,
  deviceMemory: 4,
};
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  configurable: true,
});

// Mock canvas and WebGL context
const mockCanvas = document.createElement('canvas');
const mockGetContext = jest.fn();
mockCanvas.getContext = mockGetContext;
document.createElement = jest.fn().mockReturnValue(mockCanvas);

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let warningCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    warningCallback = jest.fn();
    mockPerformanceNow.mockReturnValue(0);
    
    monitor = new PerformanceMonitor(
      {
        targetFPS: 60,
        minFPSMobile: 30,
        frameTimeWarningThreshold: 16.67,
      },
      warningCallback
    );
  });

  describe('Frame timing', () => {
    test('should track frame times correctly', () => {
      mockPerformanceNow
        .mockReturnValueOnce(0)   // startFrame
        .mockReturnValueOnce(16); // endFrame

      monitor.startFrame();
      monitor.endFrame();

      const stats = monitor.getPerformanceStats();
      expect(stats.averageFrameTime).toBe(16);
    });

    test('should calculate FPS correctly', () => {
      // Simulate 60 frames over 1 second
      for (let i = 0; i < 60; i++) {
        mockPerformanceNow
          .mockReturnValueOnce(i * 16.67)      // startFrame
          .mockReturnValueOnce((i + 1) * 16.67); // endFrame

        monitor.startFrame();
        monitor.endFrame();
      }

      // Trigger FPS calculation by advancing time
      mockPerformanceNow.mockReturnValue(1000);
      monitor.startFrame();
      monitor.endFrame();

      const stats = monitor.getPerformanceStats();
      expect(stats.fps).toBeCloseTo(60, 0);
    });

    test('should track dropped frames', () => {
      // Simulate a slow frame
      mockPerformanceNow
        .mockReturnValueOnce(0)   // startFrame
        .mockReturnValueOnce(50); // endFrame (slower than threshold)

      monitor.startFrame();
      monitor.endFrame();

      const stats = monitor.getPerformanceStats();
      expect(stats.droppedFrames).toBe(1);
    });

    test('should maintain frame time history', () => {
      // Add multiple frame times
      const frameTimes = [16, 17, 15, 18, 16];
      
      for (let i = 0; i < frameTimes.length; i++) {
        mockPerformanceNow
          .mockReturnValueOnce(i * 20)
          .mockReturnValueOnce(i * 20 + frameTimes[i]);

        monitor.startFrame();
        monitor.endFrame();
      }

      const stats = monitor.getPerformanceStats();
      expect(stats.averageFrameTime).toBeCloseTo(16.4, 1);
      expect(stats.maxFrameTime).toBe(18);
      expect(stats.minFrameTime).toBe(15);
    });
  });

  describe('Performance warnings', () => {
    test('should trigger warning callback for low FPS', () => {
      // Simulate frames that would result in low FPS
      for (let i = 0; i < 60; i++) {
        mockPerformanceNow
          .mockReturnValueOnce(i * 50)      // startFrame (20 FPS)
          .mockReturnValueOnce((i + 1) * 50); // endFrame

        monitor.startFrame();
        monitor.endFrame();
      }

      // Advance time to trigger FPS calculation
      mockPerformanceNow.mockReturnValue(3000);
      monitor.startFrame();
      monitor.endFrame();

      expect(warningCallback).toHaveBeenCalled();
    });

    test('should not trigger warning for good performance', () => {
      // Simulate good performance
      for (let i = 0; i < 60; i++) {
        mockPerformanceNow
          .mockReturnValueOnce(i * 16.67)
          .mockReturnValueOnce((i + 1) * 16.67);

        monitor.startFrame();
        monitor.endFrame();
      }

      expect(warningCallback).not.toHaveBeenCalled();
    });
  });

  describe('Quality recommendations', () => {
    test('should recommend high quality for good performance', () => {
      // Simulate excellent performance
      for (let i = 0; i < 60; i++) {
        mockPerformanceNow
          .mockReturnValueOnce(i * 16)
          .mockReturnValueOnce((i + 1) * 16);

        monitor.startFrame();
        monitor.endFrame();
      }

      // Trigger FPS calculation
      mockPerformanceNow.mockReturnValue(1000);
      monitor.startFrame();
      monitor.endFrame();

      expect(monitor.getRecommendedQuality()).toBe('high');
    });

    test('should recommend low quality for poor performance', () => {
      // Simulate poor performance
      for (let i = 0; i < 30; i++) {
        mockPerformanceNow
          .mockReturnValueOnce(i * 50)
          .mockReturnValueOnce((i + 1) * 50);

        monitor.startFrame();
        monitor.endFrame();
      }

      // Trigger FPS calculation
      mockPerformanceNow.mockReturnValue(1500);
      monitor.startFrame();
      monitor.endFrame();

      expect(monitor.getRecommendedQuality()).toBe('low');
    });
  });

  describe('Reset functionality', () => {
    test('should reset all counters', () => {
      // Add some data
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16);

      monitor.startFrame();
      monitor.endFrame();

      let stats = monitor.getPerformanceStats();
      expect(stats.totalFrames).toBe(1);

      // Reset and check
      monitor.reset();
      stats = monitor.getPerformanceStats();
      expect(stats.totalFrames).toBe(0);
      expect(stats.averageFrameTime).toBe(0);
    });
  });
});

describe('Device performance detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should detect high performance device', () => {
    mockNavigator.hardwareConcurrency = 8;
    expect(detectDevicePerformance()).toBe('high');
  });

  test('should detect medium performance device', () => {
    mockNavigator.hardwareConcurrency = 4;
    expect(detectDevicePerformance()).toBe('medium');
  });

  test('should detect low performance device', () => {
    mockNavigator.hardwareConcurrency = 2;
    mockGetContext.mockReturnValue(null); // No WebGL support
    expect(detectDevicePerformance()).toBe('low');
  });

  test('should handle WebGL detection', () => {
    mockNavigator.hardwareConcurrency = 4;
    
    const mockGL = {
      getExtension: jest.fn().mockReturnValue({
        UNMASKED_RENDERER_WEBGL: 'renderer',
        UNMASKED_VENDOR_WEBGL: 'vendor',
      }),
      getParameter: jest.fn().mockReturnValue('NVIDIA GTX 1080'),
    };
    
    mockGetContext.mockReturnValue(mockGL);
    
    expect(detectDevicePerformance()).toBe('high');
  });
});

describe('Optimization suggestions', () => {
  test('should suggest optimizations for low FPS', () => {
    const stats = {
      fps: 20,
      averageFrameTime: 50,
      maxFrameTime: 100,
      minFrameTime: 30,
      totalFrames: 100,
      droppedFrames: 50,
    };

    const suggestions = getOptimizationSuggestions(stats);
    
    expect(suggestions).toContain(expect.stringContaining('reducing game speed'));
    expect(suggestions).toContain(expect.stringContaining('optimize update logic'));
    expect(suggestions).toContain(expect.stringContaining('adaptive quality'));
  });

  test('should suggest frame time optimizations', () => {
    const stats = {
      fps: 60,
      averageFrameTime: 40,
      maxFrameTime: 120,
      minFrameTime: 20,
      totalFrames: 100,
      droppedFrames: 5,
    };

    const suggestions = getOptimizationSuggestions(stats);
    
    expect(suggestions).toContain(expect.stringContaining('optimize update logic'));
    expect(suggestions).toContain(expect.stringContaining('blocking operations'));
  });

  test('should return no suggestions for good performance', () => {
    const stats = {
      fps: 60,
      averageFrameTime: 16,
      maxFrameTime: 20,
      minFrameTime: 14,
      totalFrames: 100,
      droppedFrames: 2,
    };

    const suggestions = getOptimizationSuggestions(stats);
    expect(suggestions).toHaveLength(0);
  });
});

describe('Adaptive quality settings', () => {
  test('should return high quality settings for high-end device', () => {
    const settings = getAdaptiveQualitySettings('high');
    
    expect(settings.targetFPS).toBe(60);
    expect(settings.enableGrid).toBe(true);
    expect(settings.enableParticles).toBe(true);
    expect(settings.enableSmoothAnimation).toBe(true);
  });

  test('should return low quality settings for low-end device', () => {
    const settings = getAdaptiveQualitySettings('low');
    
    expect(settings.targetFPS).toBe(30);
    expect(settings.enableGrid).toBe(false);
    expect(settings.enableParticles).toBe(false);
    expect(settings.enableSmoothAnimation).toBe(false);
  });

  test('should adjust based on current performance stats', () => {
    const lowPerformanceStats = {
      fps: 20,
      averageFrameTime: 50,
      maxFrameTime: 100,
      minFrameTime: 30,
      totalFrames: 100,
      droppedFrames: 20,
    };

    const settings = getAdaptiveQualitySettings('high', lowPerformanceStats);
    
    // Should downgrade from high to accommodate poor performance
    expect(settings.targetFPS).toBe(30);
    expect(settings.enableParticles).toBe(false);
  });

  test('should severely downgrade for very poor performance', () => {
    const veryLowPerformanceStats = {
      fps: 15,
      averageFrameTime: 70,
      maxFrameTime: 150,
      minFrameTime: 40,
      totalFrames: 100,
      droppedFrames: 30,
    };

    const settings = getAdaptiveQualitySettings('medium', veryLowPerformanceStats);
    
    expect(settings.enableGrid).toBe(false);
    expect(settings.enableSmoothAnimation).toBe(false);
  });
});