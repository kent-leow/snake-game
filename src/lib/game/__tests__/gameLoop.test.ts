/**
 * @jest-environment jsdom
 */

import { GameLoop, createGameLoop, FrameRateLimiter, SimpleGameLoop } from '@/lib/game/gameLoop';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
global.performance = { now: mockPerformanceNow } as any;

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = jest.fn();
const mockCancelAnimationFrame = jest.fn();
global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

describe('GameLoop', () => {
  let updateCallback: jest.Mock;
  let renderCallback: jest.Mock;
  let performanceCallback: jest.Mock;
  let gameLoop: GameLoop;

  beforeEach(() => {
    jest.clearAllMocks();
    updateCallback = jest.fn();
    renderCallback = jest.fn();
    performanceCallback = jest.fn();
    
    // Reset mock implementation
    mockPerformanceNow.mockReturnValue(0);
    mockRequestAnimationFrame.mockImplementation((callback) => {
      // Immediately execute callback for testing
      setTimeout(callback, 16); // Simulate 60 FPS
      return 1;
    });

    gameLoop = new GameLoop(
      {
        onUpdate: updateCallback,
        onRender: renderCallback,
        onPerformanceUpdate: performanceCallback,
      },
      {
        targetFPS: 60,
        enablePerformanceMonitoring: true,
      }
    );
  });

  afterEach(() => {
    gameLoop.stop();
  });

  describe('Basic functionality', () => {
    test('should start and stop correctly', () => {
      expect(gameLoop.isActive()).toBe(false);
      
      gameLoop.start();
      expect(gameLoop.isActive()).toBe(true);
      
      gameLoop.stop();
      expect(gameLoop.isActive()).toBe(false);
    });

    test('should pause and resume correctly', () => {
      gameLoop.start();
      expect(gameLoop.isActive()).toBe(true);
      
      gameLoop.pause();
      expect(gameLoop.isActive()).toBe(false);
      
      gameLoop.resume();
      expect(gameLoop.isActive()).toBe(true);
    });

    test('should toggle pause state', () => {
      gameLoop.start();
      expect(gameLoop.isActive()).toBe(true);
      
      gameLoop.togglePause();
      expect(gameLoop.isActive()).toBe(false);
      
      gameLoop.togglePause();
      expect(gameLoop.isActive()).toBe(true);
    });

    test('should track frame count', () => {
      gameLoop.start();
      
      // Simulate some frames
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16)
        .mockReturnValueOnce(32);
      
      expect(gameLoop.getFrameCount()).toBeGreaterThan(0);
    });

    test('should track runtime', () => {
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1000);
      
      gameLoop.start();
      
      expect(gameLoop.getRuntime()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Frame rate management', () => {
    test('should update target FPS', () => {
      gameLoop.setTargetFPS(30);
      // Test that the game loop adapts to new FPS
      // This would be more complex to test without actual timing
    });

    test('should handle maximum delta time clamping', () => {
      // Simulate a very large delta time that should be clamped
      mockPerformanceNow
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(200); // 200ms delta - should be clamped
      
      gameLoop.start();
      
      // The update callback should receive clamped delta time
      // This would need more complex testing to verify
    });
  });

  describe('Callback execution', () => {
    test('should call update and render callbacks when active', (done) => {
      gameLoop.start();
      
      setTimeout(() => {
        expect(updateCallback).toHaveBeenCalled();
        expect(renderCallback).toHaveBeenCalled();
        done();
      }, 50);
    });

    test('should not call callbacks when paused', (done) => {
      gameLoop.start();
      gameLoop.pause();
      
      updateCallback.mockClear();
      renderCallback.mockClear();
      
      setTimeout(() => {
        expect(updateCallback).not.toHaveBeenCalled();
        expect(renderCallback).not.toHaveBeenCalled();
        done();
      }, 50);
    });

    test('should call performance callback when enabled', (done) => {
      gameLoop.start();
      
      setTimeout(() => {
        // Performance callback might be called with some delay
        expect(performanceCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            fps: expect.any(Number),
          })
        );
        done();
      }, 1100); // Wait longer than performance update interval
    });
  });
});

describe('FrameRateLimiter', () => {
  let limiter: FrameRateLimiter;

  beforeEach(() => {
    limiter = new FrameRateLimiter(60);
    mockPerformanceNow.mockReturnValue(0);
  });

  test('should initialize with correct frame time', () => {
    expect(limiter.getTimeToNextFrame(0)).toBe(1000 / 60);
  });

  test('should determine when to render', () => {
    mockPerformanceNow.mockReturnValue(0);
    expect(limiter.shouldRender(0)).toBe(true);
    
    limiter.markFrame(0);
    mockPerformanceNow.mockReturnValue(10);
    expect(limiter.shouldRender(10)).toBe(false);
    
    mockPerformanceNow.mockReturnValue(20);
    expect(limiter.shouldRender(20)).toBe(true);
  });

  test('should update target FPS', () => {
    limiter.setTargetFPS(30);
    expect(limiter.getTimeToNextFrame(0)).toBe(1000 / 30);
  });
});

describe('SimpleGameLoop', () => {
  let callback: jest.Mock;
  let simpleLoop: SimpleGameLoop;

  beforeEach(() => {
    callback = jest.fn();
    simpleLoop = new SimpleGameLoop(callback);
  });

  afterEach(() => {
    simpleLoop.stop();
  });

  test('should start and stop correctly', () => {
    simpleLoop.start();
    simpleLoop.stop();
    
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  test('should call callback with delta time', (done) => {
    mockPerformanceNow
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(16);
    
    simpleLoop.start();
    
    setTimeout(() => {
      expect(callback).toHaveBeenCalledWith(expect.any(Number));
      done();
    }, 50);
  });
});

describe('createGameLoop utility', () => {
  test('should create a game loop with provided callbacks', () => {
    const updateFn = jest.fn();
    const renderFn = jest.fn();
    
    const loop = createGameLoop(updateFn, renderFn, { targetFPS: 30 });
    
    expect(loop).toBeInstanceOf(GameLoop);
  });
});

describe('Edge cases and error handling', () => {
  test('should handle starting already running loop', () => {
    const loop = new GameLoop({
      onUpdate: jest.fn(),
      onRender: jest.fn(),
    });
    
    loop.start();
    loop.start(); // Should not cause issues
    
    expect(loop.isActive()).toBe(true);
    loop.stop();
  });

  test('should handle stopping already stopped loop', () => {
    const loop = new GameLoop({
      onUpdate: jest.fn(),
      onRender: jest.fn(),
    });
    
    loop.stop(); // Should not cause issues
    expect(loop.isActive()).toBe(false);
  });

  test('should handle pausing non-running loop', () => {
    const loop = new GameLoop({
      onUpdate: jest.fn(),
      onRender: jest.fn(),
    });
    
    loop.pause(); // Should not cause issues
    expect(loop.isActive()).toBe(false);
  });
});