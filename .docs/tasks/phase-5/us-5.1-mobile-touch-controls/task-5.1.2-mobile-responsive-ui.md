# Task: Mobile-Responsive UI Layout

## Task Header
- **ID**: 5.1.2
- **Title**: Mobile-Responsive UI Layout
- **Story ID**: US-5.1
- **Type**: frontend
- **Priority**: high
- **Effort Estimate**: 4-6 hours
- **Complexity**: moderate

## Objective
Create a fully responsive UI layout that adapts seamlessly to different mobile screen sizes and orientations, providing an optimal gaming experience across all mobile devices.

## Description
Implement comprehensive responsive design for the game interface, ensuring the game canvas, controls, and UI elements properly scale and position themselves across various mobile devices. This includes handling orientation changes, safe area considerations for modern mobile devices, and optimizing layout for both portrait and landscape modes.

## Acceptance Criteria Covered
- GIVEN orientation change WHEN device rotates THEN game adapts layout appropriately
- GIVEN mobile interface WHEN displayed THEN touch controls for start/pause/restart are accessible
- GIVEN mobile device WHEN viewing THEN all UI elements are appropriately sized for touch
- GIVEN mobile layout WHEN displayed THEN game canvas and controls fit screen properly

## Implementation Notes

### Responsive Breakpoint System
```typescript
// Responsive breakpoint configuration
export const BREAKPOINTS = {
  MOBILE_SMALL: 360,   // Small phones (Galaxy S8, iPhone SE)
  MOBILE_LARGE: 414,   // Large phones (iPhone 14 Pro Max)
  TABLET: 768,         // iPads and Android tablets
  DESKTOP: 1024        // Desktop and laptop screens
} as const;

export const DEVICE_CATEGORIES = {
  PHONE_PORTRAIT: { minWidth: 0, maxWidth: 414, minHeight: 667 },
  PHONE_LANDSCAPE: { minWidth: 667, maxWidth: 844, maxHeight: 414 },
  TABLET_PORTRAIT: { minWidth: 768, maxWidth: 1024, minHeight: 1024 },
  TABLET_LANDSCAPE: { minWidth: 1024, maxWidth: 1366, maxHeight: 768 }
} as const;

// Hook for responsive design
export const useResponsiveLayout = () => {
  const [screenSize, setScreenSize] = useState<ScreenSize>('medium');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0, bottom: 0, left: 0, right: 0
  });

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine screen size category
      if (width <= BREAKPOINTS.MOBILE_SMALL) {
        setScreenSize('small');
      } else if (width <= BREAKPOINTS.MOBILE_LARGE) {
        setScreenSize('medium');
      } else if (width <= BREAKPOINTS.TABLET) {
        setScreenSize('large');
      } else {
        setScreenSize('desktop');
      }

      // Determine orientation
      setOrientation(width > height ? 'landscape' : 'portrait');

      // Calculate safe area insets
      updateSafeAreaInsets();
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);

    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, []);

  return { screenSize, orientation, safeAreaInsets };
};
```

### Game Container Responsive Component
```typescript
interface GameContainerProps {
  children: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({ children }) => {
  const { screenSize, orientation, safeAreaInsets } = useResponsiveLayout();
  
  const containerStyles = useMemo(() => ({
    '--safe-area-top': `${safeAreaInsets.top}px`,
    '--safe-area-bottom': `${safeAreaInsets.bottom}px`,
    '--safe-area-left': `${safeAreaInsets.left}px`,
    '--safe-area-right': `${safeAreaInsets.right}px`,
  }), [safeAreaInsets]);

  return (
    <div 
      className={`game-container ${screenSize} ${orientation}`}
      style={containerStyles}
      data-testid="game-container"
    >
      {children}
    </div>
  );
};
```

### Mobile Game Canvas Component
```typescript
interface MobileGameCanvasProps {
  width: number;
  height: number;
  onTouchEnabled: boolean;
}

export const MobileGameCanvas: React.FC<MobileGameCanvasProps> = ({
  width,
  height,
  onTouchEnabled
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { screenSize, orientation } = useResponsiveLayout();
  const touchControlManager = useRef<TouchControlManager | null>(null);

  // Calculate responsive canvas size
  const canvasSize = useMemo(() => {
    const containerPadding = 32; // 16px on each side
    const maxWidth = window.innerWidth - containerPadding;
    const maxHeight = window.innerHeight - 200; // Reserve space for UI

    let scaledWidth = width;
    let scaledHeight = height;

    // Scale down if canvas is too large for screen
    if (scaledWidth > maxWidth) {
      const scale = maxWidth / scaledWidth;
      scaledWidth = maxWidth;
      scaledHeight = scaledHeight * scale;
    }

    if (scaledHeight > maxHeight) {
      const scale = maxHeight / scaledHeight;
      scaledHeight = maxHeight;
      scaledWidth = scaledWidth * scale;
    }

    return {
      width: Math.floor(scaledWidth),
      height: Math.floor(scaledHeight),
      scale: scaledWidth / width
    };
  }, [width, height, screenSize, orientation]);

  useEffect(() => {
    if (canvasRef.current && onTouchEnabled) {
      // Initialize touch controls when canvas is ready
      touchControlManager.current = new TouchControlManager(
        canvasRef.current,
        gameControlHandler
      );
      touchControlManager.current.enableTouchControls();
    }

    return () => {
      touchControlManager.current?.destroy();
    };
  }, [onTouchEnabled]);

  return (
    <div className="game-canvas-container">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="game-canvas mobile-optimized"
        data-scale={canvasSize.scale}
      />
    </div>
  );
};
```

