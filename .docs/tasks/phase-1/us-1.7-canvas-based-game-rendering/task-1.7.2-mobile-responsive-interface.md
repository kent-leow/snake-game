# Task: Mobile-Responsive Game Interface

## Task Header

- **ID**: T-1.7.2
- **Title**: Implement mobile-responsive game interface with touch controls
- **Story ID**: US-1.7
- **Type**: frontend
- **Priority**: high
- **Effort Estimate**: 2-3 hours
- **Complexity**: medium

## Task Content

### Objective

Create a fully responsive game interface that adapts seamlessly to mobile devices with intuitive touch controls, optimal layout scaling, and enhanced user experience for smartphone and tablet gameplay.

### Description

Develop mobile-optimized interface components that provide smooth touch interactions, responsive canvas scaling, adaptive UI layouts, and accessibility features while maintaining the visual quality and performance of the desktop experience.

### Acceptance Criteria Covered

- GIVEN mobile device WHEN playing THEN touch controls work smoothly for snake direction
- GIVEN different screen sizes WHEN resizing THEN game adapts layout appropriately
- GIVEN portrait/landscape WHEN rotating THEN interface adjusts without functionality loss
- GIVEN touch gestures WHEN used THEN provide same functionality as keyboard controls
- GIVEN small screens WHEN playing THEN game remains fully playable and visible

### Implementation Notes

1. Implement touch gesture recognition for snake direction control
2. Create responsive layout system that adapts to various screen sizes
3. Add mobile-optimized UI components with larger touch targets
4. Implement orientation change handling
5. Ensure accessibility and smooth touch interactions

## Technical Specs

### File Targets

**New Files:**

- `src/components/mobile/TouchControls.tsx` - Touch control interface
- `src/components/mobile/MobileGameLayout.tsx` - Mobile game layout wrapper
- `src/components/mobile/SwipeGestureHandler.tsx` - Gesture recognition component
- `src/hooks/useTouchControls.ts` - Touch control logic hook
- `src/hooks/useResponsiveLayout.ts` - Responsive layout hook
- `src/hooks/useDeviceOrientation.ts` - Orientation detection hook
- `src/lib/mobile/GestureDetector.ts` - Touch gesture detection
- `src/lib/mobile/MobileUtils.ts` - Mobile utility functions
- `src/styles/mobile.css` - Mobile-specific styling

**Modified Files:**

- `src/components/game/GameCanvas.tsx` - Add touch event handling
- `src/components/game/GameBoard.tsx` - Mobile layout integration
- `src/app/game/page.tsx` - Mobile layout conditional rendering
- `src/styles/game.css` - Responsive styling updates

**Test Files:**

- `src/components/mobile/__tests__/TouchControls.test.tsx` - Touch controls tests
- `src/hooks/__tests__/useTouchControls.test.ts` - Touch logic tests
- `src/lib/mobile/__tests__/GestureDetector.test.ts` - Gesture detection tests

### Touch Controls Component

