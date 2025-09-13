# Phase 5 Technical Specifications

## Overview
Technical specifications for Phase 5 implementation focusing on mobile touch controls and settings configuration system.

## Mobile Touch Controls Technical Specifications

### Touch Event System Architecture
```typescript
// Touch gesture detection system
interface TouchGestureDetector {
  startPoint: TouchPoint | null;
  minSwipeDistance: number;
  maxSwipeTime: number;
  
  onTouchStart(event: TouchEvent): void;
  onTouchMove(event: TouchEvent): void;
  onTouchEnd(event: TouchEvent): void;
  detectSwipeDirection(): SwipeDirection | null;
}

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

// Touch control manager
class TouchControlManager {
  private gestureDetector: TouchGestureDetector;
  private gameControlHandler: GameControlHandler;
  private isActive: boolean;
  
  constructor(canvas: HTMLCanvasElement, gameControls: GameControlHandler);
  initialize(): void;
  handleSwipeGesture(direction: SwipeDirection): void;
  enableTouchControls(): void;
  disableTouchControls(): void;
  destroy(): void;
}
```

### Mobile UI Layout Specifications
```typescript
// Responsive breakpoints
const BREAKPOINTS = {
  MOBILE_SMALL: 360,   // Small phones
  MOBILE_LARGE: 414,   // Large phones
  TABLET: 768,         // Tablets
  DESKTOP: 1024        // Desktop
} as const;

// Mobile layout configuration
interface MobileLayoutConfig {
  gameCanvasSize: {
    width: number;
    height: number;
  };
  controlPanelHeight: number;
  headerHeight: number;
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// Responsive game container
interface GameContainerProps {
  orientation: 'portrait' | 'landscape';
  screenSize: 'small' | 'medium' | 'large';
  safeAreaInsets: SafeAreaInsets;
}
```

### Touch Performance Optimization
```typescript
// Touch event throttling and optimization
class TouchEventOptimizer {
  private lastTouchTime: number = 0;
  private readonly THROTTLE_MS = 16; // ~60fps
  
  throttleTouch(callback: () => void): void;
  preventDefaultBehaviors(element: HTMLElement): void;
  optimizeForMobile(): void;
}

// Mobile-specific game loop adjustments
interface MobileGameConfig {
  targetFPS: number;        // 30 FPS for mobile
  touchResponseTime: number; // Max 100ms
  gestureThreshold: number;  // Min swipe distance
  preventScroll: boolean;    // Prevent page scroll
}
```

## Settings Configuration System Specifications

### Settings Data Model
```typescript
// Complete settings interface
interface GameSettings {
  audio: AudioSettings;
  controls: ControlSettings;
  gameplay: GameplaySettings;
  display: DisplaySettings;
  version: string;
  lastModified: number;
}

interface AudioSettings {
  masterVolume: number;     // 0-1
  musicVolume: number;      // 0-1
  effectsVolume: number;    // 0-1
  muted: boolean;
  musicEnabled: boolean;
  effectsEnabled: boolean;
}

interface ControlSettings {
  touchSensitivity: number;    // 0.1-2.0
  keyboardEnabled: boolean;
  touchEnabled: boolean;
  swipeThreshold: number;      // pixels
  doubleTapPrevention: boolean;
}

interface GameplaySettings {
  difficulty: 'easy' | 'normal' | 'hard';
  showFPS: boolean;
  pauseOnBlur: boolean;
  confirmReset: boolean;
}

interface DisplaySettings {
  theme: 'default' | 'dark' | 'contrast';
  showGrid: boolean;
  animations: boolean;
  reducedMotion: boolean;
}
```

### Settings UI Component Structure
```typescript
// Settings page component hierarchy
const SettingsPage = () => {
  return (
    <SettingsContainer>
      <SettingsHeader />
      <SettingsContent>
        <AudioSettingsSection />
        <ControlSettingsSection />
        <GameplaySettingsSection />
        <DisplaySettingsSection />
      </SettingsContent>
      <SettingsActions>
        <ResetToDefaultsButton />
        <SaveSettingsButton />
        <CancelButton />
      </SettingsActions>
    </SettingsContainer>
  );
};

// Individual setting component interface
interface SettingControlProps<T> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  description?: string;
  disabled?: boolean;
  validation?: (value: T) => boolean;
}

// Setting control types
type SliderControl = SettingControlProps<number> & {
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
};

type ToggleControl = SettingControlProps<boolean>;

type SelectControl<T> = SettingControlProps<T> & {
  options: Array<{ value: T; label: string }>;
};
```

