# Task: Touch Event System and Gesture Detection

## Task Header
- **ID**: 5.1.1
- **Title**: Touch Event System and Gesture Detection
- **Story ID**: US-5.1
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 4-5 hours
- **Complexity**: moderate

## Objective
Implement a robust touch event system that accurately detects swipe gestures on mobile devices and translates them into game control inputs for snake movement.

## Description
Create a comprehensive touch gesture detection system that captures touch events, analyzes swipe patterns, and provides reliable directional input for mobile gameplay. This system must work consistently across different mobile devices and browsers while preventing conflicts with default browser behaviors.

## Acceptance Criteria Covered
- GIVEN mobile device WHEN user swipes up THEN snake moves upward
- GIVEN mobile device WHEN user swipes down THEN snake moves downward
- GIVEN mobile device WHEN user swipes left THEN snake moves leftward
- GIVEN mobile device WHEN user swipes right THEN snake moves rightward
- GIVEN touch input WHEN gesture made THEN snake responds within 100ms

## Implementation Notes

### Touch Gesture Detection Architecture
```typescript
class TouchGestureDetector {
  private startTouch: TouchPoint | null = null;
  private isTracking: boolean = false;
  private readonly minSwipeDistance: number = 50; // pixels
  private readonly maxSwipeTime: number = 300; // milliseconds
  private readonly gestureCallbacks: Map<SwipeDirection, () => void> = new Map();

  constructor(private element: HTMLElement) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleTouchStart(event: TouchEvent): void {
    // Prevent default browser behaviors
    event.preventDefault();
    
    const touch = event.touches[0];
    this.startTouch = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    this.isTracking = true;
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isTracking || !this.startTouch) return;
    
    const touch = event.changedTouches[0];
    const endTouch: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    const direction = this.calculateSwipeDirection(this.startTouch, endTouch);
    if (direction) {
      this.triggerGestureCallback(direction);
    }

    this.resetTracking();
  }

  private calculateSwipeDirection(start: TouchPoint, end: TouchPoint): SwipeDirection | null {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const deltaTime = end.timestamp - start.timestamp;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Validate gesture constraints
    if (distance < this.minSwipeDistance) return null;
    if (deltaTime > this.maxSwipeTime) return null;

    // Determine dominant direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
    } else {
      return deltaY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
    }
  }
}
```

### Touch Control Manager Integration
```typescript
class TouchControlManager {
  private gestureDetector: TouchGestureDetector;
  private gameControlHandler: GameControlHandler;
  private isEnabled: boolean = false;

  constructor(
    private canvas: HTMLCanvasElement,
    gameControls: GameControlHandler
  ) {
    this.gameControlHandler = gameControls;
    this.gestureDetector = new TouchGestureDetector(canvas);
    this.setupGestureHandlers();
  }

  private setupGestureHandlers(): void {
    this.gestureDetector.onSwipe(SwipeDirection.UP, () => {
      if (this.isEnabled) {
        this.gameControlHandler.handleDirectionChange('up');
      }
    });

    this.gestureDetector.onSwipe(SwipeDirection.DOWN, () => {
      if (this.isEnabled) {
        this.gameControlHandler.handleDirectionChange('down');
      }
    });

    this.gestureDetector.onSwipe(SwipeDirection.LEFT, () => {
      if (this.isEnabled) {
        this.gameControlHandler.handleDirectionChange('left');
      }
    });

    this.gestureDetector.onSwipe(SwipeDirection.RIGHT, () => {
      if (this.isEnabled) {
        this.gameControlHandler.handleDirectionChange('right');
      }
    });
  }

  enableTouchControls(): void {
    this.isEnabled = true;
    this.optimizeForTouch();
  }

  private optimizeForTouch(): void {
    // Prevent default touch behaviors that interfere with gameplay
    this.canvas.style.touchAction = 'none';
    this.canvas.style.userSelect = 'none';
    this.canvas.style.webkitUserSelect = 'none';
    this.canvas.style.webkitTouchCallout = 'none';
    
    // Prevent context menu on long press
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
```

### Performance Optimization
```typescript
class TouchEventOptimizer {
  private lastProcessedTime: number = 0;
  private readonly THROTTLE_INTERVAL: number = 16; // ~60fps

  throttleTouch(callback: () => void): void {
    const now = performance.now();
    if (now - this.lastProcessedTime >= this.THROTTLE_INTERVAL) {
      callback();
      this.lastProcessedTime = now;
    }
  }

  setupOptimalEventListeners(element: HTMLElement): void {
    // Use passive listeners where possible for performance
    const passiveOptions = { passive: true };
    const activeOptions = { passive: false };

    // Touch start needs to be active to prevent default
    element.addEventListener('touchstart', this.handleTouchStart, activeOptions);
    
    // Touch move can be passive if not preventing default
    element.addEventListener('touchmove', this.handleTouchMove, passiveOptions);
    
    // Touch end needs to be active for gesture detection
    element.addEventListener('touchend', this.handleTouchEnd, activeOptions);
  }
}
```

## Technical Specifications

### File Targets

#### New Files
- `src/lib/touch/TouchGestureDetector.ts` - Core gesture detection logic
- `src/lib/touch/TouchControlManager.ts` - Touch control integration with game
- `src/lib/touch/types.ts` - TypeScript interfaces for touch system
- `src/lib/touch/TouchEventOptimizer.ts` - Performance optimization utilities
- `src/lib/utils/deviceDetection.ts` - Mobile device detection utilities