```typescript
// Mobile touch controls interface
interface TouchControlsProps {
  onDirectionChange: (direction: Direction) => void;
  disabled?: boolean;
  showDirectional?: boolean;
  className?: string;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirectionChange,
  disabled = false,
  showDirectional = true,
  className
}) => {
  const [activeDirection, setActiveDirection] = useState<Direction | null>(null);

  const handleDirectionPress = (direction: Direction) => {
    if (disabled) return;

    setActiveDirection(direction);
    onDirectionChange(direction);

    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDirectionRelease = () => {
    setActiveDirection(null);
  };

  const getDirectionIcon = (direction: Direction) => {
    switch (direction) {
      case Direction.UP:
        return '⬆️';
      case Direction.DOWN:
        return '⬇️';
      case Direction.LEFT:
        return '⬅️';
      case Direction.RIGHT:
        return '➡️';
    }
  };

  if (!showDirectional) {
    return null;
  }

  return (
    <div className={`touch-controls ${className || ''}`}>
      <div className="touch-controls__grid">
        {/* Top row */}
        <div className="touch-controls__spacer"></div>
        <button
          className={`touch-control touch-control--up ${
            activeDirection === Direction.UP ? 'touch-control--active' : ''
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress(Direction.UP);
          }}
          onTouchEnd={handleDirectionRelease}
          onMouseDown={() => handleDirectionPress(Direction.UP)}
          onMouseUp={handleDirectionRelease}
          disabled={disabled}
          aria-label="Move up"
        >
          {getDirectionIcon(Direction.UP)}
        </button>
        <div className="touch-controls__spacer"></div>

        {/* Middle row */}
        <button
          className={`touch-control touch-control--left ${
            activeDirection === Direction.LEFT ? 'touch-control--active' : ''
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress(Direction.LEFT);
          }}
          onTouchEnd={handleDirectionRelease}
          onMouseDown={() => handleDirectionPress(Direction.LEFT)}
          onMouseUp={handleDirectionRelease}
          disabled={disabled}
          aria-label="Move left"
        >
          {getDirectionIcon(Direction.LEFT)}
        </button>
        <div className="touch-controls__center"></div>
        <button
          className={`touch-control touch-control--right ${
            activeDirection === Direction.RIGHT ? 'touch-control--active' : ''
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress(Direction.RIGHT);
          }}
          onTouchEnd={handleDirectionRelease}
          onMouseDown={() => handleDirectionPress(Direction.RIGHT)}
          onMouseUp={handleDirectionRelease}
          disabled={disabled}
          aria-label="Move right"
        >
          {getDirectionIcon(Direction.RIGHT)}
        </button>

        {/* Bottom row */}
        <div className="touch-controls__spacer"></div>
        <button
          className={`touch-control touch-control--down ${
            activeDirection === Direction.DOWN ? 'touch-control--active' : ''
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress(Direction.DOWN);
          }}
          onTouchEnd={handleDirectionRelease}
          onMouseDown={() => handleDirectionPress(Direction.DOWN)}
          onMouseUp={handleDirectionRelease}
          disabled={disabled}
          aria-label="Move down"
        >
          {getDirectionIcon(Direction.DOWN)}
        </button>
        <div className="touch-controls__spacer"></div>
      </div>
    </div>
  );
};
```

### Swipe Gesture Handler

```typescript
// Swipe gesture recognition component
interface SwipeGestureHandlerProps {
  onSwipe: (direction: Direction) => void;
  children: React.ReactNode;
  sensitivity?: number;
  disabled?: boolean;
  className?: string;
}

export const SwipeGestureHandler: React.FC<SwipeGestureHandlerProps> = ({
  onSwipe,
  children,
  sensitivity = 50,
  disabled = false,
  className
}) => {
  const [startTouch, setStartTouch] = useState<{ x: number; y: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || e.touches.length !== 1) return;

    const touch = e.touches[0];
    setStartTouch({ x: touch.clientX, y: touch.clientY });
    setIsTracking(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTracking || !startTouch || e.touches.length !== 1) return;

    // Prevent scrolling during swipe
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isTracking || !startTouch || e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouch.x;
    const deltaY = touch.clientY - startTouch.y;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance >= sensitivity) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        onSwipe(deltaX > 0 ? Direction.RIGHT : Direction.LEFT);
      } else {
        // Vertical swipe
        onSwipe(deltaY > 0 ? Direction.DOWN : Direction.UP);
      }
    }

    setStartTouch(null);
    setIsTracking(false);
  };

  const handleTouchCancel = () => {
    setStartTouch(null);
    setIsTracking(false);
  };

  return (
    <div
      className={`swipe-gesture-handler ${className || ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  );
};
```

### Mobile Game Layout

```typescript
// Mobile-optimized game layout wrapper
interface MobileGameLayoutProps {
  children: React.ReactNode;
  gameState: GameState;
  showTouchControls?: boolean;
  controlsPosition?: 'bottom' | 'side';
}