### Mobile Control Panel Component
```typescript
interface MobileControlPanelProps {
  gameState: GameState;
  onStart: () => void;
  onPause: () => void;
  onRestart: () => void;
  onSettings: () => void;
}

export const MobileControlPanel: React.FC<MobileControlPanelProps> = ({
  gameState,
  onStart,
  onPause,
  onRestart,
  onSettings
}) => {
  const { orientation } = useResponsiveLayout();

  return (
    <div className={`mobile-control-panel ${orientation}`}>
      <div className="primary-controls">
        {gameState === 'idle' && (
          <TouchButton
            onClick={onStart}
            icon="play"
            label="Start Game"
            variant="primary"
            size="large"
          />
        )}
        
        {gameState === 'playing' && (
          <TouchButton
            onClick={onPause}
            icon="pause"
            label="Pause"
            variant="secondary"
            size="medium"
          />
        )}
        
        {(gameState === 'paused' || gameState === 'gameOver') && (
          <>
            <TouchButton
              onClick={onStart}
              icon="play"
              label="Resume"
              variant="primary"
              size="large"
            />
            <TouchButton
              onClick={onRestart}
              icon="restart"
              label="Restart"
              variant="secondary"
              size="medium"
            />
          </>
        )}
      </div>
      
      <div className="secondary-controls">
        <TouchButton
          onClick={onSettings}
          icon="settings"
          label="Settings"
          variant="tertiary"
          size="small"
        />
      </div>
    </div>
  );
};
```

### Touch-Optimized Button Component
```typescript
interface TouchButtonProps {
  onClick: () => void;
  icon: string;
  label: string;
  variant: 'primary' | 'secondary' | 'tertiary';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  onClick,
  icon,
  label,
  variant,
  size,
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (!disabled) {
      onClick();
    }
  }, [onClick, disabled]);

  return (
    <button
      className={`touch-button ${variant} ${size} ${isPressed ? 'pressed' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      disabled={disabled}
      aria-label={label}
    >
      <span className="button-icon">{icon}</span>
      <span className="button-label">{label}</span>
    </button>
  );
};
```

## Technical Specifications

### File Targets

#### New Files
- `src/components/Mobile/GameContainer.tsx` - Responsive game container
- `src/components/Mobile/MobileGameCanvas.tsx` - Mobile-optimized canvas component
- `src/components/Mobile/MobileControlPanel.tsx` - Touch control panel
- `src/components/Mobile/TouchButton.tsx` - Touch-optimized button component
- `src/hooks/useResponsiveLayout.ts` - Responsive layout hook
- `src/lib/utils/safaAreaUtils.ts` - Safe area detection utilities
- `src/styles/mobile.css` - Mobile-specific CSS styles
- `src/styles/responsive.css` - Responsive breakpoint styles

#### Modified Files
- `src/pages/game.tsx` - Integrate mobile components
- `src/components/Game/GamePage.tsx` - Add responsive layout support
- `src/styles/globals.css` - Add mobile-first base styles

### API Endpoints
N/A - Frontend-only responsive design

### Database Changes
N/A - No data persistence for layout

### Component Specs
```typescript
// Responsive layout interfaces
interface ScreenSize {
  category: 'small' | 'medium' | 'large' | 'desktop';
  width: number;
  height: number;
  pixelRatio: number;
}

interface Orientation {
  current: 'portrait' | 'landscape';
  angle: number;
}

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface ResponsiveLayoutConfig {
  breakpoints: typeof BREAKPOINTS;
  canvasScaling: {
    minSize: { width: number; height: number };
    maxSize: { width: number; height: number };
    aspectRatio: number;
  };
  touchTargets: {
    minSize: number; // 44px for iOS, 48dp for Android
    spacing: number;
  };
}

