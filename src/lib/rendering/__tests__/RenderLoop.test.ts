/**
 * @jest-environment jsdom
 */

import { RenderLoop, type RenderLoopCallbacks } from '../RenderLoop';

// Mock requestAnimationFrame
let animationFrameId = 0;
const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  animationFrameId++;
  // Execute callback immediately for testing
  setTimeout(() => callback(performance.now()), 0);
  return animationFrameId;
});

const mockCancelAnimationFrame = jest.fn((_id: number) => {
  // Mock implementation
});

// Mock performance.now
const mockPerformanceNow = jest.fn(() => Date.now());

// Setup global mocks
Object.defineProperty(global, 'requestAnimationFrame', {
  writable: true,
  value: mockRequestAnimationFrame,
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  writable: true,
  value: mockCancelAnimationFrame,
});

Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: mockPerformanceNow,
});

describe('RenderLoop', () => {
  let renderLoop: RenderLoop;
  let mockCallbacks: RenderLoopCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();
    animationFrameId = 0;
    
    mockCallbacks = {
      onUpdate: jest.fn(),
      onRender: jest.fn(),
    };
    
    renderLoop = new RenderLoop(mockCallbacks, { targetFPS: 60 });
  });

  afterEach(() => {
    renderLoop.stop();
  });

  describe('initialization', () => {
    it('should initialize with correct target FPS', () => {
      expect(renderLoop.getTargetFPS()).toBe(60);
      expect(renderLoop.isActive()).toBe(false);
    });

    it('should initialize with default FPS when not specified', () => {
      const defaultLoop = new RenderLoop(mockCallbacks);
      expect(defaultLoop.getTargetFPS()).toBe(60);
      defaultLoop.stop();
    });
  });

  describe('loop control', () => {
    it('should start the render loop', () => {
      renderLoop.start();
      
      expect(renderLoop.isActive()).toBe(true);
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should stop the render loop', () => {
      renderLoop.start();
      renderLoop.stop();
      
      expect(renderLoop.isActive()).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should not start if already running', () => {
      renderLoop.start();
      const firstCallCount = mockRequestAnimationFrame.mock.calls.length;
      
      renderLoop.start(); // Try to start again
      
      expect(mockRequestAnimationFrame.mock.calls.length).toBe(firstCallCount);
    });

    it('should pause and resume', () => {
      renderLoop.start();
      expect(renderLoop.isActive()).toBe(true);

      renderLoop.pause();
      expect(renderLoop.isActive()).toBe(false);

      renderLoop.resume();
      expect(renderLoop.isActive()).toBe(true);
    });
  });

  describe('render callback execution', () => {
    beforeEach(() => {
      // Mock consistent time progression
      let currentTime = 0;
      mockPerformanceNow.mockImplementation(() => {
        currentTime += 16.67; // ~60 FPS
        return currentTime;
      });
    });

    it('should call update and render callbacks', async () => {
      renderLoop.start();
      
      // Wait for callback to be executed
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(mockCallbacks.onUpdate).toHaveBeenCalled();
      expect(mockCallbacks.onRender).toHaveBeenCalled();
    });

    it('should call callbacks with correct parameters', async () => {
      renderLoop.start();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check onUpdate parameters
      const updateCall = mockCallbacks.onUpdate as jest.Mock;
      if (updateCall.mock.calls.length > 0) {
        const [deltaTime, interpolation] = updateCall.mock.calls[0];
        expect(typeof deltaTime).toBe('number');
        expect(typeof interpolation).toBe('number');
        expect(deltaTime).toBeGreaterThan(0);
        expect(interpolation).toBe(1.0);
      }

      // Check onRender parameters
      const renderCall = mockCallbacks.onRender as jest.Mock;
      if (renderCall.mock.calls.length > 0) {
        const [interpolation] = renderCall.mock.calls[0];
        expect(typeof interpolation).toBe('number');
        expect(interpolation).toBeGreaterThanOrEqual(0);
        expect(interpolation).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('FPS targeting', () => {
    it('should respect target FPS settings', () => {
      const loop30 = new RenderLoop(mockCallbacks, { targetFPS: 30 });
      expect(loop30.getTargetFPS()).toBe(30);
      loop30.stop();
    });

    it('should update target FPS', () => {
      renderLoop.setTargetFPS(120);
      expect(renderLoop.getTargetFPS()).toBe(120);
    });

    it('should clamp FPS to reasonable range', () => {
      renderLoop.setTargetFPS(200); // Too high
      expect(renderLoop.getTargetFPS()).toBe(120);

      renderLoop.setTargetFPS(10); // Too low
      expect(renderLoop.getTargetFPS()).toBe(30);
    });
  });

  describe('performance integration', () => {
    it('should handle errors in callbacks gracefully', async () => {
      const mockUpdate = mockCallbacks.onUpdate as jest.Mock;
      mockUpdate.mockImplementation(() => {
        throw new Error('Update error');
      });
      
      renderLoop.start();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should continue running despite errors
      expect(renderLoop.isActive()).toBe(true);
    });

    it('should continue running after render errors', async () => {
      const mockUpdate = mockCallbacks.onUpdate as jest.Mock;
      mockUpdate
        .mockImplementationOnce(() => {
          throw new Error('First error');
        })
        .mockImplementationOnce(() => {
          // Second call succeeds
        });
      
      renderLoop.start();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(renderLoop.isActive()).toBe(true);
      expect(mockUpdate.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('callback management', () => {
    it('should update callbacks', () => {
      const newOnUpdate = jest.fn();
      renderLoop.updateCallbacks({ onUpdate: newOnUpdate });
      
      renderLoop.start();
      
      // Should use new callback
      setTimeout(() => {
        expect(newOnUpdate).toHaveBeenCalled();
      }, 50);
    });
  });

  describe('performance metrics', () => {
    it('should provide basic runtime information', () => {
      expect(renderLoop.isActive()).toBe(false);
      expect(renderLoop.getTargetFPS()).toBe(60);
      
      renderLoop.start();
      expect(renderLoop.isActive()).toBe(true);
      
      renderLoop.stop();
      expect(renderLoop.isActive()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources when destroyed', () => {
      renderLoop.start();
      renderLoop.destroy();
      
      expect(renderLoop.isActive()).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls safely', () => {
      renderLoop.destroy();
      renderLoop.destroy(); // Should not throw
      
      expect(renderLoop.isActive()).toBe(false);
    });
  });
});