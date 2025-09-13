# Task: Game Loop and Performance Optimization

## Task Header
- **ID**: T-1.3.3
- **Title**: Implement game loop with performance optimization for 60 FPS
- **Story ID**: US-1.3
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 2-3 hours
- **Complexity**: moderate

## Task Content

### Objective
Create a high-performance game loop using requestAnimationFrame that maintains smooth 60 FPS gameplay with proper timing control and performance monitoring.

### Description
Implement the core game loop that coordinates movement, rendering, and game state updates while maintaining consistent performance across different devices and ensuring optimal frame rates for smooth gameplay.

### Acceptance Criteria Covered
- GIVEN control input WHEN key is pressed THEN snake responds within 100ms
- GIVEN game running WHEN performance measured THEN maintains 60 FPS on desktop
- GIVEN game running WHEN performance measured THEN maintains 30 FPS minimum on mobile
- GIVEN continuous play WHEN game runs for 10+ minutes THEN performance remains consistent

### Implementation Notes
1. Implement game loop with requestAnimationFrame
2. Add frame rate limiting and timing control
3. Separate update logic from rendering logic
4. Implement performance monitoring and debugging
5. Optimize for consistent performance across devices

## Technical Specs

### File Targets
**New Files:**
- `src/lib/game/gameLoop.ts` - Core game loop implementation
- `src/lib/game/performance.ts` - Performance monitoring utilities
- `src/lib/game/timing.ts` - Frame timing and rate limiting
- `src/hooks/useGameLoop.ts` - Game loop management hook
- `src/hooks/usePerformanceMonitor.ts` - Performance monitoring hook

**Modified Files:**
- `src/components/game/GameCanvas.tsx` - Integrate game loop
- `src/lib/game/gameEngine.ts` - Main game engine coordination
- `src/lib/game/constants.ts` - Add performance-related constants

**Test Files:**
- `src/lib/game/__tests__/gameLoop.test.ts` - Game loop tests
- `src/lib/game/__tests__/performance.test.ts` - Performance tests

### Game Loop Implementation
```typescript
// Core game loop class
export class GameLoop {
  private isRunning = false;
  private lastFrameTime = 0;
  private targetFPS = 60;
  private targetFrameTime: number;
  private animationId: number | null = null;
  private performanceMonitor: PerformanceMonitor;

  // Callback functions
  private updateCallback: (deltaTime: number) => void;
  private renderCallback: (interpolation: number) => void;

  constructor(
    updateCallback: (deltaTime: number) => void,
    renderCallback: (interpolation: number) => void,
    targetFPS = 60
  ) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    this.targetFPS = targetFPS;
    this.targetFrameTime = 1000 / targetFPS;
    this.performanceMonitor = new PerformanceMonitor();
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastFrameTime;
    
    // Frame rate limiting
    if (deltaTime >= this.targetFrameTime) {
      this.performanceMonitor.startFrame();
      
      // Update game logic
      this.updateCallback(deltaTime);
      
      // Calculate interpolation for smooth rendering
      const interpolation = Math.min(deltaTime / this.targetFrameTime, 1);
      
      // Render frame
      this.renderCallback(interpolation);
      
      this.performanceMonitor.endFrame();
      this.lastFrameTime = currentTime;
    }

    this.animationId = requestAnimationFrame(this.loop);
  };
}
```

### Performance Monitoring
```typescript
// Performance monitoring system
export class PerformanceMonitor {
  private frameCount = 0;
  private lastFPSTime = 0;
  private currentFPS = 0;
  private frameStartTime = 0;
  private frameTimes: number[] = [];
  private readonly maxFrameTimeHistory = 60;

  public startFrame(): void {
    this.frameStartTime = performance.now();
  }

  public endFrame(): void {
    const frameEndTime = performance.now();
    const frameTime = frameEndTime - this.frameStartTime;
    
    // Track frame times for analysis
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }

    // Calculate FPS
    this.frameCount++;
    if (frameEndTime - this.lastFPSTime >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / (frameEndTime - this.lastFPSTime));
      this.frameCount = 0;
      this.lastFPSTime = frameEndTime;
    }
  }

  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  public getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
  }

  public getPerformanceStats() {
    return {
      fps: this.currentFPS,
      averageFrameTime: this.getAverageFrameTime(),
      maxFrameTime: Math.max(...this.frameTimes),
      minFrameTime: Math.min(...this.frameTimes)
    };
  }
}
```

