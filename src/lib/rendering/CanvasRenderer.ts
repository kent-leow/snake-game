/**
 * Core canvas rendering engine for the Snake game
 * Handles all drawing operations with high performance and visual quality
 */

import type { Snake, EnhancedFood } from '@/lib/game/types';
import type { NumberedFood } from '@/lib/game/multipleFoodTypes';
import { FoodRenderer } from '@/game/FoodRenderer';
import { CanvasUtils, type CanvasDimensions } from './CanvasUtils';
import type { PerformanceMonitor } from './PerformanceMonitor';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
  gridSize: number;
  cellSize: number;
}

export interface GameElements {
  snake: Snake;
  food: EnhancedFood | null;
  multipleFoods?: NumberedFood[];
  useMultipleFood?: boolean;
  score: number;
  gameState: 'playing' | 'paused' | 'game-over' | 'menu';
}

export interface GameConfig {
  gridSize: number;
  gameSpeed: number;
  enableSound: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * High-performance canvas renderer for Snake game
 */
export class CanvasRenderer {
  private renderContext: RenderContext;
  private performanceMonitor: PerformanceMonitor | null = null;
  private lastRenderTime: number = 0;
  private gridColor: string = '#333333';
  private backgroundColor: string = '#1a1a1a';
  private foodRenderer: FoodRenderer | null = null;
  
  // Double buffering
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor(
    canvas: HTMLCanvasElement,
    gameConfig: GameConfig,
    performanceMonitor?: PerformanceMonitor
  ) {
    this.renderContext = this.initializeRenderContext(canvas, gameConfig);
    this.performanceMonitor = performanceMonitor || null;
    
    // Set up double buffering
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.renderContext.width * this.renderContext.pixelRatio;
    this.offscreenCanvas.height = this.renderContext.height * this.renderContext.pixelRatio;
    const ctx = this.offscreenCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get offscreen 2D context');
    }
    this.offscreenCtx = ctx;
    this.offscreenCtx.scale(this.renderContext.pixelRatio, this.renderContext.pixelRatio);
    
    this.setupCanvasOptimizations();
    
    // Initialize food renderer with offscreen context
    this.foodRenderer = new FoodRenderer(
      this.offscreenCtx,
      this.renderContext.gridSize
    );
  }

  /**
   * Initialize rendering context with high-DPI support
   */
  private initializeRenderContext(
    canvas: HTMLCanvasElement,
    config: GameConfig
  ): RenderContext {
    const pixelRatio = window.devicePixelRatio || 1;
    const { width, height, cellSize } = this.calculateCanvasDimensions(
      config,
      canvas.parentElement
    );

    const ctx = CanvasUtils.setupHighDPICanvas(canvas, width, height);

    return {
      canvas,
      ctx,
      width,
      height,
      pixelRatio,
      gridSize: config.gridSize,
      cellSize,
    };
  }

  /**
   * Apply canvas optimizations for better performance
   */
  private setupCanvasOptimizations(): void {
    CanvasUtils.applyCanvasOptimizations(this.renderContext.ctx);
    CanvasUtils.applyCanvasOptimizations(this.offscreenCtx);
  }

  /**
   * Main render method - draws all game elements
   */
  public render(gameElements: GameElements, interpolation: number = 1.0): void {
    try {
      const startTime = performance.now();

      // Render to offscreen canvas first to eliminate flickering
      this.clearOffscreenCanvas();
      this.drawGridOffscreen();
      
      // Render foods based on mode
      if (gameElements.useMultipleFood && gameElements.multipleFoods) {
        this.drawMultipleFoodsOffscreen(gameElements.multipleFoods);
      } else if (gameElements.food) {
        this.drawFoodOffscreen(gameElements.food);
      }
      
      this.drawSnakeOffscreen(gameElements.snake, interpolation);
      this.drawUIOffscreen(gameElements.score, gameElements.gameState);
      
      // Draw performance overlay if enabled (on offscreen canvas)
      if (this.performanceMonitor?.isEnabled()) {
        this.drawPerformanceOverlayOffscreen();
      }

      // Copy offscreen canvas to main canvas in one operation (eliminates flickering)
      this.renderContext.ctx.drawImage(this.offscreenCanvas, 0, 0);

      this.lastRenderTime = performance.now() - startTime;
    } catch (error) {
      console.error('Rendering error:', error);
      this.performanceMonitor?.recordError();
    }
  }

