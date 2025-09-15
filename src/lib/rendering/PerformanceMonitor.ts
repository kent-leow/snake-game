/**
 * Performance monitoring system for canvas rendering
 * Tracks FPS, frame times, and performance metrics
 */

export interface PerformanceMetrics {
  fps: number;
  averageFrameTime: number;
  errorCount: number;
  enabled: boolean;
}

/**
 * Performance monitoring system
 */
export class PerformanceMonitor {
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFPS: number = 0;
  private frameTimes: number[] = [];
  private errorCount: number = 0;
  private enabled: boolean = false;
  private readonly maxFrameTimes: number = 60;

  constructor(enabled: boolean = process.env.NODE_ENV === 'development') {
    this.enabled = enabled;
    this.lastFpsUpdate = performance.now();
  }

  public startFrame(): void {
    if (!this.enabled) return;
    this.frameCount++;
  }

  public endFrame(): void {
    if (!this.enabled) return;

    const now = performance.now();
    this.frameTimes.push(now);

    // Calculate FPS every second
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFPS = Math.round(
        (this.frameCount * 1000) / (now - this.lastFpsUpdate)
      );
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Keep only recent frame times
    if (this.frameTimes.length > this.maxFrameTimes) {
      this.frameTimes = this.frameTimes.slice(-this.maxFrameTimes);
    }
  }

  public recordError(): void {
    this.errorCount++;
  }

  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  public getAverageFrameTime(): number {
    if (this.frameTimes.length < 2) return 0;

    const deltas = [];
    for (let i = 1; i < this.frameTimes.length; i++) {
      deltas.push(this.frameTimes[i] - this.frameTimes[i - 1]);
    }

    return deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  }

  public getMetrics(): PerformanceMetrics {
    return {
      fps: this.currentFPS,
      averageFrameTime: this.getAverageFrameTime(),
      errorCount: this.errorCount,
      enabled: this.enabled,
    };
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public reset(): void {
    this.frameTimes = [];
    this.frameCount = 0;
    this.errorCount = 0;
    this.currentFPS = 0;
    this.lastFpsUpdate = performance.now();
  }

  public destroy(): void {
    this.reset();
    this.enabled = false;
  }
}
