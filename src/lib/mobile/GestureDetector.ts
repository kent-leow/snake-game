import type { Direction } from '@/lib/game/types';

/**
 * Touch gesture detection and processing
 * Handles swipe gesture recognition with configurable sensitivity
 */
export class GestureDetector {
  private startPosition: { x: number; y: number } | null = null;
  private isTracking = false;
  private sensitivity: number;
  private readonly minDistance: number;

  constructor(sensitivity: number = 50, minDistance: number = 30) {
    this.sensitivity = sensitivity;
    this.minDistance = minDistance;
  }

  /**
   * Start tracking touch gesture
   */
  public startTracking(clientX: number, clientY: number): void {
    this.startPosition = { x: clientX, y: clientY };
    this.isTracking = true;
  }

  /**
   * End tracking and detect gesture direction
   */
  public endTracking(clientX: number, clientY: number): Direction | null {
    if (!this.isTracking || !this.startPosition) {
      this.resetTracking();
      return null;
    }

    const deltaX = clientX - this.startPosition.x;
    const deltaY = clientY - this.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    this.resetTracking();

    // Check if gesture meets minimum distance requirement
    if (distance < this.minDistance) {
      return null;
    }

    // Check if gesture meets sensitivity threshold
    if (distance < this.sensitivity) {
      return null;
    }

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine primary direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      return deltaX > 0 ? 'RIGHT' : 'LEFT';
    } else if (absDeltaY > absDeltaX) {
      // Vertical swipe
      return deltaY > 0 ? 'DOWN' : 'UP';
    } else {
      // Equal movement - prefer horizontal by default
      return deltaX > 0 ? 'RIGHT' : 'LEFT';
    }
  }

  /**
   * Cancel tracking
   */
  public cancelTracking(): void {
    this.resetTracking();
  }

  /**
   * Check if currently tracking a gesture
   */
  public isTrackingGesture(): boolean {
    return this.isTracking;
  }

  /**
   * Get current tracking position
   */
  public getTrackingPosition(): { x: number; y: number } | null {
    return this.startPosition ? { ...this.startPosition } : null;
  }

  /**
   * Update sensitivity configuration
   */
  public setSensitivity(sensitivity: number): void {
    this.sensitivity = Math.max(10, sensitivity);
  }

  /**
   * Get current sensitivity value
   */
  public getSensitivity(): number {
    return this.sensitivity;
  }

  /**
   * Reset tracking state
   */
  private resetTracking(): void {
    this.startPosition = null;
    this.isTracking = false;
  }
}

export default GestureDetector;