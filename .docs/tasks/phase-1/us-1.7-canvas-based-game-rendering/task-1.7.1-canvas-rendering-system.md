# Task: Canvas Rendering System

## Task Header
- **ID**: T-1.7.1
- **Title**: Implement HTML5 Canvas game rendering system
- **Story ID**: US-1.7
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 3-4 hours
- **Complexity**: high

## Task Content

### Objective
Create a high-performance HTML5 Canvas rendering system that displays the Snake game at 60 FPS with smooth animations, responsive design adaptation, and optimized drawing operations.

### Description
Build a comprehensive canvas-based rendering engine that handles game element drawing (snake, food, grid), manages the render loop, implements performance optimizations, and adapts to different screen sizes while maintaining visual quality and smooth gameplay.

### Acceptance Criteria Covered
- GIVEN game canvas WHEN rendering THEN maintains 60 FPS performance
- GIVEN canvas size WHEN screen resizes THEN adapts proportionally without distortion
- GIVEN mobile screen WHEN playing THEN game area remains fully visible and playable
- GIVEN game elements WHEN drawn THEN snake, food, and boundaries are clearly visible
- GIVEN performance monitoring WHEN enabled THEN tracks and displays FPS accurately
- GIVEN pixel density WHEN high DPI THEN renders crisp graphics without blur

### Implementation Notes
1. Create high-performance canvas rendering system with requestAnimationFrame
2. Implement responsive canvas sizing with device pixel ratio handling
3. Optimize drawing operations and minimize canvas state changes
4. Add performance monitoring and FPS tracking
5. Ensure crisp rendering on high-DPI displays

## Technical Specs

### File Targets
**New Files:**
- `src/components/game/GameCanvas.tsx` - Main canvas component
- `src/lib/rendering/CanvasRenderer.ts` - Core rendering engine
- `src/lib/rendering/RenderLoop.ts` - Game render loop management
- `src/lib/rendering/CanvasUtils.ts` - Canvas utility functions
- `src/lib/rendering/PerformanceMonitor.ts` - Performance tracking
- `src/lib/rendering/ResponsiveCanvas.ts` - Responsive canvas handling
- `src/hooks/useCanvas.ts` - Canvas React hook
- `src/hooks/usePerformanceMonitor.ts` - Performance monitoring hook
- `src/styles/canvas.css` - Canvas-specific styling

**Modified Files:**
- `src/app/game/page.tsx` - Integrate game canvas
- `src/components/game/GameBoard.tsx` - Canvas integration
- `src/lib/game/GameEngine.ts` - Connect with renderer

**Test Files:**
- `src/lib/rendering/__tests__/CanvasRenderer.test.ts` - Renderer tests
- `src/lib/rendering/__tests__/RenderLoop.test.ts` - Render loop tests
- `src/components/__tests__/GameCanvas.test.tsx` - Canvas component tests

