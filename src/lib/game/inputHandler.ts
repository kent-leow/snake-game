import type { Direction } from '@/lib/game/types';
import { isValidDirectionChange } from '@/lib/utils/direction';

/**
 * Input validation options
 */
interface InputValidationOptions {
  allowReverseDirection?: boolean;
  maxQueueSize?: number;
  enableInputBuffer?: boolean;
}

/**
 * Input handler class for processing and validating game input
 * Manages direction change queue and input validation
 */
export class InputHandler {
  private currentDirection: Direction;
  private inputQueue: Direction[] = [];
  private readonly options: Required<InputValidationOptions>;

  constructor(
    initialDirection: Direction = 'RIGHT',
    options: InputValidationOptions = {}
  ) {
    this.currentDirection = initialDirection;
    this.options = {
      allowReverseDirection: false,
      maxQueueSize: 2,
      enableInputBuffer: true,
      ...options,
    };
  }

  /**
   * Process direction change input with validation
   */
  public processDirectionInput(direction: Direction): boolean {
    // Validate direction change
    if (!this.isValidDirectionInput(direction)) {
      return false;
    }

    // Handle input buffering
    if (this.options.enableInputBuffer) {
      return this.queueDirectionChange(direction);
    } else {
      // Apply direction change immediately
      this.currentDirection = direction;
      return true;
    }
  }

  /**
   * Queue direction change for next movement update
   */
  private queueDirectionChange(direction: Direction): boolean {
    // Check if queue is full
    if (this.inputQueue.length >= this.options.maxQueueSize) {
      // Replace the last queued direction with the new one
      this.inputQueue[this.inputQueue.length - 1] = direction;
      return true;
    }

    // Add to queue if it's different from the last queued direction
    const lastQueued =
      this.inputQueue.length > 0
        ? this.inputQueue[this.inputQueue.length - 1]
        : this.currentDirection;

    if (lastQueued !== direction) {
      this.inputQueue.push(direction);
      return true;
    }

    return false;
  }

  /**
   * Process queued direction changes and update current direction
   */
  public processQueuedInput(): boolean {
    if (this.inputQueue.length === 0) {
      return false;
    }

    const nextDirection = this.inputQueue.shift()!;

    // Final validation before applying direction change
    if (this.isValidDirectionInput(nextDirection)) {
      this.currentDirection = nextDirection;
      return true;
    }

    // If invalid, try the next queued direction
    return this.processQueuedInput();
  }

  /**
   * Validate if direction input is allowed
   */
  private isValidDirectionInput(direction: Direction): boolean {
    // Check reverse direction validation
    if (!this.options.allowReverseDirection) {
      return isValidDirectionChange(this.currentDirection, direction);
    }

    return true;
  }

  /**
   * Get current direction
   */
  public getCurrentDirection(): Direction {
    return this.currentDirection;
  }

  /**
   * Get queued directions
   */
  public getQueuedDirections(): Direction[] {
    return [...this.inputQueue];
  }

  /**
   * Check if input queue has pending directions
   */
  public hasQueuedInput(): boolean {
    return this.inputQueue.length > 0;
  }

  /**
   * Clear input queue
   */
  public clearQueue(): void {
    this.inputQueue = [];
  }

  /**
   * Set current direction directly (useful for initialization)
   */
  public setDirection(direction: Direction): void {
    this.currentDirection = direction;
    this.clearQueue();
  }

  /**
   * Get queue size
   */
  public getQueueSize(): number {
    return this.inputQueue.length;
  }

  /**
   * Check if direction is queued
   */
  public isDirectionQueued(direction: Direction): boolean {
    return this.inputQueue.includes(direction);
  }

  /**
   * Reset input handler to initial state
   */
  public reset(initialDirection: Direction = 'RIGHT'): void {
    this.currentDirection = initialDirection;
    this.clearQueue();
  }

  /**
   * Update input handler options
   */
  public updateOptions(options: Partial<InputValidationOptions>): void {
    Object.assign(this.options, options);
  }

  /**
   * Get input handler status for debugging
   */
  public getStatus(): {
    currentDirection: Direction;
    queuedDirections: Direction[];
    queueSize: number;
    options: Required<InputValidationOptions>;
  } {
    return {
      currentDirection: this.currentDirection,
      queuedDirections: this.getQueuedDirections(),
      queueSize: this.getQueueSize(),
      options: { ...this.options },
    };
  }
}