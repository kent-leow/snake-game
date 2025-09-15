/**
 * Core canvas rendering engine for the Snake game
 * Handles all drawing operations with high performance and visual quality
 */

import type { Snake, EnhancedFood } from '@/lib/game/types';
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
  score: number;
  gameState: 'playing' | 'paused' | 'game-over' | 'menu';
}

export interface GameConfig {
  gridSize: number;
  gameSpeed: number;
  enableSound: boolean;
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

  constructor(
    canvas: HTMLCanvasElement,
    gameConfig: GameConfig,
    performanceMonitor?: PerformanceMonitor
  ) {
    this.renderContext = this.initializeRenderContext(canvas, gameConfig);
    this.performanceMonitor = performanceMonitor || null;
    this.setupCanvasOptimizations();
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
  }

  /**
   * Main render method - draws all game elements
   */
  public render(gameElements: GameElements, interpolation: number = 1.0): void {
    try {
      const startTime = performance.now();

      this.clearCanvas();
      this.drawGrid();
      
      if (gameElements.food) {
        this.drawFood(gameElements.food);
      }
      
      this.drawSnake(gameElements.snake, interpolation);
      this.drawUI(gameElements.score, gameElements.gameState);
      
      // Draw performance overlay if enabled
      if (this.performanceMonitor?.isEnabled()) {
        this.drawPerformanceOverlay();
      }

      this.lastRenderTime = performance.now() - startTime;
    } catch (error) {
      console.error('Rendering error:', error);
      this.performanceMonitor?.recordError();
    }
  }

  /**
   * Clear canvas with background color
   */
  private clearCanvas(): void {
    const { ctx, width, height } = this.renderContext;
    CanvasUtils.clearCanvas(ctx, width, height, this.backgroundColor);
  }

  /**
   * Draw game grid
   */
  private drawGrid(): void {
    const { ctx, width, height, cellSize } = this.renderContext;

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
  private drawSnake(snake: Snake, _interpolation: number): void {
    const { ctx, cellSize } = this.renderContext;

    snake.segments.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;

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
  private drawFood(food: EnhancedFood): void {
    const { ctx, cellSize } = this.renderContext;
    const x = food.x * cellSize;
    const y = food.y * cellSize;
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
   * Draw UI elements (score, game state)
   */
  private drawUI(score: number, gameState: string): void {
    const { ctx } = this.renderContext;

    // Score display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`Score: ${score}`, 10, 10);

    // Game state overlay
    if (gameState === 'paused') {
      this.drawOverlay('PAUSED', 'Press SPACE to resume');
    } else if (gameState === 'game-over') {
      this.drawOverlay('GAME OVER', `Final Score: ${score}`);
    }
  }

  /**
   * Draw text overlay for game states
   */
  private drawOverlay(title: string, subtitle: string): void {
    const { ctx, width, height } = this.renderContext;

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
  private drawPerformanceOverlay(): void {
    if (!this.performanceMonitor) return;

    const { ctx, width } = this.renderContext;
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
    this.setupCanvasOptimizations();
  }

  /**
   * Calculate canvas dimensions based on container and config
   */
  private calculateCanvasDimensions(
    config: GameConfig,
    container?: Element | null
  ): CanvasDimensions {
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
  public getPerformanceMetrics() {
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
  }
}
