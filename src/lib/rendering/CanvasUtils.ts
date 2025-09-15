/**
 * Canvas utility functions for high-quality rendering
 */

export interface CanvasDimensions {
  width: number;
  height: number;
  cellSize: number;
}

export class CanvasUtils {
  /**
   * Set up high-DPI canvas for crisp rendering
   */
  static setupHighDPICanvas(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
  ): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    const pixelRatio = window.devicePixelRatio || 1;

    // Set actual canvas size for crisp rendering
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    
    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context for high-DPI displays
    ctx.scale(pixelRatio, pixelRatio);
    
    return ctx;
  }

  /**
   * Clear canvas with background color
   */
  static clearCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    backgroundColor: string = '#1a1a1a'
  ): void {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Draw rounded rectangle
   */
  static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Calculate optimal canvas size based on container and grid
   */
  static calculateOptimalCanvasSize(
    containerWidth: number,
    containerHeight: number,
    gridSize: number,
    maxSize: number = 600
  ): CanvasDimensions {
    const availableSize = Math.min(containerWidth, containerHeight, maxSize);
    const cellSize = Math.floor(availableSize / gridSize);
    const actualSize = cellSize * gridSize;

    return {
      width: actualSize,
      height: actualSize,
      cellSize,
    };
  }

  /**
   * Check if point is within canvas bounds
   */
  static isPointInCanvas(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ): boolean {
    const rect = canvas.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  static screenToGrid(
    screenX: number,
    screenY: number,
    canvas: HTMLCanvasElement,
    cellSize: number
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    return {
      x: Math.floor(canvasX / cellSize),
      y: Math.floor(canvasY / cellSize)
    };
  }

  /**
   * Convert grid coordinates to screen coordinates
   */
  static gridToScreen(
    gridX: number,
    gridY: number,
    cellSize: number
  ): { x: number; y: number } {
    return {
      x: gridX * cellSize,
      y: gridY * cellSize
    };
  }

  /**
   * Create radial gradient
   */
  static createRadialGradient(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    colors: { offset: number; color: string }[]
  ): CanvasGradient {
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    colors.forEach(({ offset, color }) => {
      gradient.addColorStop(offset, color);
    });
    
    return gradient;
  }

  /**
   * Apply common canvas optimizations
   */
  static applyCanvasOptimizations(ctx: CanvasRenderingContext2D): void {
    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;
    
    // Set optimal text baseline and font
    ctx.textBaseline = 'top';
    ctx.font = '16px monospace';
    
    // Optimize line rendering
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
  }
}
