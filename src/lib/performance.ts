/**
 * Performance Monitoring Utilities for Snake Game Production
 * 
 * This module provides comprehensive performance monitoring capabilities
 * including load time tracking, API response measurement, game performance
 * metrics, and system health monitoring.
 */

// Performance metric interfaces
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceMetrics {
  loadTime: number;
  apiResponseTime: number;
  gameFrameRate: number;
  memoryUsage: MemoryInfo | null;
  timestamp: number;
}

interface APIPerformanceResult {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  success: boolean;
  timestamp: number;
}

interface GamePerformanceMetrics {
  averageFPS: number;
  frameDrops: number;
  renderTime: number;
  gameLoopTime: number;
  memoryUsage: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    api: boolean;
    database: boolean;
    memory: boolean;
    performance: boolean;
  };
  metrics: PerformanceMetrics;
  uptime: number;
}

/**
 * Main Performance Monitor Class
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private gameMetrics: GamePerformanceMetrics | null = null;
  private apiMetrics: APIPerformanceResult[] = [];
  private frameRateBuffer: number[] = [];
  private startTime: number;
  private isMonitoring = false;

  // Performance thresholds
  private readonly THRESHOLDS = {
    LOAD_TIME_MAX: 5000, // 5 seconds
    API_RESPONSE_MAX: 2000, // 2 seconds
    MIN_FPS: 30,
    MAX_MEMORY_MB: 100,
  };

  constructor() {
    this.startTime = performance.now();
    
    // Initialize monitoring if in browser environment
    if (typeof window !== 'undefined') {
      this.initializeBrowserMonitoring();
    }
  }

  /**
   * Initialize browser-specific monitoring
   */
  private initializeBrowserMonitoring(): void {
    // Track page load performance
    if ('performance' in window && 'timing' in performance) {
      window.addEventListener('load', () => {
        this.measurePageLoadTime();
      });
    }

    // Track page visibility changes for uptime calculation
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.recordMetrics();
      }
    });
  }

  /**
   * Measure initial page load time
   */
  measurePageLoadTime(): number {
    const loadTime = performance.now() - this.startTime;
    
    // Use Navigation Timing API for more accurate measurements
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        const accurateLoadTime = nav.loadEventEnd - nav.fetchStart;
        
        this.recordLoadTime(accurateLoadTime);
        return accurateLoadTime;
      }
    }
    
    this.recordLoadTime(loadTime);
    return loadTime;
  }

  /**
   * Measure API response time
   */
  async measureApiResponse(endpoint: string, options: RequestInit = {}): Promise<APIPerformanceResult> {
    const startTime = performance.now();
    const method = options.method || 'GET';
    
    try {
      const response = await fetch(endpoint, options);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const result: APIPerformanceResult = {
        endpoint,
        method,
        responseTime,
        status: response.status,
        success: response.ok,
        timestamp: Date.now(),
      };
      
      this.apiMetrics.push(result);
      
      // Keep only last 100 API metrics
      if (this.apiMetrics.length > 100) {
        this.apiMetrics = this.apiMetrics.slice(-100);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const result: APIPerformanceResult = {
        endpoint,
        method,
        responseTime,
        status: 0,
        success: false,
        timestamp: Date.now(),
      };
      
      this.apiMetrics.push(result);
      return result;
    }
  }

  /**
   * Start monitoring game performance
   */
  startGamePerformanceMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameRateBuffer = [];
    
    // Monitor frame rate
    const monitorFrameRate = () => {
      if (!this.isMonitoring) return;
      
      const frameStart = performance.now();
      
      requestAnimationFrame(() => {
        const frameEnd = performance.now();
        const frameDuration = frameEnd - frameStart;
        const fps = 1000 / frameDuration;
        
        this.frameRateBuffer.push(fps);
        
        // Keep buffer size manageable
        if (this.frameRateBuffer.length > 60) { // ~1 second at 60fps
          this.frameRateBuffer.shift();
        }
        
        monitorFrameRate();
      });
    };
    
    monitorFrameRate();
  }

  /**
   * Stop monitoring game performance
   */
  stopGamePerformanceMonitoring(): GamePerformanceMetrics | null {
    if (!this.isMonitoring) return null;
    
    this.isMonitoring = false;
    
    if (this.frameRateBuffer.length === 0) return null;
    
    const averageFPS = this.frameRateBuffer.reduce((sum, fps) => sum + fps, 0) / this.frameRateBuffer.length;
    const frameDrops = this.frameRateBuffer.filter(fps => fps < this.THRESHOLDS.MIN_FPS).length;
    
    this.gameMetrics = {
      averageFPS,
      frameDrops,
      renderTime: 1000 / averageFPS,
      gameLoopTime: performance.now() - this.startTime,
      memoryUsage: this.getMemoryUsage(),
    };
    
    return this.gameMetrics;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Record load time metric
   */
  private recordLoadTime(loadTime: number): void {
    const metric: PerformanceMetrics = {
      loadTime,
      apiResponseTime: 0,
      gameFrameRate: this.getCurrentFPS(),
      memoryUsage: 'memory' in performance ? (performance as any).memory : null,
      timestamp: Date.now(),
    };
    
    this.metrics.push(metric);
  }

  /**
   * Get current FPS
   */
  private getCurrentFPS(): number {
    if (this.frameRateBuffer.length === 0) return 0;
    return this.frameRateBuffer.reduce((sum, fps) => sum + fps, 0) / this.frameRateBuffer.length;
  }

  /**
   * Record current performance metrics
   */
  recordMetrics(): PerformanceMetrics {
    const metric: PerformanceMetrics = {
      loadTime: performance.now() - this.startTime,
      apiResponseTime: this.getAverageAPIResponseTime(),
      gameFrameRate: this.getCurrentFPS(),
      memoryUsage: 'memory' in performance ? (performance as any).memory : null,
      timestamp: Date.now(),
    };
    
    this.metrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    return metric;
  }

  /**
   * Get average API response time
   */
  private getAverageAPIResponseTime(): number {
    if (this.apiMetrics.length === 0) return 0;
    
    const recentMetrics = this.apiMetrics.slice(-10); // Last 10 API calls
    return recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / recentMetrics.length;
  }

  /**
   * Check if performance meets requirements
   */
  checkPerformanceHealth(): SystemHealth {
    const currentMetrics = this.recordMetrics();
    
    const checks = {
      api: this.getAverageAPIResponseTime() < this.THRESHOLDS.API_RESPONSE_MAX,
      database: true, // Will be updated by health check API
      memory: this.getMemoryUsage() < this.THRESHOLDS.MAX_MEMORY_MB,
      performance: currentMetrics.loadTime < this.THRESHOLDS.LOAD_TIME_MAX,
    };
    
    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.values(checks).length;
    
    let status: SystemHealth['status'] = 'healthy';
    if (healthyChecks < totalChecks) {
      status = healthyChecks / totalChecks >= 0.75 ? 'degraded' : 'unhealthy';
    }
    
    return {
      status,
      checks,
      metrics: currentMetrics,
      uptime: performance.now() - this.startTime,
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      metrics: this.metrics.slice(-10), // Last 10 metrics
      apiMetrics: this.apiMetrics.slice(-10), // Last 10 API calls
      gameMetrics: this.gameMetrics,
      health: this.checkPerformanceHealth(),
      thresholds: this.THRESHOLDS,
    };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      apiMetrics: this.apiMetrics,
      gameMetrics: this.gameMetrics,
      thresholds: this.THRESHOLDS,
      browserInfo: typeof navigator !== 'undefined' ? {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
      } : null,
    };
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.apiMetrics = [];
    this.gameMetrics = null;
    this.frameRateBuffer = [];
  }
}

// Singleton instance for global use
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy integration
export const measureApiCall = (endpoint: string, options?: RequestInit) => 
  performanceMonitor.measureApiResponse(endpoint, options);

export const startGameMonitoring = () => 
  performanceMonitor.startGamePerformanceMonitoring();

export const stopGameMonitoring = () => 
  performanceMonitor.stopGamePerformanceMonitoring();

export const getPerformanceHealth = () => 
  performanceMonitor.checkPerformanceHealth();

export const getPerformanceSummary = () => 
  performanceMonitor.getPerformanceSummary();

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  if (typeof window === 'undefined') {
    return {
      monitor: null,
      health: null,
      summary: null,
    };
  }

  return {
    monitor: performanceMonitor,
    health: performanceMonitor.checkPerformanceHealth(),
    summary: performanceMonitor.getPerformanceSummary(),
  };
};

export default PerformanceMonitor;