### Game Loop Hook
```typescript
// React hook for game loop management
interface GameLoopOptions {
  targetFPS?: number;
  enabled: boolean;
  onUpdate: (deltaTime: number) => void;
  onRender: (interpolation: number) => void;
}

export const useGameLoop = ({ targetFPS = 60, enabled, onUpdate, onRender }: GameLoopOptions) => {
  const gameLoopRef = useRef<GameLoop | null>(null);
  const performanceRef = useRef<PerformanceMonitor>(new PerformanceMonitor());

  useEffect(() => {
    if (!enabled) {
      gameLoopRef.current?.stop();
      return;
    }

    gameLoopRef.current = new GameLoop(onUpdate, onRender, targetFPS);
    gameLoopRef.current.start();

    return () => {
      gameLoopRef.current?.stop();
    };
  }, [enabled, onUpdate, onRender, targetFPS]);

  const getPerformanceStats = useCallback(() => {
    return performanceRef.current.getPerformanceStats();
  }, []);

  return { getPerformanceStats };
};
```

### Performance Constants
```typescript
// Performance-related configuration
export const PERFORMANCE_CONFIG = {
  TARGET_FPS: 60,
  MIN_FPS_MOBILE: 30,
  MAX_DELTA_TIME: 100, // Cap delta time to prevent spiral of death
  PERFORMANCE_SAMPLE_SIZE: 60,
  FPS_UPDATE_INTERVAL: 1000,
  FRAME_TIME_WARNING_THRESHOLD: 16.67, // 60 FPS = 16.67ms per frame
} as const;

// Device performance detection
export const detectDevicePerformance = (): 'high' | 'medium' | 'low' => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return 'low';
  
  const renderer = gl.getParameter(gl.RENDERER);
  const vendor = gl.getParameter(gl.VENDOR);
  
  // Basic heuristics for device performance
  if (navigator.hardwareConcurrency >= 8) return 'high';
  if (navigator.hardwareConcurrency >= 4) return 'medium';
  return 'low';
};
```

## Testing Requirements

### Unit Tests
- Game loop starts and stops correctly
- Frame rate limiting works as expected
- Performance monitoring tracks metrics accurately
- Delta time calculations are correct

### Integration Tests
- Game loop integrates with React component lifecycle
- Performance monitoring works during gameplay
- Frame rate adaptation based on device capabilities

### E2E Scenarios
- Extended gameplay sessions maintain consistent performance
- Performance degradation detection and response
- Game loop behavior during browser tab switching

## Dependencies

### Prerequisite Tasks
- T-1.3.1 (Game Canvas and Snake Structure)
- T-1.3.2 (Keyboard Input and Movement Logic)

### Blocking Tasks
- None

### External Dependencies
- requestAnimationFrame browser API
- performance.now() for high-precision timing

## Risks and Considerations

### Technical Risks
- Performance degradation on low-end devices
- Browser tab throttling affecting game loop
- Memory leaks from animation frame management

### Implementation Challenges
- Balancing smooth gameplay with performance
- Handling variable frame rates gracefully
- Device capability detection accuracy

### Mitigation Strategies
- Implement adaptive frame rate based on device performance
- Add performance monitoring with automatic quality adjustment
- Test on various devices including low-end mobile
- Implement proper cleanup for animation frames

---

**Estimated Duration**: 2-3 hours  
**Risk Level**: Medium  
**Dependencies**: T-1.3.1, T-1.3.2  
**Output**: High-performance game loop with monitoring and optimization features for consistent 60 FPS gameplay