export const MobileGameLayout: React.FC<MobileGameLayoutProps> = ({
  children,
  gameState,
  showTouchControls = true,
  controlsPosition = 'bottom'
}) => {
  const { isMobile, isTablet, orientation, screenSize } = useResponsiveLayout();
  const [layoutMode, setLayoutMode] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    setLayoutMode(orientation === 'landscape' ? 'landscape' : 'portrait');
  }, [orientation]);

  const shouldShowTouchControls = () => {
    return isMobile && showTouchControls && gameState === GameState.PLAYING;
  };

  const getLayoutClasses = () => {
    const classes = ['mobile-game-layout'];

    classes.push(`mobile-game-layout--${layoutMode}`);
    classes.push(`mobile-game-layout--${screenSize}`);

    if (shouldShowTouchControls()) {
      classes.push(`mobile-game-layout--with-controls`);
      classes.push(`mobile-game-layout--controls-${controlsPosition}`);
    }

    return classes.join(' ');
  };

  return (
    <div className={getLayoutClasses()}>
      <div className="mobile-game-layout__content">
        {children}
      </div>

      {shouldShowTouchControls() && (
        <div className="mobile-game-layout__controls">
          <TouchControls
            onDirectionChange={(direction) => {
              // Pass direction to game engine
              window.dispatchEvent(new CustomEvent('gameDirectionChange', {
                detail: { direction }
              }));
            }}
            showDirectional={true}
          />
        </div>
      )}

      {/* Safe area padding for notched devices */}
      <style jsx>{`
        .mobile-game-layout {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
      `}</style>
    </div>
  );
};
```

### Touch Controls Hook

```typescript
// Touch control logic hook
interface TouchControlsOptions {
  onDirectionChange: (direction: Direction) => void;
  swipeSensitivity?: number;
  enableHapticFeedback?: boolean;
  preventScrolling?: boolean;
}

export const useTouchControls = ({
  onDirectionChange,
  swipeSensitivity = 50,
  enableHapticFeedback = true,
  preventScrolling = true,
}: TouchControlsOptions) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastDirection, setLastDirection] = useState<Direction | null>(null);

  const { isMobile } = useResponsiveLayout();

  useEffect(() => {
    setIsEnabled(isMobile);
  }, [isMobile]);

  const handleDirectionChange = useCallback(
    (direction: Direction) => {
      // Prevent rapid direction changes
      if (lastDirection === direction) return;

      setLastDirection(direction);
      onDirectionChange(direction);

      // Haptic feedback
      if (enableHapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Reset direction tracking after a delay
      setTimeout(() => setLastDirection(null), 200);
    },
    [lastDirection, onDirectionChange, enableHapticFeedback]
  );

  useEffect(() => {
    if (!preventScrolling || !isEnabled) return;

    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, [preventScrolling, isEnabled]);

  return {
    isEnabled,
    handleDirectionChange,
    swipeSensitivity,
  };
};
```

### Responsive Layout Hook

```typescript
// Responsive layout detection hook
interface ResponsiveLayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  viewportSize: { width: number; height: number };
}

export const useResponsiveLayout = (): ResponsiveLayoutState => {
  const [layoutState, setLayoutState] = useState<ResponsiveLayoutState>(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'large',
    orientation: 'landscape',
    viewportSize: { width: 0, height: 0 },
  }));

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      const isDesktop = width > 1024;

      setLayoutState({
        isMobile,
        isTablet,
        isDesktop,
        screenSize: isMobile ? 'small' : isTablet ? 'medium' : 'large',
        orientation: width > height ? 'landscape' : 'portrait',
        viewportSize: { width, height },
      });
    };

    updateLayout();

    const debouncedUpdate = debounce(updateLayout, 100);
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
    };
  }, []);

  return layoutState;
};

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

### Mobile Utilities

