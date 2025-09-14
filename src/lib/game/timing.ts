/**
 * Timing utilities for precise frame control and time management
 * Provides high-precision timing functions for game loops and animations
 */

/**
 * High-precision timer class for accurate timing measurements
 */
export class PrecisionTimer {
  private startTime = 0;
  private pausedTime = 0;
  private isPaused = false;
  private isRunning = false;

  /**
   * Start the timer
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.startTime = performance.now() - this.pausedTime;
    this.isRunning = true;
    this.isPaused = false;
  }

  /**
   * Stop the timer and reset
   */
  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pausedTime = 0;
  }

  /**
   * Pause the timer
   */
  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    
    this.pausedTime = this.getElapsedTime();
    this.isPaused = true;
  }

  /**
   * Resume the timer from pause
   */
  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    
    this.startTime = performance.now() - this.pausedTime;
    this.isPaused = false;
  }

  /**
   * Get elapsed time in milliseconds
   */
  public getElapsedTime(): number {
    if (!this.isRunning) return 0;
    if (this.isPaused) return this.pausedTime;
    
    return performance.now() - this.startTime;
  }

  /**
   * Get elapsed time in seconds
   */
  public getElapsedSeconds(): number {
    return this.getElapsedTime() / 1000;
  }

  /**
   * Reset the timer to zero
   */
  public reset(): void {
    this.startTime = performance.now();
    this.pausedTime = 0;
    this.isPaused = false;
  }

  /**
   * Check if timer is currently running
   */
  public getIsRunning(): boolean {
    return this.isRunning && !this.isPaused;
  }
}

/**
 * Frame timing utilities for consistent frame rate control
 */
export class FrameTimer {
  private targetFPS: number;
  private targetFrameTime: number;
  private lastFrameTime = 0;
  private deltaTimeHistory: number[] = [];
  private readonly maxHistorySize = 10;

  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.targetFrameTime = 1000 / targetFPS;
  }

  /**
   * Update frame timing and get delta time
   */
  public tick(currentTime: number = performance.now()): number {
    const deltaTime = this.lastFrameTime === 0 ? 0 : currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Track delta time history for analysis
    this.deltaTimeHistory.push(deltaTime);
    if (this.deltaTimeHistory.length > this.maxHistorySize) {
      this.deltaTimeHistory.shift();
    }

    return deltaTime;
  }

  /**
   * Get smoothed delta time based on recent history
   */
  public getSmoothedDeltaTime(): number {
    if (this.deltaTimeHistory.length === 0) return this.targetFrameTime;
    
    // Remove outliers and calculate average
    const sorted = [...this.deltaTimeHistory].sort((a, b) => a - b);
    const start = Math.floor(sorted.length * 0.1);
    const end = Math.ceil(sorted.length * 0.9);
    const filtered = sorted.slice(start, end);
    
    return filtered.reduce((sum, dt) => sum + dt, 0) / filtered.length;
  }

  /**
   * Check if frame timing is stable
   */
  public isStable(tolerance = 2): boolean {
    if (this.deltaTimeHistory.length < this.maxHistorySize) return false;
    
    const avg = this.getSmoothedDeltaTime();
    return this.deltaTimeHistory.every(dt => 
      Math.abs(dt - avg) <= tolerance
    );
  }

  /**
   * Get current estimated FPS
   */
  public getCurrentFPS(): number {
    const avgDelta = this.getSmoothedDeltaTime();
    return avgDelta > 0 ? 1000 / avgDelta : 0;
  }

  /**
   * Update target FPS
   */
  public setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(1, fps);
    this.targetFrameTime = 1000 / this.targetFPS;
  }

  /**
   * Reset timing history
   */
  public reset(): void {
    this.lastFrameTime = 0;
    this.deltaTimeHistory = [];
  }
}

/**
 * Adaptive timing class that adjusts based on performance
 */
export class AdaptiveTimer {
  private frameTimer: FrameTimer;
  private currentFPS: number;
  private targetFPS: number;
  private minFPS: number;
  private maxFPS: number;
  private adjustmentThreshold: number;
  private framesSinceAdjustment = 0;
  private adjustmentInterval = 60; // frames

  constructor(
    targetFPS = 60,
    minFPS = 30,
    maxFPS = 120,
    adjustmentThreshold = 5
  ) {
    this.targetFPS = targetFPS;
    this.currentFPS = targetFPS;
    this.minFPS = minFPS;
    this.maxFPS = maxFPS;
    this.adjustmentThreshold = adjustmentThreshold;
    this.frameTimer = new FrameTimer(targetFPS);
  }

