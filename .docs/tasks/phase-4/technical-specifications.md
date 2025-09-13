````markdown
# Phase 4 Technical Specifications

## Audio System Architecture

### Overview

Phase 4 implements a comprehensive audio system using a hybrid approach combining Web Audio API for low-latency sound effects and HTML5 Audio for background music playback.

## Core Components

### AudioManager Class

```typescript
interface AudioManagerConfig {
  musicVolume: number;
  effectsVolume: number;
  muted: boolean;
  audioEnabled: boolean;
}

class AudioManager {
  private audioContext: AudioContext | null;
  private musicElement: HTMLAudioElement | null;
  private soundBuffers: Map<string, AudioBuffer>;
  private config: AudioManagerConfig;
  private initialized: boolean;

  constructor();
  async initialize(): Promise<void>;
  async loadSounds(soundMap: Record<string, string>): Promise<void>;
  playMusic(src: string, loop?: boolean): Promise<void>;
  playSound(name: string, volume?: number): void;
  setMusicVolume(volume: number): void;
  setEffectsVolume(volume: number): void;
  toggleMute(): void;
  pauseMusic(): void;
  resumeMusic(): void;
  dispose(): void;
}
```

### Audio Context Management

```typescript
interface AudioContextManager {
  context: AudioContext | null;
  state: 'suspended' | 'running' | 'closed' | 'unavailable';

  initialize(): Promise<AudioContext | null>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  handleAutoplayRestrictions(): void;
}
```

## API Specifications

### Audio Manager Interface

```typescript
// Core audio management interface
interface IAudioManager {
  // Initialization
  initialize(): Promise<boolean>;
  isSupported(): boolean;
  getState(): AudioState;

  // Music controls
  playBackgroundMusic(track: string): Promise<void>;
  pauseMusic(): void;
  resumeMusic(): void;
  setMusicVolume(volume: number): void;

  // Sound effects
  playSound(soundId: SoundId): void;
  preloadSounds(sounds: SoundMap): Promise<void>;
  setEffectsVolume(volume: number): void;

  // Global controls
  mute(): void;
  unmute(): void;
  setMasterVolume(volume: number): void;

  // Settings persistence
  saveSettings(): void;
  loadSettings(): AudioSettings;
}

// Sound effect identifiers
enum SoundId {
  EAT_FOOD = 'eat-food',
  COMBO_COMPLETE = 'combo-complete',
  GAME_OVER = 'game-over',
  MENU_CLICK = 'menu-click',
}

// Audio settings interface
interface AudioSettings {
  musicVolume: number; // 0-1
  effectsVolume: number; // 0-1
  masterVolume: number; // 0-1
  muted: boolean;
  musicEnabled: boolean;
  effectsEnabled: boolean;
}
```

### Game Integration Interface

```typescript
// Game event audio triggers
interface GameAudioEvents {
  onFoodEaten(foodType: FoodType): void;
  onComboCompleted(comboLevel: number): void;
  onGameOver(score: number): void;
  onGameStart(): void;
  onGamePause(): void;
  onGameResume(): void;
  onMenuNavigation(): void;
}

// Audio event emitter for game integration
interface AudioEventEmitter {
  emit(event: AudioEvent, data?: any): void;
  on(event: AudioEvent, callback: Function): void;
  off(event: AudioEvent, callback: Function): void;
}
```

## Component Specifications

### AudioControls Component

```typescript
interface AudioControlsProps {
  audioManager: IAudioManager;
  showVolumeSlider?: boolean;
  showMuteButton?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
}

const AudioControls: React.FC<AudioControlsProps> = ({
  audioManager,
  showVolumeSlider = true,
  showMuteButton = true,
  orientation = 'horizontal',
  size = 'medium',
}) => {
  // Volume slider with real-time feedback
  // Mute/unmute toggle button
  // Audio enabled/disabled indicator
  // Accessibility support with ARIA labels
};
```

### AudioProvider Context

```typescript
interface AudioContextValue {
  audioManager: IAudioManager;
  isAudioSupported: boolean;
  audioSettings: AudioSettings;
  updateSettings: (settings: Partial<AudioSettings>) => void;
  playSound: (soundId: SoundId) => void;
  isLoading: boolean;
  error: string | null;
}

const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize audio manager
  // Provide audio context to components
  // Handle browser compatibility
  // Manage loading states and errors
};
```

## Database Schema Extensions

### Audio Settings Storage

```typescript
// Extend existing user preferences or create new schema
interface UserPreferences extends Document {
  // ... existing fields
  audioSettings: {
    musicVolume: number;
    effectsVolume: number;
    masterVolume: number;
    muted: boolean;
    musicEnabled: boolean;
    effectsEnabled: boolean;
    lastUpdated: Date;
  };
}

// Local storage schema for client-side persistence
interface LocalAudioSettings {
  version: string;
  settings: AudioSettings;
  timestamp: number;
}
```

## File Structure

### Audio System Files