```typescript
// Mobile-specific utility functions
export class MobileUtils {
  static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  static getViewportSize(): { width: number; height: number } {
    return {
      width: Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      ),
      height: Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
      ),
    };
  }

  static preventZoom(): void {
    document.addEventListener(
      'touchmove',
      e => {
        if (e.scale !== 1) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    document.addEventListener('gesturestart', e => {
      e.preventDefault();
    });
  }

  static enableSafeArea(): void {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
    document.head.appendChild(meta);
  }

  static calculateOptimalCanvasSize(
    viewportWidth: number,
    viewportHeight: number,
    hasControls: boolean = true
  ): { width: number; height: number } {
    const margin = 20;
    const controlsHeight = hasControls ? 120 : 0;

    const availableWidth = viewportWidth - margin * 2;
    const availableHeight = viewportHeight - controlsHeight - margin * 2;

    const size = Math.min(availableWidth, availableHeight);

    return {
      width: size,
      height: size,
    };
  }

  static optimizeCanvasForMobile(canvas: HTMLCanvasElement): void {
    // Disable context menu on long press
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Prevent text selection
    canvas.style.webkitUserSelect = 'none';
    canvas.style.userSelect = 'none';

    // Improve touch responsiveness
    canvas.style.touchAction = 'none';
  }

  static vibrate(pattern: number | number[] = 50): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}
```

### Mobile CSS Styling

```css
/* Mobile-specific styling */
.mobile-game-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

.mobile-game-layout--portrait {
  flex-direction: column;
}

.mobile-game-layout--landscape {
  flex-direction: row;
}

.mobile-game-layout__content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.mobile-game-layout__controls {
  flex-shrink: 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.8);
}

/* Touch Controls */
.touch-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 0.5rem;
  max-width: 200px;
  margin: 0 auto;
}

.touch-control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border: 2px solid #374151;
  border-radius: 50%;
  background: #1f2937;
  color: #ffffff;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.touch-control:active,
.touch-control--active {
  background: #3b82f6;
  border-color: #2563eb;
  transform: scale(0.95);
}

.touch-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Swipe Gesture Handler */
.swipe-gesture-handler {
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .mobile-game-layout__content {
    padding: 0.5rem;
  }

  .touch-control {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .touch-controls {
    max-width: 150px;
  }

  .touch-control {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}

/* Landscape orientation */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-game-layout--with-controls {
    flex-direction: row;
  }

  .mobile-game-layout__controls {
    width: 200px;
    padding: 0.5rem;
  }
}

/* Safe area support */
@supports (padding: env(safe-area-inset-top)) {
  .mobile-game-layout {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .touch-control {
    border-width: 1px;
  }
}
```

## Testing Requirements

### Unit Tests

- Touch control component interaction
- Swipe gesture detection accuracy
- Responsive layout calculations
- Mobile utility functions

### Integration Tests

- Touch controls with game engine
- Layout adaptation across screen sizes
- Orientation change handling

### Mobile Testing

- Touch responsiveness on actual devices
- Performance on various mobile browsers
- Gesture recognition accuracy

### Accessibility Testing

- Touch target size compliance
- Screen reader compatibility
- Voice control support

## Dependencies

### Prerequisite Tasks

- T-1.7.1 (Canvas Rendering System)
- T-1.6.2 (Game Control Interface)
- T-1.2.2 (Responsive Navigation)

### Blocking Tasks

- None

### External Dependencies

- Touch Events API
- CSS Environment Variables (safe-area-inset)
- Vibration API (optional)

## Risks and Considerations

### Technical Risks

- Touch event handling inconsistencies across devices
- Performance impact of gesture detection
- Layout complexity with multiple orientations

### Implementation Challenges

- Smooth gesture recognition without false positives
- Maintaining game performance with touch handlers
- Supporting diverse mobile device capabilities

### Mitigation Strategies

- Test extensively on real devices
- Implement fallback options for unsupported features
- Use passive event listeners where possible
- Add debouncing for performance-sensitive operations

---

**Estimated Duration**: 2-3 hours  
**Risk Level**: Medium  
**Dependencies**: T-1.7.1, T-1.6.2, T-1.2.2  
**Output**: Complete mobile-responsive interface with touch controls and adaptive layouts
