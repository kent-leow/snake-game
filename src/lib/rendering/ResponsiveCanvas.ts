/**
 * Responsive canvas handling for different screen sizes and orientations
 */

import type { CanvasDimensions } from './CanvasUtils';

export interface ResponsiveCanvasOptions {
  minSize: number;
  maxSize: number;
  aspectRatio: number;
  maintainAspectRatio: boolean;
}

export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isPortrait: boolean;
  devicePixelRatio: number;
}

/**
 * Manages responsive canvas sizing and adaptation
 */
export class ResponsiveCanvas {
  private canvas: HTMLCanvasElement;
  private container: Element;
  private options: ResponsiveCanvasOptions;
  private resizeObserver: ResizeObserver | null = null;
  private onResizeCallback?: ((dimensions: CanvasDimensions) => void) | undefined;

  constructor(
    canvas: HTMLCanvasElement,
    container: Element,
    options: Partial<ResponsiveCanvasOptions> = {}
  ) {
    this.canvas = canvas;
    this.container = container;
    this.options = {
      minSize: options.minSize || 300,
      maxSize: options.maxSize || 800,
      aspectRatio: options.aspectRatio || 1,
      maintainAspectRatio: options.maintainAspectRatio ?? true,
    };

    this.setupResizeObserver();
  }

  /**
   * Set up resize observer for responsive behavior
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      // Fallback for browsers without ResizeObserver
      window.addEventListener('resize', this.handleResize);
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.handleContainerResize(entry.contentRect);
      }
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * Handle container resize
   */
  private handleContainerResize(rect: DOMRectReadOnly): void {
    const dimensions = this.calculateResponsiveDimensions(
      rect.width,
      rect.height
    );
    
    this.applyDimensions(dimensions);
    this.onResizeCallback?.(dimensions);
  }

  /**
   * Handle window resize (fallback)
   */
  private handleResize = (): void => {
    const rect = this.container.getBoundingClientRect();
    this.handleContainerResize(rect);
  };

  /**
   * Calculate responsive dimensions based on container size
   */
  private calculateResponsiveDimensions(
    containerWidth: number,
    containerHeight: number
  ): CanvasDimensions {
    const viewport = this.getViewportInfo();
    
    // Adjust for mobile devices
    const availableWidth = viewport.isMobile 
      ? Math.min(containerWidth, viewport.width * 0.95)
      : containerWidth * 0.9;
    
    const availableHeight = viewport.isMobile
      ? Math.min(containerHeight, viewport.height * 0.7)
      : containerHeight * 0.8;

    let width: number;
    let height: number;

    if (this.options.maintainAspectRatio) {
      // Maintain aspect ratio
      const targetSize = Math.min(availableWidth, availableHeight);
      width = height = Math.max(
        this.options.minSize,
        Math.min(this.options.maxSize, targetSize)
      );
    } else {
      // Use container dimensions with constraints
      width = Math.max(
        this.options.minSize,
        Math.min(this.options.maxSize, availableWidth)
      );
      height = Math.max(
        this.options.minSize,
        Math.min(this.options.maxSize, availableHeight)
      );
    }

    // Calculate cell size for grid-based games
    // Assume a default grid size of 20 for calculation
    const cellSize = Math.floor(Math.min(width, height) / 20);
    
    return { width, height, cellSize };
  }

  /**
   * Apply calculated dimensions to canvas
   */
  private applyDimensions(dimensions: CanvasDimensions): void {
    // Set canvas display size
    this.canvas.style.width = `${dimensions.width}px`;
    this.canvas.style.height = `${dimensions.height}px`;

    // Set actual canvas resolution for high-DPI displays
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = dimensions.width * pixelRatio;
    this.canvas.height = dimensions.height * pixelRatio;

    // Apply additional responsive styles
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.maxHeight = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
  }

  /**
   * Get current viewport information
   */
  private getViewportInfo(): ViewportInfo {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth <= 768,
      isPortrait: window.innerHeight > window.innerWidth,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  /**
   * Force resize calculation
   */
  public resize(): CanvasDimensions {
    const rect = this.container.getBoundingClientRect();
    const dimensions = this.calculateResponsiveDimensions(rect.width, rect.height);
    this.applyDimensions(dimensions);
    return dimensions;
  }

  /**
   * Set resize callback
   */
  public onResize(callback: (dimensions: CanvasDimensions) => void): void {
    this.onResizeCallback = callback;
  }

  /**
   * Get current canvas dimensions
   */
  public getCurrentDimensions(): CanvasDimensions {
    const rect = this.canvas.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      cellSize: Math.floor(Math.min(rect.width, rect.height) / 20),
    };
  }

  /**
   * Check if current viewport is mobile
   */
  public isMobile(): boolean {
    return this.getViewportInfo().isMobile;
  }

  /**
   * Update responsive options
   */
  public updateOptions(newOptions: Partial<ResponsiveCanvasOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.resize(); // Trigger resize with new options
  }

  /**
   * Destroy responsive canvas and clean up observers
   */
  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    } else {
      window.removeEventListener('resize', this.handleResize);
    }
    
    this.onResizeCallback = undefined;
  }
}