  /**
   * Update timing and adjust FPS if needed
   */
  public update(currentTime?: number): number {
    const deltaTime = this.frameTimer.tick(currentTime);
    this.framesSinceAdjustment++;

    // Check for FPS adjustment periodically
    if (this.framesSinceAdjustment >= this.adjustmentInterval) {
      this.adjustFPS();
      this.framesSinceAdjustment = 0;
    }

    return deltaTime;
  }

  /**
   * Adjust FPS based on current performance
   */
  private adjustFPS(): void {
    const measuredFPS = this.frameTimer.getCurrentFPS();
    const difference = Math.abs(measuredFPS - this.currentFPS);

    if (difference > this.adjustmentThreshold) {
      if (measuredFPS < this.currentFPS - this.adjustmentThreshold) {
        // Performance is worse than expected, lower target
        this.currentFPS = Math.max(this.minFPS, this.currentFPS - 5);
      } else if (measuredFPS > this.currentFPS + this.adjustmentThreshold) {
        // Performance is better than expected, try to increase
        this.currentFPS = Math.min(this.maxFPS, this.currentFPS + 5);
      }

      this.frameTimer.setTargetFPS(this.currentFPS);
    }
  }

  /**
   * Get current adaptive FPS
   */
  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  /**
   * Get measured FPS
   */
  public getMeasuredFPS(): number {
    return this.frameTimer.getCurrentFPS();
  }

  /**
   * Force set target FPS
   */
  public setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(this.minFPS, Math.min(this.maxFPS, fps));
    this.currentFPS = this.targetFPS;
    this.frameTimer.setTargetFPS(this.currentFPS);
  }

  /**
   * Reset adaptive timing
   */
  public reset(): void {
    this.currentFPS = this.targetFPS;
    this.framesSinceAdjustment = 0;
    this.frameTimer.reset();
    this.frameTimer.setTargetFPS(this.currentFPS);
  }
}

/**
 * Time-based interpolation utilities
 */
export class Interpolator {
  /**
   * Linear interpolation between two values
   */
  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Math.max(0, Math.min(1, t));
  }

  /**
   * Smooth step interpolation (ease in/out)
   */
  public static smoothStep(start: number, end: number, t: number): number {
    t = Math.max(0, Math.min(1, t));
    t = t * t * (3 - 2 * t);
    return start + (end - start) * t;
  }

  /**
   * Ease in interpolation
   */
  public static easeIn(start: number, end: number, t: number): number {
    t = Math.max(0, Math.min(1, t));
    t = t * t;
    return start + (end - start) * t;
  }

  /**
   * Ease out interpolation
   */
  public static easeOut(start: number, end: number, t: number): number {
    t = Math.max(0, Math.min(1, t));
    t = 1 - (1 - t) * (1 - t);
    return start + (end - start) * t;
  }

  /**
   * Bounce interpolation
   */
  public static bounce(start: number, end: number, t: number): number {
    t = Math.max(0, Math.min(1, t));
    if (t < 1 / 2.75) {
      t = 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      t = 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      t = 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      t = 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
    return start + (end - start) * t;
  }
}

/**
 * Time utilities for game timing calculations
 */
export const TimeUtils = {
  /**
   * Convert milliseconds to seconds
   */
  msToSeconds: (ms: number): number => ms / 1000,

  /**
   * Convert seconds to milliseconds
   */
  secondsToMs: (seconds: number): number => seconds * 1000,

  /**
   * Get current timestamp in milliseconds
   */
  now: (): number => performance.now(),

  /**
   * Format time duration as MM:SS
   */
  formatDuration: (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Clamp delta time to prevent spiral of death
   */
  clampDeltaTime: (deltaTime: number, maxDelta = 50): number => {
    return Math.min(deltaTime, maxDelta);
  },

  /**
   * Calculate FPS from delta time
   */
  deltaToFPS: (deltaTime: number): number => {
    return deltaTime > 0 ? 1000 / deltaTime : 0;
  },

  /**
   * Check if enough time has passed for a certain interval
   */
  hasIntervalPassed: (lastTime: number, interval: number, currentTime?: number): boolean => {
    const now = currentTime ?? performance.now();
    return now - lastTime >= interval;
  },
} as const;