### Canvas Renderer Core
```typescript
// Core canvas rendering engine
interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
  gridSize: number;
  cellSize: number;
}

interface GameElements {
  snake: Position[];
  food: Position | null;
  score: number;
  gameState: GameState;
}

export class CanvasRenderer {
  private renderContext: RenderContext;
  private performanceMonitor: PerformanceMonitor;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, gameConfig: GameConfig) {
    this.renderContext = this.initializeRenderContext(canvas, gameConfig);
    this.performanceMonitor = new PerformanceMonitor();
    this.setupCanvasOptimizations();
  }

  private initializeRenderContext(canvas: HTMLCanvasElement, config: GameConfig): RenderContext {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    const pixelRatio = window.devicePixelRatio || 1;
    const { width, height, cellSize } = this.calculateCanvasDimensions(config, pixelRatio);

    // Set actual canvas size for crisp rendering
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    
    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context for high-DPI displays
    ctx.scale(pixelRatio, pixelRatio);

    return {
      canvas,
      ctx,
      width,
      height,
      pixelRatio,
      gridSize: config.gridSize,
      cellSize
    };
  }

  private setupCanvasOptimizations(): void {
    const { ctx } = this.renderContext;
    
    // Enable optimizations
    ctx.imageSmoothingEnabled = false; // Crisp pixel art
    ctx.textBaseline = 'top';
    ctx.font = '16px monospace';
  }

  public render(gameElements: GameElements): void {
    this.performanceMonitor.startFrame();
    
    try {
      this.clearCanvas();
      this.drawGrid();
      this.drawFood(gameElements.food);
      this.drawSnake(gameElements.snake);
      this.drawUI(gameElements.score, gameElements.gameState);
      
      this.performanceMonitor.endFrame();
    } catch (error) {
      console.error('Rendering error:', error);
      this.performanceMonitor.recordError();
    }
  }

  private clearCanvas(): void {
    const { ctx, width, height } = this.renderContext;
    ctx.fillStyle = '#1a1a1a'; // Dark background
    ctx.fillRect(0, 0, width, height);
  }

  private drawGrid(): void {
    const { ctx, width, height, cellSize } = this.renderContext;
    
    ctx.strokeStyle = '#333333';
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

  private drawSnake(snake: Position[]): void {
    const { ctx, cellSize } = this.renderContext;
    
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      
      if (index === 0) {
        // Snake head - distinct styling
        ctx.fillStyle = '#4ade80'; // Bright green
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        
        // Add eyes
        ctx.fillStyle = '#000000';
        const eyeSize = Math.max(2, cellSize / 8);
        ctx.fillRect(x + cellSize * 0.25, y + cellSize * 0.25, eyeSize, eyeSize);
        ctx.fillRect(x + cellSize * 0.75 - eyeSize, y + cellSize * 0.25, eyeSize, eyeSize);
      } else {
        // Snake body - gradient effect
        const alpha = Math.max(0.6, 1 - (index * 0.05));
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`; // Fading green
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      }
    });
  }

  private drawFood(food: Position | null): void {
    if (!food) return;

    const { ctx, cellSize } = this.renderContext;
    const x = food.x * cellSize;
    const y = food.y * cellSize;
    const centerX = x + cellSize / 2;
    const centerY = y + cellSize / 2;
    const radius = (cellSize - 4) / 2;

    // Animated food with pulsing effect
    const time = Date.now() / 500;
    const pulseScale = 1 + Math.sin(time) * 0.1;
    const actualRadius = radius * pulseScale;

    // Create radial gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, actualRadius
    );
    gradient.addColorStop(0, '#ef4444'); // Bright red center
    gradient.addColorStop(1, '#dc2626'); // Darker red edge

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, actualRadius, 0, Math.PI * 2);
    ctx.fill();

    // Add highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX - actualRadius * 0.3, centerY - actualRadius * 0.3, actualRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawUI(score: number, gameState: GameState): void {
    const { ctx, width } = this.renderContext;
    
    // Score display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`Score: ${score}`, 10, 10);

    // Game state overlay
    if (gameState === GameState.PAUSED) {
      this.drawOverlay('PAUSED', 'Press SPACE to resume');
    } else if (gameState === GameState.GAME_OVER) {
      this.drawOverlay('GAME OVER', `Final Score: ${score}`);
    }

    // Performance display (if enabled)
    if (this.performanceMonitor.isEnabled()) {
      const fps = this.performanceMonitor.getCurrentFPS();
      ctx.fillStyle = '#888888';
      ctx.font = '12px monospace';
      ctx.fillText(`FPS: ${fps}`, width - 80, 10);
    }
  }

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

  public resize(newConfig: GameConfig): void {
    this.renderContext = this.initializeRenderContext(this.renderContext.canvas, newConfig);
    this.setupCanvasOptimizations();
  }

  private calculateCanvasDimensions(config: GameConfig, pixelRatio: number) {
    const baseSize = Math.min(
      window.innerWidth * 0.9,
      window.innerHeight * 0.8,
      600 // Maximum size
    );
    
    const cellSize = Math.floor(baseSize / config.gridSize);
    const width = cellSize * config.gridSize;
    const height = cellSize * config.gridSize;

    return { width, height, cellSize };
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.performanceMonitor.destroy();
  }

  public getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }
}
```

### Render Loop Management
```typescript
// Game render loop management
export class RenderLoop {
  private renderer: CanvasRenderer;
  private gameEngine: GameEngine;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private targetFPS: number = 60;
  private frameInterval: number;

  constructor(renderer: CanvasRenderer, gameEngine: GameEngine) {
    this.renderer = renderer;
    this.gameEngine = gameEngine;
    this.frameInterval = 1000 / this.targetFPS;
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number = performance.now()): void => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastFrameTime;

    // Target frame rate limiting
    if (deltaTime >= this.frameInterval) {
      // Update game state
      this.gameEngine.update(deltaTime);
      
      // Render frame
      const gameState = this.gameEngine.getGameState();
      this.renderer.render({
        snake: gameState.snake,
        food: gameState.food,
        score: gameState.score,
        gameState: gameState.state
      });

      this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(30, Math.min(120, fps)); // Clamp between 30-120
    this.frameInterval = 1000 / this.targetFPS;
  }

  public pause(): void {
    this.stop();
  }

  public resume(): void {
    this.start();
  }
}
```

### Performance Monitor
```typescript
// Performance monitoring system
export class PerformanceMonitor {
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFPS: number = 0;
  private frameTimes: number[] = [];
  private errorCount: number = 0;
  private enabled: boolean = false;

  constructor(enabled: boolean = process.env.NODE_ENV === 'development') {
    this.enabled = enabled;
    this.lastFpsUpdate = performance.now();
  }

  public startFrame(): void {
    if (!this.enabled) return;
    this.frameCount++;
  }

  public endFrame(): void {
    if (!this.enabled) return;
    
    const now = performance.now();
    this.frameTimes.push(now);

    // Calculate FPS every second
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFPS = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Keep only recent frame times (last 60 frames)
    if (this.frameTimes.length > 60) {
      this.frameTimes = this.frameTimes.slice(-60);
    }
  }

