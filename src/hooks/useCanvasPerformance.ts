/**
 * React hook for canvas performance monitoring integration
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { PerformanceMonitor } from '../lib/rendering/PerformanceMonitor';
import type { PerformanceMetrics } from '../lib/rendering/PerformanceMonitor';

export interface UseCanvasPerformanceOptions {
  enabled?: boolean;
  updateInterval?: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export interface UseCanvasPerformanceReturn {
  monitor: PerformanceMonitor | null;
  metrics: PerformanceMetrics | null;
  isEnabled: boolean;
  enable: () => void;
  disable: () => void;
  reset: () => void;
}

/**
 * Hook for managing canvas performance monitoring
 */
export const useCanvasPerformance = ({
  enabled = process.env.NODE_ENV === 'development',
  updateInterval = 1000,
  onMetricsUpdate,
}: UseCanvasPerformanceOptions = {}): UseCanvasPerformanceReturn => {
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isEnabled, setIsEnabled] = useState(enabled);

  /**
   * Update metrics from monitor
   */
  const updateMetrics = useCallback(() => {
    if (!monitorRef.current || !monitorRef.current.isEnabled()) {
      return;
    }

    const currentMetrics = monitorRef.current.getMetrics();
    setMetrics(currentMetrics);
    onMetricsUpdate?.(currentMetrics);
  }, [onMetricsUpdate]);

  /**
   * Enable performance monitoring
   */
  const enable = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.enable();
      setIsEnabled(true);
      
      // Start update interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(updateMetrics, updateInterval);
    }
  }, [updateMetrics, updateInterval]);

  /**
   * Disable performance monitoring
   */
  const disable = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.disable();
      setIsEnabled(false);
      
      // Clear update interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setMetrics(null);
    }
  }, []);

  /**
   * Reset performance monitor
   */
  const reset = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.reset();
      setMetrics(null);
    }
  }, []);

  /**
   * Initialize performance monitor
   */
  useEffect(() => {
    const monitor = new PerformanceMonitor(enabled);
    monitorRef.current = monitor;
    setIsEnabled(monitor.isEnabled());

    // Start monitoring if enabled
    if (enabled) {
      intervalRef.current = setInterval(updateMetrics, updateInterval);
    }

    // Cleanup
    return (): void => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      monitorRef.current?.destroy();
      monitorRef.current = null;
    };
  }, [enabled, updateInterval, updateMetrics]);

  /**
   * Update enabled state when prop changes
   */
  useEffect(() => {
    if (enabled && !isEnabled) {
      enable();
    } else if (!enabled && isEnabled) {
      disable();
    }
  }, [enabled, isEnabled, enable, disable]);

  return {
    monitor: monitorRef.current,
    metrics,
    isEnabled,
    enable,
    disable,
    reset,
  };
};