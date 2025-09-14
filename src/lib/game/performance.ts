/**
 * Performance monitoring utilities for game optimization
 * Tracks FPS, frame times, and provides performance statistics
 */

export interface PerformanceStats {
  fps: number;
  averageFrameTime: number;
  maxFrameTime: number;
  minFrameTime: number;
  totalFrames: number;
  droppedFrames: number;
}

export interface PerformanceConfig {
  targetFPS: number;
  minFPSMobile: number;
  maxDeltaTime: number;
  sampleSize: number;
  fpsUpdateInterval: number;
  frameTimeWarningThreshold: number;
}

/**
 * Performance monitoring system for tracking game performance metrics
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private totalFrameCount = 0;
  private droppedFrameCount = 0;
  private lastFPSTime = 0;
  private currentFPS = 0;
  private frameStartTime = 0;
  private frameTimes: number[] = [];
  private readonly maxFrameTimeHistory: number;
  private readonly config: PerformanceConfig;
  private performanceWarningCallback: ((stats: PerformanceStats) => void) | undefined;

  constructor(
    config: Partial<PerformanceConfig> = {},
    onPerformanceWarning?: (stats: PerformanceStats) => void
  ) {
    this.config = {
      targetFPS: 60,
      minFPSMobile: 30,
      maxDeltaTime: 100,
      sampleSize: 60,
      fpsUpdateInterval: 1000,
      frameTimeWarningThreshold: 16.67,
      ...config,
    };
    this.maxFrameTimeHistory = this.config.sampleSize;
    this.performanceWarningCallback = onPerformanceWarning;
  }

  /**
   * Mark the start of a frame for timing measurement
   */
  public startFrame(): void {
    this.frameStartTime = performance.now();
  }

  /**
   * Mark the end of a frame and update performance metrics
   */
  public endFrame(): void {
    const frameEndTime = performance.now();
    const frameTime = frameEndTime - this.frameStartTime;

    // Track frame times for analysis
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }

    // Check for dropped frames
    if (frameTime > this.config.frameTimeWarningThreshold) {
      this.droppedFrameCount++;
    }

    // Calculate FPS
    this.frameCount++;
    this.totalFrameCount++;
    
    if (frameEndTime - this.lastFPSTime >= this.config.fpsUpdateInterval) {
      this.currentFPS = Math.round(
        (this.frameCount * 1000) / (frameEndTime - this.lastFPSTime)
      );
      this.frameCount = 0;
      this.lastFPSTime = frameEndTime;

      // Check for performance warnings
      this.checkPerformanceWarnings();
    }
  }

  /**
   * Get current FPS reading
   */
  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  /**
   * Get average frame time over the sample period
   */
  public getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return (
      this.frameTimes.reduce((sum, time) => sum + time, 0) /
      this.frameTimes.length
    );
  }

  /**
   * Get comprehensive performance statistics
   */
  public getPerformanceStats(): PerformanceStats {
    return {
      fps: this.currentFPS,
      averageFrameTime: this.getAverageFrameTime(),
      maxFrameTime: this.frameTimes.length > 0 ? Math.max(...this.frameTimes) : 0,
      minFrameTime: this.frameTimes.length > 0 ? Math.min(...this.frameTimes) : 0,
      totalFrames: this.totalFrameCount,
      droppedFrames: this.droppedFrameCount,
    };
  }

  /**
   * Reset all performance counters
   */
  public reset(): void {
    this.frameCount = 0;
    this.totalFrameCount = 0;
    this.droppedFrameCount = 0;
    this.lastFPSTime = 0;
    this.currentFPS = 0;
    this.frameStartTime = 0;
    this.frameTimes = [];
  }

  /**
   * Check if current performance warrants a warning
   */
  private checkPerformanceWarnings(): void {
    if (!this.performanceWarningCallback) return;

    const stats = this.getPerformanceStats();
    
    // Warning conditions
    const lowFPS = stats.fps < this.config.minFPSMobile;
    const highFrameTime = stats.averageFrameTime > this.config.frameTimeWarningThreshold * 2;
    const highDroppedFrameRatio = stats.droppedFrames / stats.totalFrames > 0.1;

    if (lowFPS || highFrameTime || highDroppedFrameRatio) {
      this.performanceWarningCallback(stats);
    }
  }

  /**
   * Get recommended quality settings based on current performance
   */
  public getRecommendedQuality(): 'high' | 'medium' | 'low' {
    const stats = this.getPerformanceStats();
    
    if (stats.fps >= this.config.targetFPS * 0.9) {
      return 'high';
    } else if (stats.fps >= this.config.minFPSMobile) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

/**
 * Device performance detection utilities
 */
export const detectDevicePerformance = (): 'high' | 'medium' | 'low' => {
  // Check hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency >= 8) return 'high';
  if (navigator.hardwareConcurrency >= 4) return 'medium';
  
  // Check for WebGL support and renderer info
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  
  if (!gl) return 'low';

  try {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
      
      // Basic heuristics for GPU performance
      if (renderer.includes('GTX') || renderer.includes('RTX') || renderer.includes('RX')) {
        return 'high';
      }
    }
  } catch {
    // Ignore errors in GPU detection
  }

  // Check memory (if available)
  if ('deviceMemory' in navigator) {
    const memory = (navigator as Record<string, unknown>).deviceMemory;
    if (typeof memory === 'number') {
      if (memory >= 8) return 'high';
      if (memory >= 4) return 'medium';
    }
  }

  // Default to medium for modern browsers
  return 'medium';
};

/**
 * Performance optimization suggestions based on current metrics
 */
export const getOptimizationSuggestions = (stats: PerformanceStats): string[] => {
  const suggestions: string[] = [];

  if (stats.fps < 30) {
    suggestions.push('Consider reducing game speed or simplifying graphics');
    suggestions.push('Enable performance mode to reduce visual effects');
  }

  if (stats.averageFrameTime > 33) {
    suggestions.push('Game loop is taking too long - optimize update logic');
  }

  if (stats.droppedFrames / stats.totalFrames > 0.1) {
    suggestions.push('High frame drop rate - consider adaptive quality settings');
  }

  if (stats.maxFrameTime > 100) {
    suggestions.push('Frame time spikes detected - check for blocking operations');
  }

  return suggestions;
};

/**
 * Adaptive quality settings based on performance
 */
export interface QualitySettings {
  enableGrid: boolean;
  enableParticles: boolean;
  enableSmoothAnimation: boolean;
  targetFPS: number;
}

export const getAdaptiveQualitySettings = (
  devicePerformance: 'high' | 'medium' | 'low',
  currentStats?: PerformanceStats
): QualitySettings => {
  const baseSettings: Record<string, QualitySettings> = {
    high: {
      enableGrid: true,
      enableParticles: true,
      enableSmoothAnimation: true,
      targetFPS: 60,
    },
    medium: {
      enableGrid: true,
      enableParticles: false,
      enableSmoothAnimation: true,
      targetFPS: 60,
    },
    low: {
      enableGrid: false,
      enableParticles: false,
      enableSmoothAnimation: false,
      targetFPS: 30,
    },
  };

  let settings = baseSettings[devicePerformance];

  // Adjust based on current performance if available
  if (currentStats) {
    if (currentStats.fps < 30 && settings.targetFPS === 60) {
      settings = { ...settings, targetFPS: 30, enableParticles: false };
    }
    if (currentStats.fps < 20) {
      settings = { ...settings, enableGrid: false, enableSmoothAnimation: false };
    }
  }

  return settings;
};