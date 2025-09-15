/**
 * Game render loop management with frame rate control
 */

import type { PerformanceMonitor } from './PerformanceMonitor';

export interface RenderLoopCallbacks {
  onUpdate: (deltaTime: number, interpolation: number) => void;
  onRender: (interpolation: number) => void;
  onPerformanceUpdate?: (fps: number) => void;
}

export interface RenderLoopOptions {
  targetFPS?: number;
  maxDeltaTime?: number;
  enablePerformanceMonitoring?: boolean;
}

/**
 * High-performance render loop with frame rate limiting and interpolation
 */
export class RenderLoop {
  private callbacks: RenderLoopCallbacks;
  private options: Required<RenderLoopOptions>;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameInterval: number;
  private accumulator: number = 0;
  private performanceMonitor: PerformanceMonitor | null = null;

  constructor(
    callbacks: RenderLoopCallbacks,
    options: RenderLoopOptions = {},
    performanceMonitor?: PerformanceMonitor
  ) {
    this.callbacks = callbacks;
    this.options = {
      targetFPS: options.targetFPS || 60,
      maxDeltaTime: options.maxDeltaTime || 100,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
    };
    this.frameInterval = 1000 / this.options.targetFPS;
    this.performanceMonitor = performanceMonitor || null;
  }

  /**
   * Start the render loop
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.accumulator = 0;
    this.loop();
  }

  /**
   * Stop the render loop
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause the render loop
   */
  public pause(): void {
    this.stop();
  }

  /**
   * Resume the render loop
   */
  public resume(): void {
    this.start();
  }

  /**
   * Main render loop with fixed timestep and interpolation
   */
  private loop = (currentTime: number = performance.now()): void => {
    if (!this.isRunning) return;

    try {
      this.performanceMonitor?.startFrame();

      const deltaTime = Math.min(
        currentTime - this.lastFrameTime,
        this.options.maxDeltaTime
      );
      
      this.lastFrameTime = currentTime;
      this.accumulator += deltaTime;

      // Fixed timestep updates
      while (this.accumulator >= this.frameInterval) {
        this.callbacks.onUpdate(this.frameInterval, 1.0);
        this.accumulator -= this.frameInterval;
      }

      // Interpolated rendering
      const interpolation = this.accumulator / this.frameInterval;
      this.callbacks.onRender(interpolation);

      this.performanceMonitor?.endFrame();

      // Report performance if enabled
      if (this.options.enablePerformanceMonitoring && this.performanceMonitor) {
        const fps = this.performanceMonitor.getCurrentFPS();
        if (fps > 0) {
          this.callbacks.onPerformanceUpdate?.(fps);
        }
      }
    } catch (error) {
      console.error('Render loop error:', error);
      this.performanceMonitor?.recordError();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Set target FPS
   */
  public setTargetFPS(fps: number): void {
    this.options.targetFPS = Math.max(30, Math.min(120, fps));
    this.frameInterval = 1000 / this.options.targetFPS;
  }

  /**
   * Get current target FPS
   */
  public getTargetFPS(): number {
    return this.options.targetFPS;
  }

  /**
   * Check if loop is running
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Update callbacks
   */
  public updateCallbacks(callbacks: Partial<RenderLoopCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return this.performanceMonitor?.getMetrics() || null;
  }

  /**
   * Destroy the render loop and clean up resources
   */
  public destroy(): void {
    this.stop();
    this.performanceMonitor = null;
  }
}
