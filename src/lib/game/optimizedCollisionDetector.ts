import { CollisionDetector, type CollisionResult } from './collisionDetection';
import type { Position, Snake } from './types';

/**
 * Optimized collision detector with caching for performance
 * Extends the base CollisionDetector with performance optimizations
 */
export class OptimizedCollisionDetector extends CollisionDetector {
  private lastCheckedPosition: Position | null = null;
  private lastResult: CollisionResult | null = null;

  /**
   * Check all collisions with caching optimization
   */
  public checkAllCollisions(snake: Snake): CollisionResult {
    const head = snake.segments[0];

    // Cache optimization: if head hasn't moved, return cached result
    if (
      this.lastCheckedPosition &&
      this.lastCheckedPosition.x === head.x &&
      this.lastCheckedPosition.y === head.y &&
      this.lastResult
    ) {
      return this.lastResult;
    }

    const result = super.checkAllCollisions(snake);

    // Cache the result
    this.lastCheckedPosition = { ...head };
    this.lastResult = result;

    return result;
  }

  /**
   * Clear cache when snake state changes
   */
  public clearCache(): void {
    this.lastCheckedPosition = null;
    this.lastResult = null;
  }

  /**
   * Update boundaries and clear cache
   */
  public updateBoundaries(canvasWidth: number, canvasHeight: number): void {
    super.updateBoundaries(canvasWidth, canvasHeight);
    this.clearCache();
  }

  /**
   * Check if cache is valid for current position
   */
  public isCacheValid(position: Position): boolean {
    return (
      this.lastCheckedPosition !== null &&
      this.lastCheckedPosition.x === position.x &&
      this.lastCheckedPosition.y === position.y
    );
  }

  /**
   * Get cache statistics for debugging
   */
  public getCacheStats(): {
    hasCachedResult: boolean;
    lastPosition: Position | null;
    lastResultType: string | null;
  } {
    return {
      hasCachedResult: this.lastResult !== null,
      lastPosition: this.lastCheckedPosition,
      lastResultType: this.lastResult?.type || null,
    };
  }
}