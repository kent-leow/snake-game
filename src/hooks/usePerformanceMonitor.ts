/**
 * React hook for performance monitoring in games
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { PerformanceMonitor, type PerformanceStats, detectDevicePerformance } from '@/lib/game/performance';

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (
  enabled = true,
  options: {
    targetFPS?: number;
    updateInterval?: number;
    warningThreshold?: number;
  } = {}
) => {
  const { targetFPS = 60, updateInterval = 1000, warningThreshold = 30 } = options;
  
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [devicePerformance, setDevicePerformance] = useState<'high' | 'medium' | 'low'>('medium');
  const [warnings, setWarnings] = useState<string[]>([]);

  // Initialize performance monitor
  useEffect(() => {
    if (!enabled) return;

    // Detect device performance on mount
    setDevicePerformance(detectDevicePerformance());

    monitorRef.current = new PerformanceMonitor(
      { targetFPS },
      (perfStats) => {
        if (perfStats.fps < warningThreshold) {
          setWarnings(prev => [...prev, `Low FPS detected: ${perfStats.fps}`]);
        }
      }
    );

    return () => {
      monitorRef.current = null;
    };
  }, [enabled, targetFPS, warningThreshold]);

  // Update stats periodically
  useEffect(() => {
    if (!enabled || !monitorRef.current) return;

    const interval = setInterval(() => {
      const currentStats = monitorRef.current?.getPerformanceStats();
      if (currentStats) {
        setStats(currentStats);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [enabled, updateInterval]);

  const startFrame = useCallback(() => {
    monitorRef.current?.startFrame();
  }, []);

  const endFrame = useCallback(() => {
    monitorRef.current?.endFrame();
  }, []);

  const reset = useCallback(() => {
    monitorRef.current?.reset();
    setStats(null);
    setWarnings([]);
  }, []);

  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  return {
    stats,
    devicePerformance,
    warnings,
    startFrame,
    endFrame,
    reset,
    clearWarnings,
    monitor: monitorRef.current,
  };
};