import { useRef, useEffect, useCallback } from 'react';
import { CollisionDetector, type CollisionResult } from '../lib/game/collisionDetection';
import type { Snake } from '../lib/game/types';

/**
 * Options for the collision detection hook
 */
interface UseCollisionDetectionOptions {
  snake: Snake;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  onCollision: (result: CollisionResult) => void;
  enabled: boolean;
}

/**
 * Hook return type
 */
interface UseCollisionDetectionReturn {
  checkCollisions: () => CollisionResult | null;
  isEnabled: boolean;
  hasDetector: boolean;
}

/**
 * React hook for collision detection
 * Provides collision detection functionality for React components
 */
export const useCollisionDetection = ({
  snake,
  canvasWidth,
  canvasHeight,
  gridSize,
  onCollision,
  enabled,
}: UseCollisionDetectionOptions): UseCollisionDetectionReturn => {
  const detectorRef = useRef<CollisionDetector | null>(null);

  // Initialize collision detector when dimensions or settings change
  useEffect(() => {
    if (!enabled) {
      detectorRef.current = null;
      return;
    }

    detectorRef.current = new CollisionDetector(
      canvasWidth,
      canvasHeight,
      gridSize
    );
  }, [canvasWidth, canvasHeight, gridSize, enabled]);

  // Update detector boundaries when canvas size changes
  useEffect(() => {
    if (enabled && detectorRef.current) {
      detectorRef.current.updateBoundaries(canvasWidth, canvasHeight);
    }
  }, [canvasWidth, canvasHeight, enabled]);

  /**
   * Check collisions for the current snake state
   */
  const checkCollisions = useCallback(() => {
    if (!enabled || !detectorRef.current) return null;

    const result = detectorRef.current.checkAllCollisions(snake);
    if (result.hasCollision) {
      onCollision(result);
    }
    return result;
  }, [snake, onCollision, enabled]);

  return {
    checkCollisions,
    isEnabled: enabled,
    hasDetector: detectorRef.current !== null,
  };
};

/**
 * Simplified hook that only checks for collisions without callbacks
 */
export const useCollisionChecker = (
  snake: Snake,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number,
  enabled: boolean = true
) => {
  const detectorRef = useRef<CollisionDetector | null>(null);

  useEffect(() => {
    if (!enabled) {
      detectorRef.current = null;
      return;
    }

    detectorRef.current = new CollisionDetector(
      canvasWidth,
      canvasHeight,
      gridSize
    );
  }, [canvasWidth, canvasHeight, gridSize, enabled]);

  const checkCollisions = useCallback((): CollisionResult | null => {
    if (!enabled || !detectorRef.current) return null;
    return detectorRef.current.checkAllCollisions(snake);
  }, [snake, enabled]);

  const checkBoundaryCollision = useCallback((position = snake.segments[0]): boolean => {
    if (!enabled || !detectorRef.current) return false;
    return detectorRef.current.checkWallCollision(position);
  }, [snake.segments, enabled]);

  const checkSelfCollision = useCallback((): boolean => {
    if (!enabled || !detectorRef.current) return false;
    return detectorRef.current.checkSnakeSelfCollision(snake);
  }, [snake, enabled]);

  return {
    checkCollisions,
    checkBoundaryCollision,
    checkSelfCollision,
    detector: detectorRef.current,
  };
};

/**
 * Hook for advanced collision detection with performance monitoring
 */
export const useAdvancedCollisionDetection = ({
  snake,
  canvasWidth,
  canvasHeight,
  gridSize,
  onCollision,
  enabled,
  enablePerformanceMonitoring = false,
}: UseCollisionDetectionOptions & { enablePerformanceMonitoring?: boolean }) => {
  const detectorRef = useRef<CollisionDetector | null>(null);
  const performanceRef = useRef<{
    checksCount: number;
    totalTime: number;
    averageTime: number;
  }>({
    checksCount: 0,
    totalTime: 0,
    averageTime: 0,
  });

  useEffect(() => {
    if (!enabled) {
      detectorRef.current = null;
      return;
    }

    detectorRef.current = new CollisionDetector(
      canvasWidth,
      canvasHeight,
      gridSize
    );
  }, [canvasWidth, canvasHeight, gridSize, enabled]);

  const checkCollisions = useCallback(() => {
    if (!enabled || !detectorRef.current) return null;

    const startTime = enablePerformanceMonitoring ? performance.now() : 0;

    const result = detectorRef.current.checkAllCollisions(snake);
    
    if (enablePerformanceMonitoring) {
      const endTime = performance.now();
      const checkTime = endTime - startTime;
      
      performanceRef.current.checksCount++;
      performanceRef.current.totalTime += checkTime;
      performanceRef.current.averageTime = 
        performanceRef.current.totalTime / performanceRef.current.checksCount;
    }

    if (result.hasCollision) {
      onCollision(result);
    }
    
    return result;
  }, [snake, onCollision, enabled, enablePerformanceMonitoring]);

  const getPerformanceStats = useCallback(() => {
    return { ...performanceRef.current };
  }, []);

  const resetPerformanceStats = useCallback(() => {
    performanceRef.current = {
      checksCount: 0,
      totalTime: 0,
      averageTime: 0,
    };
  }, []);

  return {
    checkCollisions,
    getPerformanceStats,
    resetPerformanceStats,
    isEnabled: enabled,
    hasDetector: detectorRef.current !== null,
  };
};