  /**
   * Clear offscreen canvas with background color
   */
  private clearOffscreenCanvas(): void {
    CanvasUtils.clearCanvas(this.offscreenCtx, this.renderContext.width, this.renderContext.height, this.backgroundColor);
  }

  /**
   * Draw game grid on offscreen canvas
   */
  private drawGridOffscreen(): void {
    const { width, height, cellSize } = this.renderContext;
    const ctx = this.offscreenCtx;

    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Vertical lines
    for (let x = cellSize; x < width; x += cellSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    // Horizontal lines
    for (let y = cellSize; y < height; y += cellSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }

    ctx.stroke();
  }

  /**
   * Draw snake with enhanced visuals on offscreen canvas
   */
  private drawSnakeOffscreen(snake: Snake, _interpolation: number): void {
    const { cellSize } = this.renderContext;
    const ctx = this.offscreenCtx;

    snake.segments.forEach((segment, index) => {
      // Snake segments are already in pixel coordinates, not grid coordinates
      const x = segment.x;
      const y = segment.y;

      if (index === 0) {
        // Snake head - bright green with eyes
        ctx.fillStyle = '#4ade80';
        CanvasUtils.drawRoundedRect(ctx, x + 1, y + 1, cellSize - 2, cellSize - 2, 3);
        ctx.fill();

        // Add eyes
        ctx.fillStyle = '#000000';
        const eyeSize = Math.max(2, cellSize / 8);
        const eyeOffset = cellSize * 0.25;
        
        ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(x + cellSize - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
      } else {
        // Snake body - gradient effect
        const alpha = Math.max(0.6, 1 - index * 0.05);
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        CanvasUtils.drawRoundedRect(ctx, x + 1, y + 1, cellSize - 2, cellSize - 2, 2);
        ctx.fill();
      }
    });
  }



  /**
   * Draw food with animated effects on offscreen canvas
   */
  private drawFoodOffscreen(food: EnhancedFood): void {
    const { cellSize } = this.renderContext;
    const ctx = this.offscreenCtx;
    // Food positions are already in pixel coordinates, not grid coordinates
    const x = food.x;
    const y = food.y;
    const centerX = x + cellSize / 2;
    const centerY = y + cellSize / 2;
    const baseRadius = (cellSize - 4) / 2;

    // Animated pulsing effect
    const time = Date.now() / 500;
    const pulseScale = 1 + Math.sin(time) * 0.15;
    const radius = baseRadius * pulseScale;

    // Create radial gradient for food
    const gradient = CanvasUtils.createRadialGradient(
      ctx,
      centerX,
      centerY,
      radius,
      [
        { offset: 0, color: '#ef4444' },
        { offset: 1, color: '#dc2626' }
      ]
    );

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      radius * 0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw food value if it has one
    if (food.value && food.value > 10) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(10, cellSize / 3)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(
        food.value.toString(),
        centerX,
        centerY - cellSize / 6
      );
      ctx.textAlign = 'left';
    }
  }



  /**
   * Draw multiple numbered food blocks on offscreen canvas
   */
  private drawMultipleFoodsOffscreen(foods: NumberedFood[]): void {
    if (!this.foodRenderer) {
      console.warn('FoodRenderer not initialized');
      return;
    }

    // Calculate delta time for animation (simplified)
    const deltaTime = 16; // Assume 60fps
    
    // The food renderer is already initialized with offscreen context
    // No need to switch contexts
    this.foodRenderer.renderMultipleFoods(foods, deltaTime);
  }



  /**
   * Draw UI elements (score, game state) on offscreen canvas
   */
  private drawUIOffscreen(score: number, gameState: string): void {
    const ctx = this.offscreenCtx;

    // Score display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Game state overlay
    if (gameState === 'paused') {
      this.drawOverlayOffscreen('PAUSED', 'Press SPACE to resume');
    } else if (gameState === 'game-over') {
      this.drawOverlayOffscreen('GAME OVER', `Final Score: ${score}`);
    }
  }



  /**
   * Draw text overlay for game states on offscreen canvas
   */
  private drawOverlayOffscreen(title: string, subtitle: string): void {
    const { width, height } = this.renderContext;
    const ctx = this.offscreenCtx;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    // Title text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, height / 2 - 30);

    // Subtitle text
    ctx.font = '18px monospace';
    ctx.fillText(subtitle, width / 2, height / 2 + 20);

    // Reset text alignment
    ctx.textAlign = 'left';
  }

  /**
   * Draw performance overlay on offscreen canvas
   */
  private drawPerformanceOverlayOffscreen(): void {
    if (!this.performanceMonitor) return;

    const { width } = this.renderContext;
    const ctx = this.offscreenCtx;
    const metrics = this.performanceMonitor.getMetrics();

    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    
    const lines = [
      `FPS: ${metrics.fps}`,
      `Frame: ${metrics.averageFrameTime.toFixed(1)}ms`,
      `Render: ${this.lastRenderTime.toFixed(1)}ms`
    ];

    lines.forEach((line, index) => {
      ctx.fillText(line, width - 120, 15 + index * 15);
    });
  }



  /**
   * Resize canvas and update render context
   */
  public resize(newConfig: GameConfig): void {
    this.renderContext = this.initializeRenderContext(
      this.renderContext.canvas,
      newConfig
    );
    
    // Resize offscreen canvas
    this.offscreenCanvas.width = this.renderContext.width * this.renderContext.pixelRatio;
    this.offscreenCanvas.height = this.renderContext.height * this.renderContext.pixelRatio;
    
    this.offscreenCtx.scale(this.renderContext.pixelRatio, this.renderContext.pixelRatio);
    this.setupCanvasOptimizations();
    
    // Update food renderer with new grid size and offscreen context
    if (this.foodRenderer) {
      this.foodRenderer.updateGridSize(this.renderContext.gridSize);
      this.foodRenderer.updateContext(this.offscreenCtx);
    }
  }

  /**
   * Calculate canvas dimensions based on container and config
   */
  private calculateCanvasDimensions(
    config: GameConfig,
    container?: Element | null
  ): CanvasDimensions {
    // If game config has explicit canvas dimensions, use those
    if ('canvasWidth' in config && 'canvasHeight' in config) {
      const gameConfig = config as GameConfig & { canvasWidth: number; canvasHeight: number };
      return {
        width: gameConfig.canvasWidth,
        height: gameConfig.canvasHeight,
        cellSize: config.gridSize,
      };
    }
    
    // Otherwise, calculate based on container
    const containerWidth = container?.clientWidth || window.innerWidth * 0.9;
    const containerHeight = container?.clientHeight || window.innerHeight * 0.8;
    
    return CanvasUtils.calculateOptimalCanvasSize(
      containerWidth,
      containerHeight,
      config.gridSize
    );
  }

  /**
   * Get current render context
   */
  public getRenderContext(): RenderContext {
    return this.renderContext;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): object | null {
    return this.performanceMonitor?.getMetrics() || null;
  }

  /**
   * Set theme colors
   */
  public setTheme(colors: {
    background?: string;
    grid?: string;
  }): void {
    if (colors.background) this.backgroundColor = colors.background;
    if (colors.grid) this.gridColor = colors.grid;
  }

  /**
   * Destroy renderer and clean up resources
   */
  public destroy(): void {
    this.performanceMonitor = null;
    
    // Clean up food renderer
    if (this.foodRenderer) {
      this.foodRenderer.destroy();
      this.foodRenderer = null;
    }
  }
}