```
src/
├── lib/
│   ├── audio/
│   │   ├── AudioManager.ts           # Core audio management
│   │   ├── AudioContext.ts           # Audio context wrapper
│   │   ├── SoundLoader.ts            # Audio asset loading
│   │   ├── BrowserCompatibility.ts   # Browser support detection
│   │   └── types.ts                  # Audio type definitions
│   └── utils/
│       ├── audioUtils.ts             # Audio utility functions
│       └── storageUtils.ts           # Settings persistence
├── components/
│   ├── audio/
│   │   ├── AudioControls.tsx         # Volume and mute controls
│   │   ├── AudioProvider.tsx         # React context provider
│   │   └── AudioIndicator.tsx        # Audio status indicator
│   └── game/
│       └── GameCanvas.tsx            # Updated with audio integration
├── hooks/
│   ├── useAudio.ts                   # Audio management hook
│   ├── useAudioSettings.ts           # Settings management hook
│   └── useGameAudio.ts               # Game-specific audio hook
└── public/
    └── audio/
        ├── music/
        │   └── background-music.mp3   # Background music file
        └── sounds/
            ├── eat-food.wav           # Food consumption sound
            ├── combo-complete.wav     # Combo achievement sound
            └── game-over.wav          # Game over sound
```

### New File Targets

#### Core Audio System

- `src/lib/audio/AudioManager.ts` - Main audio management class
- `src/lib/audio/AudioContext.ts` - Audio context lifecycle management
- `src/lib/audio/SoundLoader.ts` - Audio asset loading and caching
- `src/lib/audio/BrowserCompatibility.ts` - Browser support detection and fallbacks
- `src/lib/audio/types.ts` - TypeScript interfaces and enums

#### React Components

- `src/components/audio/AudioControls.tsx` - Volume and mute controls UI
- `src/components/audio/AudioProvider.tsx` - React context for audio state
- `src/components/audio/AudioIndicator.tsx` - Audio status display

#### Hooks and Utilities

- `src/hooks/useAudio.ts` - Custom hook for audio management
- `src/hooks/useAudioSettings.ts` - Settings persistence hook
- `src/hooks/useGameAudio.ts` - Game event audio integration
- `src/lib/utils/audioUtils.ts` - Audio utility functions
- `src/lib/utils/storageUtils.ts` - Local storage management

#### Audio Assets

- `public/audio/music/background-music.mp3` - Game background music
- `public/audio/sounds/eat-food.wav` - Food consumption sound effect
- `public/audio/sounds/combo-complete.wav` - Combo achievement sound
- `public/audio/sounds/game-over.wav` - Game over sound effect

### Modified Files

- `src/components/game/GameCanvas.tsx` - Integration with audio events
- `src/pages/game.tsx` - Audio provider and controls integration
- `src/lib/game/GameEngine.ts` - Audio event emission
- `src/components/layout/Layout.tsx` - Global audio controls
- `next.config.js` - Audio asset optimization configuration

## Configuration Changes

### Next.js Configuration

```javascript
// next.config.js additions
module.exports = {
  // ... existing config
  webpack: config => {
    // Audio file handling
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/audio/',
          outputPath: 'static/audio/',
        },
      },
    });
    return config;
  },
};
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    // ... existing options
    "types": ["node", "webapi"]
  },
  "include": [
    // ... existing includes
    "src/lib/audio/**/*",
    "src/components/audio/**/*"
  ]
}
```

### Environment Variables

```bash
# Audio-related environment variables
NEXT_PUBLIC_AUDIO_ENABLED=true
NEXT_PUBLIC_AUDIO_DEBUG=false
NEXT_PUBLIC_AUDIO_CDN_URL=""
```

## Browser Compatibility Matrix

| Feature                 | Chrome | Firefox | Safari | Edge | Mobile Safari | Mobile Chrome |
| ----------------------- | ------ | ------- | ------ | ---- | ------------- | ------------- |
| Web Audio API           | ✅     | ✅      | ✅     | ✅   | ✅            | ✅            |
| HTML5 Audio             | ✅     | ✅      | ✅     | ✅   | ✅            | ✅            |
| Autoplay (user gesture) | ✅     | ✅      | ✅     | ✅   | ✅            | ✅            |
| Autoplay (no gesture)   | ❌     | ❌      | ❌     | ❌   | ❌            | ❌            |
| Audio Context Resume    | ✅     | ✅      | ✅     | ✅   | ✅            | ✅            |
| Multiple Audio Sources  | ✅     | ✅      | ✅     | ✅   | Limited       | ✅            |

### Fallback Strategy

1. **Primary**: Web Audio API + HTML5 Audio
2. **Fallback 1**: HTML5 Audio only (older browsers)
3. **Fallback 2**: Silent operation (audio blocked/unsupported)

## Performance Specifications

### Audio Performance Targets

- **Sound Effect Latency**: < 50ms from trigger to playback
- **Music Loading Time**: < 2 seconds for background music
- **Memory Usage**: < 10MB for all audio assets
- **CPU Impact**: < 5% additional CPU usage during gameplay
- **Audio Buffer Size**: 4096 samples (for low latency)

### Optimization Strategies

- Preload critical sound effects during game initialization
- Use compressed audio formats (MP3 for music, WAV for effects)
- Implement audio asset lazy loading for non-critical sounds
- Audio context suspension when game is paused/inactive
- Memory cleanup for unused audio buffers
````
