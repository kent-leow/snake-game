/**
 * High-performance game loop implementation using requestAnimationFrame
 * Provides smooth 60 FPS gameplay with frame rate limiting and performance monitoring
 */

import { PerformanceMonitor, type PerformanceStats } from './performance';

export interface GameLoopCallbacks {
  onUpdate: (deltaTime: number, interpolation: number) => void;
  onRender: (interpolation: number) => void;
  onPerformanceUpdate?: (stats: PerformanceStats) => void;
}

export interface GameLoopOptions {
  targetFPS?: number;
  maxDeltaTime?: number;
  enablePerformanceMonitoring?: boolean;
  adaptiveQuality?: boolean;
}

/**
 * Core game loop class that manages timing, updates, and rendering
 */
export class GameLoop {
  private isRunning = false;
  private isPaused = false;
  private lastFrameTime = 0;
  private accumulator = 0;
  private targetFPS: number;
  private targetFrameTime: number;
  private maxDeltaTime: number;
  private animationId: number | null = null;
  private performanceMonitor: PerformanceMonitor | null = null;
  private frameCount = 0;
  private startTime = 0;

  // Callback functions
  private updateCallback: (deltaTime: number, interpolation: number) => void;
  private renderCallback: (interpolation: number) => void;
  private performanceCallback: ((stats: PerformanceStats) => void) | undefined;

  // Performance tracking
  private lastPerformanceUpdate = 0;
  private performanceUpdateInterval = 1000; // 1 second

  constructor(
    callbacks: GameLoopCallbacks,
    options: GameLoopOptions = {}
  ) {
    const {
      targetFPS = 60,
      maxDeltaTime = 100,
      enablePerformanceMonitoring = true,
      adaptiveQuality = true,
    } = options;

    this.updateCallback = callbacks.onUpdate;
    this.renderCallback = callbacks.onRender;
    this.performanceCallback = callbacks.onPerformanceUpdate;
    
    this.targetFPS = targetFPS;
    this.targetFrameTime = 1000 / targetFPS;
    this.maxDeltaTime = maxDeltaTime;

    if (enablePerformanceMonitoring) {
      this.performanceMonitor = new PerformanceMonitor(
        {
          targetFPS,
          maxDeltaTime,
        },
        adaptiveQuality ? this.handlePerformanceWarning.bind(this) : undefined
      );
    }
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.startTime = this.lastFrameTime;
    this.accumulator = 0;
    this.frameCount = 0;

    if (this.performanceMonitor) {
      this.performanceMonitor.reset();
    }

    this.loop(this.lastFrameTime);
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Pause the game loop (keeps running but skips updates)
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume the game loop from pause
   */
  public resume(): void {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.lastFrameTime = performance.now();
      this.accumulator = 0;
    }
  }

  /**
   * Toggle pause state
   */
  public togglePause(): void {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Check if the game loop is currently running
   */
  public isActive(): boolean {
    return this.isRunning && !this.isPaused;
  }

  /**
   * Get current performance statistics
   */
  public getPerformanceStats(): PerformanceStats | null {
    return this.performanceMonitor?.getPerformanceStats() ?? null;
  }

  /**
   * Update target FPS at runtime
   */
  public setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(1, Math.min(120, fps));
    this.targetFrameTime = 1000 / this.targetFPS;
  }

  /**
   * Get current runtime in seconds
   */
  public getRuntime(): number {
    if (!this.startTime) return 0;
    return (performance.now() - this.startTime) / 1000;
  }

  /**
   * Get total frame count since start
   */
  public getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Main game loop using fixed timestep with interpolation
   */
  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    this.frameCount++;

    // Calculate delta time and clamp it to prevent spiral of death
    let deltaTime = currentTime - this.lastFrameTime;
    deltaTime = Math.min(deltaTime, this.maxDeltaTime);
    this.lastFrameTime = currentTime;

    // Start performance monitoring for this frame
    this.performanceMonitor?.startFrame();

    if (!this.isPaused) {
      // Fixed timestep update loop
      this.accumulator += deltaTime;

      // Update game logic at fixed intervals
      while (this.accumulator >= this.targetFrameTime) {
        const interpolation = this.accumulator / this.targetFrameTime;
        this.updateCallback(this.targetFrameTime, Math.min(interpolation, 1));
        this.accumulator -= this.targetFrameTime;
      }

      // Calculate interpolation for smooth rendering between updates
      const renderInterpolation = this.accumulator / this.targetFrameTime;
      
      // Render with interpolation
      this.renderCallback(Math.min(renderInterpolation, 1));
    }

    // End performance monitoring for this frame
    this.performanceMonitor?.endFrame();

    // Update performance statistics periodically
    if (this.performanceCallback && 
        currentTime - this.lastPerformanceUpdate >= this.performanceUpdateInterval) {
      const stats = this.performanceMonitor?.getPerformanceStats();
      if (stats) {
        this.performanceCallback(stats);
      }
      this.lastPerformanceUpdate = currentTime;
    }

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.loop);
  };

  /**
   * Handle performance warnings and adaptive quality adjustments
   */
  private handlePerformanceWarning(stats: PerformanceStats): void {
    // Auto-adjust target FPS if performance is poor
    if (stats.fps < this.targetFPS * 0.7) {
      if (this.targetFPS > 30) {
        this.setTargetFPS(Math.max(30, this.targetFPS - 10));
        console.warn(`Performance warning: Reducing target FPS to ${this.targetFPS}`);
      }
    }

    // Call external performance callback if provided
    this.performanceCallback?.(stats);
  }
}

/**
 * Utility function to create a basic game loop with common defaults
 */
export const createGameLoop = (
  onUpdate: (deltaTime: number, interpolation: number) => void,
  onRender: (interpolation: number) => void,
  options: GameLoopOptions = {}
): GameLoop => {
  return new GameLoop(
    {
      onUpdate,
      onRender,
    },
    options
  );
};

/**
 * Frame rate limiting utility for manual control
 */
export class FrameRateLimiter {
  private lastFrameTime = 0;
  private targetFrameTime: number;

  constructor(targetFPS: number) {
    this.targetFrameTime = 1000 / targetFPS;
  }

  /**
   * Check if enough time has passed for the next frame
   */
  public shouldRender(currentTime: number): boolean {
    return currentTime - this.lastFrameTime >= this.targetFrameTime;
  }

  /**
   * Mark that a frame has been rendered
   */
  public markFrame(currentTime: number): void {
    this.lastFrameTime = currentTime;
  }

  /**
   * Get time until next frame should be rendered
   */
  public getTimeToNextFrame(currentTime: number): number {
    return Math.max(0, this.targetFrameTime - (currentTime - this.lastFrameTime));
  }

  /**
   * Update target FPS
   */
  public setTargetFPS(fps: number): void {
    this.targetFrameTime = 1000 / Math.max(1, fps);
  }
}

/**
 * Simple game loop for basic use cases
 */
export class SimpleGameLoop {
  private isRunning = false;
  private animationId: number | null = null;
  private callback: (deltaTime: number) => void;
  private lastTime = 0;

  constructor(callback: (deltaTime: number) => void) {
    this.callback = callback;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.callback(deltaTime);

    this.animationId = requestAnimationFrame(this.loop);
  };
}