### Settings Persistence Architecture
```typescript
// Settings manager for persistence and validation
class SettingsManager {
  private static readonly STORAGE_KEY = 'snake-game-settings';
  private static readonly VERSION = '1.0.0';
  
  static loadSettings(): GameSettings;
  static saveSettings(settings: GameSettings): void;
  static resetToDefaults(): GameSettings;
  static validateSettings(settings: unknown): settings is GameSettings;
  static migrateSettings(oldSettings: any): GameSettings;
}

// Settings context for React state management
interface SettingsContextValue {
  settings: GameSettings;
  updateSettings: (updates: Partial<GameSettings>) => void;
  resetSettings: () => void;
  isLoading: boolean;
  error: string | null;
}

// Settings integration with game systems
class SettingsIntegrator {
  constructor(
    private audioManager: AudioManager,
    private gameControls: GameControlHandler,
    private renderer: GameRenderer
  );
  
  applyAudioSettings(settings: AudioSettings): void;
  applyControlSettings(settings: ControlSettings): void;
  applyDisplaySettings(settings: DisplaySettings): void;
  applyGameplaySettings(settings: GameplaySettings): void;
}
```

## Mobile CSS and Responsive Design

### CSS Architecture
```css
/* Mobile-first responsive design */
.game-container {
  --mobile-header-height: 60px;
  --mobile-footer-height: 80px;
  --mobile-padding: 16px;
  
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height */
}

/* Touch-optimized game canvas */
.game-canvas {
  touch-action: none; /* Prevent default touch behaviors */
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}

/* Mobile control buttons */
.touch-controls {
  min-height: 44px; /* iOS minimum touch target */
  min-width: 44px;
  padding: 12px;
  border-radius: 8px;
  background: var(--control-bg);
  border: 2px solid var(--control-border);
}

/* Responsive breakpoint system */
@media (max-width: 414px) {
  .game-container {
    --canvas-width: calc(100vw - 32px);
    --canvas-height: calc(100vh - 200px);
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .game-container {
    flex-direction: row;
  }
  
  .game-controls {
    flex-direction: column;
    width: 120px;
  }
}
```

### Accessibility Considerations
```typescript
// Accessibility features for settings
interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReaderSupport: boolean;
}

// ARIA labels and descriptions
const ARIA_LABELS = {
  volumeSlider: 'Game volume control',
  muteButton: 'Mute all audio',
  settingsPage: 'Game settings configuration',
  resetButton: 'Reset all settings to default values'
} as const;
```

## API Integration Points

### Settings Persistence API
```typescript
// Local storage API for settings
interface SettingsStorageAPI {
  save(settings: GameSettings): Promise<void>;
  load(): Promise<GameSettings | null>;
  clear(): Promise<void>;
  export(): Promise<string>; // JSON export
  import(data: string): Promise<GameSettings>; // JSON import
}

// Future backend integration points
interface SettingsCloudAPI {
  syncSettings(userId: string, settings: GameSettings): Promise<void>;
  loadUserSettings(userId: string): Promise<GameSettings | null>;
  saveUserSettings(userId: string, settings: GameSettings): Promise<void>;
}
```

## Performance Specifications

### Mobile Performance Targets
- **Touch Response Time**: < 100ms from gesture to snake movement
- **Frame Rate**: Maintain 30+ FPS on mobile devices
- **Memory Usage**: < 50MB total memory footprint
- **Battery Impact**: Minimal battery drain during gameplay

### Optimization Strategies
- Throttle touch events to 60fps maximum
- Use passive event listeners where possible
- Implement touch gesture debouncing
- Optimize CSS animations with transform3d
- Reduce DOM manipulation during active gameplay

## Browser Compatibility Matrix

| Feature | iOS Safari | Chrome Mobile | Firefox Mobile | Samsung Internet |
|---------|------------|---------------|----------------|------------------|
| Touch Events | ✅ | ✅ | ✅ | ✅ |
| Swipe Gestures | ✅ | ✅ | ✅ | ✅ |
| CSS Grid | ✅ | ✅ | ✅ | ✅ |
| localStorage | ✅ | ✅ | ✅ | ✅ |
| Dynamic Viewport | ✅ (14+) | ✅ | ✅ | ✅ |
| Touch Action CSS | ✅ | ✅ | ✅ | ✅ |

## Testing Specifications

### Mobile Testing Strategy
1. **Device Testing**: Test on actual mobile devices for touch accuracy
2. **Browser Testing**: Verify behavior across mobile browsers
3. **Orientation Testing**: Portrait and landscape mode functionality
4. **Performance Testing**: FPS and responsiveness validation
5. **Accessibility Testing**: Screen reader and high contrast support

### Settings Testing Strategy
1. **Persistence Testing**: Settings survive page reload and browser restart
2. **Integration Testing**: Settings properly affect game behavior
3. **Validation Testing**: Invalid settings are rejected gracefully
4. **Migration Testing**: Old settings format upgrades correctly
5. **Reset Testing**: Default reset functionality works properly