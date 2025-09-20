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
  
  // Layered rendering for performance
  private backgroundCanvas!: HTMLCanvasElement;
  private backgroundCtx!: CanvasRenderingContext2D;
  private dynamicCanvas!: HTMLCanvasElement;
  private dynamicCtx!: CanvasRenderingContext2D;
  
  // Track what needs to be redrawn
  private needsBackgroundRedraw: boolean = true;
  private lastGameElements: GameElements | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    gameConfig: GameConfig,
    performanceMonitor?: PerformanceMonitor
  ) {
    this.renderContext = this.initializeRenderContext(canvas, gameConfig);
    this.performanceMonitor = performanceMonitor || null;
    
    // Initialize layered rendering system
    this.initializeLayeredRendering();
    
    this.setupCanvasOptimizations();
    
    // Initialize food renderer with dynamic context
    this.foodRenderer = new FoodRenderer(
      this.dynamicCtx,
      this.renderContext.gridSize
    );
  }

  /**
   * Initialize layered rendering with background and dynamic canvases
   */
  private initializeLayeredRendering(): void {
    // Background canvas for static elements (grid, food, UI)
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCanvas.width = this.renderContext.width * this.renderContext.pixelRatio;
    this.backgroundCanvas.height = this.renderContext.height * this.renderContext.pixelRatio;
    const bgCtx = this.backgroundCanvas.getContext('2d');
    if (!bgCtx) {
      throw new Error('Failed to get background 2D context');
    }
    this.backgroundCtx = bgCtx;
    this.backgroundCtx.scale(this.renderContext.pixelRatio, this.renderContext.pixelRatio);
    
    // Dynamic canvas for moving elements (snake)
    this.dynamicCanvas = document.createElement('canvas');
    this.dynamicCanvas.width = this.renderContext.width * this.renderContext.pixelRatio;
    this.dynamicCanvas.height = this.renderContext.height * this.renderContext.pixelRatio;
    const dynCtx = this.dynamicCanvas.getContext('2d');
    if (!dynCtx) {
      throw new Error('Failed to get dynamic 2D context');
    }
    this.dynamicCtx = dynCtx;
    this.dynamicCtx.scale(this.renderContext.pixelRatio, this.renderContext.pixelRatio);
    
    CanvasUtils.applyCanvasOptimizations(this.backgroundCtx);
    CanvasUtils.applyCanvasOptimizations(this.dynamicCtx);
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
    CanvasUtils.applyCanvasOptimizations(this.backgroundCtx);
    CanvasUtils.applyCanvasOptimizations(this.dynamicCtx);
  }

  /**
   * Main render method - draws all game elements with layered optimization
   */
  public render(gameElements: GameElements, interpolation: number = 1.0): void {
    try {
      const startTime = performance.now();

      // Check if background needs to be redrawn
      const backgroundChanged = this.hasBackgroundChanged(gameElements);
      
      if (backgroundChanged || this.needsBackgroundRedraw) {
        this.renderBackground(gameElements);
        this.needsBackgroundRedraw = false;
      }

      // Always redraw dynamic elements (snake)
      this.renderDynamic(gameElements, interpolation);

      // Composite layers to main canvas
      this.compositeToMainCanvas();

      this.lastGameElements = { ...gameElements };
      this.lastRenderTime = performance.now() - startTime;
    } catch (error) {
      console.error('Rendering error:', error);
      this.performanceMonitor?.recordError();
    }
  }

  /**
   * Check if background elements have changed
   */
  private hasBackgroundChanged(gameElements: GameElements): boolean {
    if (!this.lastGameElements) return true;

    // Check if score or game state changed
    const uiChanged = 
      gameElements.score !== this.lastGameElements.score ||
      gameElements.gameState !== this.lastGameElements.gameState;

    return uiChanged;
  }

  /**
   * Render static background elements
   */
  private renderBackground(gameElements: GameElements): void {
    // Clear background canvas
    CanvasUtils.clearCanvas(this.backgroundCtx, this.renderContext.width, this.renderContext.height, this.backgroundColor);
    
    // Draw grid
    this.drawGrid(this.backgroundCtx);
    
    // Draw UI
    this.drawUI(this.backgroundCtx, gameElements.score, gameElements.gameState);
  }

  /**
   * Render dynamic elements (snake)
   */
  private renderDynamic(gameElements: GameElements, interpolation: number): void {
    // Clear dynamic canvas (transparent)
    this.dynamicCtx.clearRect(0, 0, this.renderContext.width, this.renderContext.height);
    
    // Draw food (animated)
    if (gameElements.useMultipleFood && gameElements.multipleFoods) {
      this.drawMultipleFoods(this.dynamicCtx, gameElements.multipleFoods);
    } else if (gameElements.food) {
      this.drawFood(this.dynamicCtx, gameElements.food);
    }
    
    // Draw snake
    this.drawSnake(this.dynamicCtx, gameElements.snake, interpolation);
    
    // Draw performance overlay if enabled (on dynamic layer since it changes frequently)
    if (this.performanceMonitor?.isEnabled()) {
      this.drawPerformanceOverlay(this.dynamicCtx);
    }
  }

  /**
   * Composite background and dynamic layers to main canvas
   */
  private compositeToMainCanvas(): void {
    // Always clear main canvas
    CanvasUtils.clearCanvas(this.renderContext.ctx, this.renderContext.width, this.renderContext.height, this.backgroundColor);
    
    // Always draw background layer
    this.renderContext.ctx.drawImage(this.backgroundCanvas, 0, 0);
    
    // Always draw dynamic layer on top
    this.renderContext.ctx.drawImage(this.dynamicCanvas, 0, 0);
  }

  /**
   * Draw game grid
   */
  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const { width, height, cellSize } = this.renderContext;
    
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
   * Draw snake with enhanced visuals
   */
  private drawSnake(ctx: CanvasRenderingContext2D, snake: Snake, _interpolation: number): void {
    const { cellSize } = this.renderContext;
    
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
   * Draw food with animated effects
   */
  private drawFood(ctx: CanvasRenderingContext2D, food: EnhancedFood): void {
    const { cellSize } = this.renderContext;
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
   * Draw multiple numbered food blocks
   */
  private drawMultipleFoods(ctx: CanvasRenderingContext2D, foods: NumberedFood[]): void {
    if (!this.foodRenderer) {
      console.warn('FoodRenderer not initialized');
      return;
    }

    // Calculate delta time for animation (simplified)
    const deltaTime = 16; // Assume 60fps
    
    // Temporarily switch context for background rendering
    this.foodRenderer.updateContext(ctx);
    this.foodRenderer.renderMultipleFoods(foods, deltaTime);
    this.foodRenderer.updateContext(this.dynamicCtx);
  }

  /**
   * Draw UI elements (score, game state)
   */
  private drawUI(ctx: CanvasRenderingContext2D, score: number, gameState: string): void {
    // Score display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Game state overlay
    if (gameState === 'paused') {
      this.drawOverlay(ctx, 'PAUSED', 'Press SPACE to resume');
    } else if (gameState === 'game-over') {
      this.drawOverlay(ctx, 'GAME OVER', `Final Score: ${score}`);
    }
  }

  /**
   * Draw text overlay for game states
   */
  private drawOverlay(ctx: CanvasRenderingContext2D, title: string, subtitle: string): void {
    const { width, height } = this.renderContext;

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
   * Draw performance overlay
   */
  private drawPerformanceOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.performanceMonitor) return;

    const { width } = this.renderContext;
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
    
    // Resize background canvas
    this.backgroundCanvas.width = this.renderContext.width * this.renderContext.pixelRatio;
    this.backgroundCanvas.height = this.renderContext.height * this.renderContext.pixelRatio;
    this.backgroundCtx.scale(this.renderContext.pixelRatio, this.renderContext.pixelRatio);
    
    // Resize dynamic canvas
    this.dynamicCanvas.width = this.renderContext.width * this.renderContext.pixelRatio;
    this.dynamicCanvas.height = this.renderContext.height * this.renderContext.pixelRatio;
    this.dynamicCtx.scale(this.renderContext.pixelRatio, this.renderContext.pixelRatio);
    
    CanvasUtils.applyCanvasOptimizations(this.backgroundCtx);
    CanvasUtils.applyCanvasOptimizations(this.dynamicCtx);
    
    // Update food renderer with new grid size and dynamic context
    if (this.foodRenderer) {
      this.foodRenderer.updateGridSize(this.renderContext.gridSize);
      this.foodRenderer.updateContext(this.dynamicCtx);
    }
    
    // Force background redraw on next render
    this.needsBackgroundRedraw = true;
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