// Touch button specifications
interface TouchButtonConfig {
  sizes: {
    small: { width: number; height: number; fontSize: number };
    medium: { width: number; height: number; fontSize: number };
    large: { width: number; height: number; fontSize: number };
  };
  hapticFeedback: boolean;
  pressAnimation: boolean;
}
```

### DTO Definitions
```typescript
// Layout state data transfer objects
interface LayoutStateDTO {
  screenSize: ScreenSize;
  orientation: Orientation;
  safeAreaInsets: SafeAreaInsets;
  canvasSize: {
    width: number;
    height: number;
    scale: number;
  };
  timestamp: number;
}

interface ResponsiveConfigDTO {
  breakpoint: keyof typeof BREAKPOINTS;
  deviceType: 'phone' | 'tablet' | 'desktop';
  orientationSupport: ('portrait' | 'landscape')[];
  touchOptimized: boolean;
}
```

### Configuration Changes
```css
/* CSS Custom Properties for responsive design */
:root {
  /* Responsive breakpoints */
  --mobile-small: 360px;
  --mobile-large: 414px;
  --tablet: 768px;
  --desktop: 1024px;
  
  /* Touch target sizes */
  --touch-target-min: 44px;
  --touch-spacing: 8px;
  
  /* Safe area support */
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
  
  /* Mobile-specific spacing */
  --mobile-padding: 16px;
  --mobile-gap: 12px;
}

/* Responsive utilities */
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only {
    display: block;
  }
  
  .desktop-only {
    display: none;
  }
}
```

## Testing Requirements

### Unit Tests
- Responsive layout hook behavior with different screen sizes
- Canvas size calculations for various devices
- Safe area inset detection and application
- Touch button press state management
- Orientation change handling

### Integration Tests
- Game container layout updates with window resize
- Canvas scaling integration with game rendering
- Touch button integration with game controls
- Mobile control panel state synchronization

### E2E Scenarios
- Complete responsive layout testing across device sizes
- Orientation change handling during active gameplay
- Touch target accessibility and usability testing
- Cross-browser responsive behavior validation

## Dependencies

### Prerequisite Tasks
- US-5.1.1 (Touch Event System) - For touch control integration
- US-1.7 (Canvas-Based Game Rendering) - For canvas component integration

### Blocking Tasks
- None - Can be developed in parallel with touch system

### External Dependencies
- CSS Environment Variables (safe-area-inset-*)
- Viewport meta tag configuration
- CSS Grid and Flexbox browser support

## Risks and Considerations

### Technical Risks
- **Safe Area Detection**: Not all browsers support CSS environment variables for safe areas
  - *Mitigation*: Provide fallback values and feature detection
  
- **Dynamic Viewport Heights**: iOS Safari changing viewport height causes layout issues
  - *Mitigation*: Use CSS custom properties and proper viewport units (dvh)
  
- **Canvas Scaling**: Performance impact of canvas scaling on mobile devices
  - *Mitigation*: Optimize scaling calculations and cache values

### Implementation Challenges
- **Cross-Device Consistency**: Ensuring consistent appearance across different mobile devices
  - *Mitigation*: Comprehensive device testing and flexible layout system
  
- **Orientation Changes**: Smooth transitions and layout recalculation during device rotation
  - *Mitigation*: Debounced resize handlers and CSS transition animations
  
- **Touch Target Accessibility**: Meeting platform-specific touch target size requirements
  - *Mitigation*: Platform-aware touch target sizing and spacing

### Mitigation Strategies
- Use mobile-first responsive design approach
- Implement progressive enhancement for advanced mobile features
- Test on real devices with different screen sizes and resolutions
- Provide fallbacks for unsupported CSS features
- Monitor performance impact of responsive calculations

## Definition of Done
- [ ] Game interface adapts properly to all target mobile screen sizes
- [ ] Orientation changes trigger appropriate layout updates
- [ ] Safe area insets are respected on devices with notches/home indicators
- [ ] Touch targets meet platform accessibility guidelines (44px+ touch size)
- [ ] Canvas scaling maintains game aspect ratio across devices
- [ ] Control panel remains accessible in all orientations
- [ ] Responsive design works across target mobile browsers
- [ ] Performance remains optimal during layout changes
- [ ] CSS follows mobile-first responsive design principles
- [ ] Integration testing validates layout with touch controls

## Implementation Strategy
1. **Phase 1**: Core responsive layout hook and breakpoint system
2. **Phase 2**: Game container and canvas responsive components
3. **Phase 3**: Mobile control panel and touch button implementation
4. **Phase 4**: Safe area handling and device-specific optimizations
5. **Phase 5**: Cross-device testing and performance optimization

This responsive UI foundation ensures the game provides an excellent user experience across all mobile devices while maintaining performance and accessibility standards.