  public recordError(): void {
    this.errorCount++;
  }

  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  public getAverageFrameTime(): number {
    if (this.frameTimes.length < 2) return 0;
    
    const deltas = [];
    for (let i = 1; i < this.frameTimes.length; i++) {
      deltas.push(this.frameTimes[i] - this.frameTimes[i - 1]);
    }
    
    return deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  }

  public getMetrics() {
    return {
      fps: this.currentFPS,
      averageFrameTime: this.getAverageFrameTime(),
      errorCount: this.errorCount,
      enabled: this.enabled
    };
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public destroy(): void {
    this.frameTimes = [];
    this.frameCount = 0;
    this.errorCount = 0;
  }
}
```

### Responsive Canvas Component
```typescript
// Responsive canvas React component
interface GameCanvasProps {
  gameEngine: GameEngine;
  gameConfig: GameConfig;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  className?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameEngine,
  gameConfig,
  onPerformanceUpdate,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const renderLoopRef = useRef<RenderLoop | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize canvas and renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const renderer = new CanvasRenderer(canvasRef.current, gameConfig);
      const renderLoop = new RenderLoop(renderer, gameEngine);

      rendererRef.current = renderer;
      renderLoopRef.current = renderLoop;

      renderLoop.start();
      setIsInitialized(true);

      return () => {
        renderLoop.stop();
        renderer.destroy();
        rendererRef.current = null;
        renderLoopRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize canvas:', error);
    }
  }, [gameEngine, gameConfig]);

  // Handle window resize
  useEffect(() => {
    const handleResize = debounce(() => {
      if (rendererRef.current) {
        rendererRef.current.resize(gameConfig);
      }
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameConfig]);

  // Performance monitoring
  useEffect(() => {
    if (!onPerformanceUpdate || !rendererRef.current) return;

    const interval = setInterval(() => {
      if (rendererRef.current) {
        const metrics = rendererRef.current.getPerformanceMetrics();
        onPerformanceUpdate(metrics);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onPerformanceUpdate]);

  // Game state changes
  useEffect(() => {
    const unsubscribe = gameEngine.subscribe((gameState) => {
      if (gameState.state === GameState.PAUSED) {
        renderLoopRef.current?.pause();
      } else if (gameState.state === GameState.PLAYING) {
        renderLoopRef.current?.resume();
      }
    });

    return unsubscribe;
  }, [gameEngine]);

  return (
    <div className={`game-canvas-container ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        tabIndex={0}
        role="img"
        aria-label="Snake game canvas"
      />
      {!isInitialized && (
        <div className="canvas-loading">
          <span>Loading game...</span>
        </div>
      )}
    </div>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

### Canvas Utilities
```typescript
// Canvas utility functions
export class CanvasUtils {
  static getHighDPICanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(pixelRatio, pixelRatio);
    return ctx;
  }

  static clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);
  }

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

  static calculateOptimalCanvasSize(
    containerWidth: number,
    containerHeight: number,
    gridSize: number,
    maxSize: number = 600
  ): { width: number; height: number; cellSize: number } {
    const availableSize = Math.min(containerWidth, containerHeight, maxSize);
    const cellSize = Math.floor(availableSize / gridSize);
    const actualSize = cellSize * gridSize;

    return {
      width: actualSize,
      height: actualSize,
      cellSize
    };
  }

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
}
```

## Testing Requirements

### Unit Tests
- Canvas renderer initialization and drawing functions
- Render loop frame rate management and performance
- Performance monitor accuracy and metrics
- Responsive canvas sizing calculations

### Integration Tests
- Canvas integration with game engine
- Render loop coordination with game state
- Performance monitoring during gameplay

### Performance Tests
- 60 FPS maintenance under load
- Memory usage during extended gameplay
- Canvas resize performance

### E2E Scenarios
- Smooth gameplay across different devices
- Performance on various screen sizes
- High-DPI display rendering quality

## Dependencies

### Prerequisite Tasks
- T-1.1.1 (Project Setup)
- T-1.3.1 (Snake Movement Logic)
- T-1.4.1 (Food Generation System)

### Blocking Tasks
- None

### External Dependencies
- HTML5 Canvas API
- RequestAnimationFrame API
- DevicePixelRatio support

## Risks and Considerations

### Technical Risks
- Performance degradation on older devices
- Canvas rendering inconsistencies across browsers
- High-DPI display support complexity

### Implementation Challenges
- Maintaining 60 FPS on all target devices
- Responsive design without visual distortion
- Memory management for long gaming sessions

### Mitigation Strategies
- Implement performance monitoring and adaptive quality
- Test across multiple devices and browsers
- Add fallback options for low-performance scenarios
- Optimize drawing operations and minimize canvas state changes

---

**Estimated Duration**: 3-4 hours  
**Risk Level**: Medium-High  
**Dependencies**: T-1.1.1, T-1.3.1, T-1.4.1  
**Output**: High-performance canvas rendering system with 60 FPS performance and responsive design