#### Modified Files
- `src/components/Game/GameCanvas.tsx` - Integrate touch controls with canvas
- `src/lib/game/GameControlHandler.ts` - Add touch input support
- `src/hooks/useGameControls.ts` - Include touch controls in game control hook

### API Endpoints
N/A - Frontend-only implementation

### Database Changes
N/A - No persistence required for touch events

### Component Specs
```typescript
// Touch gesture interfaces
interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

enum SwipeDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

interface TouchGestureConfig {
  minSwipeDistance: number;    // Minimum pixels for valid swipe
  maxSwipeTime: number;        // Maximum time for valid swipe (ms)
  touchSensitivity: number;    // Sensitivity multiplier (0.1-2.0)
  preventScrolling: boolean;   // Prevent page scroll during touch
  enableHapticFeedback: boolean; // Enable haptic feedback if available
}

interface GestureCallback {
  (direction: SwipeDirection): void;
}

// Device detection interface
interface MobileDevice {
  isTouch: boolean;
  isMobile: boolean;
  platform: 'iOS' | 'Android' | 'Windows' | 'Unknown';
  browser: 'Safari' | 'Chrome' | 'Firefox' | 'Samsung' | 'Unknown';
  screenSize: 'small' | 'medium' | 'large';
  hasHapticFeedback: boolean;
}
```

### DTO Definitions
```typescript
// Touch event data transfer objects
interface TouchEventDTO {
  type: 'start' | 'move' | 'end';
  x: number;
  y: number;
  timestamp: number;
  identifier: number;
}

interface SwipeGestureDTO {
  direction: SwipeDirection;
  distance: number;
  duration: number;
  velocity: number;
  startPoint: TouchPoint;
  endPoint: TouchPoint;
}
```

### Configuration Changes
```javascript
// next.config.js - No changes needed for touch events

// TypeScript configuration for touch event types
// tsconfig.json - Add DOM.Iterable for touch event types
{
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2020"]
  }
}
```

## Testing Requirements

### Unit Tests
- Touch gesture detection with various swipe patterns
- Direction calculation accuracy for different angles
- Swipe distance and time validation
- Event handler registration and cleanup
- Performance throttling functionality

### Integration Tests
- Integration with existing GameControlHandler
- Canvas element touch event binding
- Mobile device detection accuracy
- Touch optimization effects on performance

### E2E Scenarios
- Complete swipe gesture recognition in mobile browser
- Touch controls work across different mobile devices
- No interference with browser default behaviors
- Smooth gameplay with touch input

## Dependencies

### Prerequisite Tasks
- US-1.6 (Game Controls and State Management) - For control handler integration
- US-1.7 (Canvas-Based Game Rendering) - For canvas element touch binding

### Blocking Tasks
- None - This is a foundational mobile input task

### External Dependencies
- Touch Events API (browser support)
- Canvas element DOM API
- Performance API for timing

## Risks and Considerations

### Technical Risks
- **Browser Touch Event Differences**: iOS Safari vs Android Chrome handle touch events differently
  - *Mitigation*: Comprehensive cross-browser testing and polyfills where needed
  
- **Touch Event Performance**: High-frequency touch events can impact game performance
  - *Mitigation*: Event throttling and passive listeners where possible
  
- **Gesture Recognition Accuracy**: False positives/negatives for gesture detection
  - *Mitigation*: Configurable thresholds and extensive testing with real users

### Implementation Challenges
- **Preventing Default Behaviors**: Stopping zoom, scroll, and context menus without breaking accessibility
  - *Mitigation*: Selective preventDefault usage and proper CSS touch-action properties
  
- **Touch Sensitivity**: Different devices have varying touch sensitivity requirements
  - *Mitigation*: Configurable sensitivity settings and device-specific optimizations
  
- **Orientation Changes**: Handling coordinate system changes during device rotation
  - *Mitigation*: Event handlers for orientation change and coordinate recalculation

### Mitigation Strategies
- Use feature detection for touch capabilities
- Implement graceful fallbacks for non-touch devices
- Provide configurable gesture thresholds
- Test extensively on real mobile devices
- Monitor performance impact of touch event handling

## Definition of Done
- [ ] Touch gesture detection accurately recognizes swipe directions
- [ ] Touch events integrate properly with existing game controls
- [ ] Performance optimizations prevent impact on game framerate
- [ ] Cross-browser compatibility across major mobile browsers
- [ ] Touch controls work in both portrait and landscape orientations
- [ ] Default browser behaviors (zoom, scroll) are prevented during gameplay
- [ ] Touch sensitivity is configurable and responsive
- [ ] Memory management prevents touch event listener leaks
- [ ] Unit tests cover gesture detection edge cases
- [ ] Integration testing validates game control integration

## Implementation Strategy
1. **Phase 1**: Core TouchGestureDetector with basic swipe detection
2. **Phase 2**: TouchControlManager integration with game controls
3. **Phase 3**: Performance optimization and event throttling
4. **Phase 4**: Cross-browser compatibility and device detection
5. **Phase 5**: Testing, validation, and mobile device optimization

This foundational touch system enables natural mobile gameplay while maintaining performance and compatibility across mobile browsers and devices.