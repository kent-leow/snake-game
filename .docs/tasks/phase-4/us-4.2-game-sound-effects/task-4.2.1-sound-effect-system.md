````markdown
# Task: Sound Effect System Implementation

## Task Header
- **ID**: 4.2.1
- **Title**: Sound Effect System Implementation
- **Story ID**: US-4.2
- **Type**: frontend
- **Priority**: high
- **Effort Estimate**: 4-6 hours
- **Complexity**: moderate

## Objective
Implement a high-performance sound effect system using Web Audio API for low-latency audio playback, creating the foundation for responsive game audio feedback that enhances player experience without impacting game performance.

## Description
Create a dedicated sound effect management system that handles rapid audio playback, audio buffer management, and concurrent sound playing. This system will use Web Audio API for optimal performance and integrate with the existing AudioManager to provide consistent volume control and settings management.

## Acceptance Criteria Covered
- GIVEN sound effects WHEN triggered THEN play within 50ms of game event
- GIVEN multiple sounds WHEN overlapping THEN audio system handles simultaneous playback
- GIVEN sound effects WHEN playing THEN no impact on game performance
- GIVEN audio system WHEN active THEN sound effects work across all supported browsers

## Implementation Notes

### Sound Effect Architecture
```typescript
interface SoundEffectManager {
  soundBuffers: Map<SoundId, AudioBuffer>;
  activeSources: Set<AudioBufferSourceNode>;
  effectsGainNode: GainNode | null;
  maxConcurrentSounds: number;
  
  preloadSounds(soundMap: Record<SoundId, string>): Promise<void>;
  playSound(soundId: SoundId, options?: PlaySoundOptions): void;
  stopSound(sourceNode: AudioBufferSourceNode): void;
  stopAllSounds(): void;
  setEffectsVolume(volume: number): void;
  cleanup(): void;
}

interface PlaySoundOptions {
  volume?: number;
  pitch?: number;
  delay?: number;
  loop?: boolean;
}

enum SoundId {
  EAT_FOOD = 'eat-food',
  COMBO_COMPLETE = 'combo-complete', 
  GAME_OVER = 'game-over',
  MENU_CLICK = 'menu-click'
}
```

### Web Audio API Implementation
- Use AudioBuffer for preloaded sound data
- Create AudioBufferSourceNode for each sound playback
- Implement gain control for individual effects
- Handle concurrent playback with source management
- Optimize for minimal latency and memory usage

### Sound Buffer Management
- Preload all sound effects during initialization
- Cache AudioBuffer objects for reuse
- Implement memory cleanup for disposed sounds
- Handle loading errors gracefully
- Support multiple audio formats with fallbacks

## Technical Specifications

### File Targets

#### New Files
- `src/lib/audio/SoundEffectManager.ts` - Core sound effects management
- `src/lib/audio/SoundLoader.ts` - Audio buffer loading and caching
- `src/lib/audio/AudioBufferPool.ts` - Buffer reuse and memory management
- `src/hooks/useSoundEffects.ts` - React hook for sound effect integration
- `public/audio/sounds/eat-food.wav` - Food consumption sound effect
- `public/audio/sounds/combo-complete.wav` - Combo achievement sound
- `public/audio/sounds/game-over.wav` - Game over sound effect

#### Modified Files
- `src/lib/audio/AudioManager.ts` - Integrate sound effect system
- `src/lib/audio/types.ts` - Add sound effect type definitions

### Component Specs
```typescript
// SoundEffectManager class implementation
class SoundEffectManager {
  private audioContext: AudioContext;
  private audioManager: AudioManager;
  private soundBuffers: Map<SoundId, AudioBuffer> = new Map();
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private effectsGainNode: GainNode | null = null;
  private maxConcurrentSounds: number = 8;
  
  constructor(audioContext: AudioContext, audioManager: AudioManager);
  
  async initialize(): Promise<void>;
  async preloadSounds(soundMap: Record<SoundId, string>): Promise<void>;
  playSound(soundId: SoundId, options?: PlaySoundOptions): AudioBufferSourceNode | null;
  stopSound(sourceNode: AudioBufferSourceNode): void;
  stopAllSounds(): void;
  setEffectsVolume(volume: number): void;
  getActiveSourceCount(): number;
  cleanup(): void;
}

// Sound loading utilities
class SoundLoader {
  static async loadAudioBuffer(
    audioContext: AudioContext, 
    url: string
  ): Promise<AudioBuffer>;
  
  static async loadMultipleBuffers(
    audioContext: AudioContext,
    soundMap: Record<string, string>
  ): Promise<Map<string, AudioBuffer>>;
  
  static validateAudioBuffer(buffer: AudioBuffer): boolean;
  static optimizeBufferForPlayback(buffer: AudioBuffer): AudioBuffer;
}

// Audio buffer pool for memory efficiency
class AudioBufferPool {
  private pools: Map<SoundId, AudioBufferSourceNode[]> = new Map();
  private maxPoolSize: number = 4;
  
  getSourceNode(soundId: SoundId, audioBuffer: AudioBuffer): AudioBufferSourceNode;
  returnSourceNode(soundId: SoundId, sourceNode: AudioBufferSourceNode): void;
  clearPool(soundId?: SoundId): void;
  getPoolSize(soundId: SoundId): number;
}
```

### Performance Optimization Features
```typescript
// Performance monitoring and optimization
interface SoundEffectPerformance {
  averageLatency: number;
  maxConcurrentSounds: number;
  memoryUsage: number;
  bufferHitRate: number;
  
  measureLatency(startTime: number, soundId: SoundId): void;
  optimizePerformance(): void;
  getPerformanceReport(): PerformanceReport;
}

// Concurrent sound management
class ConcurrentSoundManager {
  private priorityMap: Map<SoundId, number> = new Map();
  private activeSources: Array<{
    source: AudioBufferSourceNode;
    soundId: SoundId;
    startTime: number;
    priority: number;
  }> = [];
  
  addSound(source: AudioBufferSourceNode, soundId: SoundId): boolean;
  removeSound(source: AudioBufferSourceNode): void;
  limitConcurrentSounds(maxSounds: number): void;
  prioritizeSound(soundId: SoundId, priority: number): void;
}
```

### React Hook Integration
```typescript
// useSoundEffects hook for component integration
const useSoundEffects = () => {
  const audioManager = useContext(AudioContext);
  const [soundEffectsReady, setSoundEffectsReady] = useState(false);
  
  const playSound = useCallback((soundId: SoundId, options?: PlaySoundOptions) => {
    if (!audioManager || !soundEffectsReady) return;
    audioManager.soundEffects.playSound(soundId, options);
  }, [audioManager, soundEffectsReady]);
  
  const stopAllSounds = useCallback(() => {
    if (!audioManager) return;
    audioManager.soundEffects.stopAllSounds();
  }, [audioManager]);
  
  return {
    playSound,
    stopAllSounds,
    soundEffectsReady,
    canPlaySounds: audioManager?.isAudioSupported() ?? false
  };
};
```

### Audio Asset Specifications
```typescript
// Sound effect asset requirements
const soundEffectSpecs = {
  'eat-food': {
    format: 'wav',
    duration: '0.2s',
    frequency: '440Hz-880Hz',
    volume: 'medium',
    description: 'Short, pleasant eating sound'
  },
  'combo-complete': {
    format: 'wav', 
    duration: '0.5s',
    frequency: '880Hz-1760Hz',
    volume: 'high',
    description: 'Celebratory achievement sound'
  },
  'game-over': {
    format: 'wav',
    duration: '1.0s',
    frequency: '220Hz-440Hz', 
    volume: 'medium',
    description: 'Descending failure tone'
  }
};
```

## Testing Requirements

### Unit Tests
- SoundEffectManager initialization and configuration
- Audio buffer loading and validation
- Sound playback latency measurements
- Concurrent sound handling and limits
- Memory management and cleanup
- Volume control functionality

### Integration Tests
- Integration with existing AudioManager
- React hook functionality and state management
- Audio context integration
- Error handling for loading failures
- Performance under rapid sound triggers

### E2E Scenarios
- Rapid consecutive sound effect triggers
- Concurrent sound playback during intense gameplay
- Sound effect volume changes during playback
- Memory usage during extended play sessions
- Sound effect behavior with different browser audio states

### Performance Tests
```javascript
// Performance test scenarios
const performanceTests = [
  {
    name: 'rapid_sound_triggers',
    description: 'Trigger 10 sounds within 100ms',
    target: 'All sounds play within 50ms'
  },
  {
    name: 'concurrent_sound_limit',
    description: 'Play maximum concurrent sounds',
    target: 'No audio distortion or performance degradation'
  },
  {
    name: 'memory_usage_monitoring',
    description: 'Monitor memory during 1000 sound plays',
    target: 'Memory usage remains under 10MB'
  },
  {
    name: 'latency_measurement',
    description: 'Measure trigger-to-playback latency',
    target: 'Average latency under 50ms'
  }
];
```

## Dependencies

### Prerequisite Tasks
- **4.1.1** (Audio Manager Core Implementation) - Foundation audio system required

### Blocking Tasks
- None - Can be developed in parallel with background music system

### External Dependencies
- Web Audio API support
- Audio file assets (WAV format recommended for low latency)
- AudioContext from AudioManager

## Risks and Considerations

### Technical Risks
- **Audio Buffer Memory Usage**: Large number of buffers can consume significant memory
  - *Mitigation*: Implement buffer pooling and lazy loading strategies
  
- **Concurrent Playback Limits**: Browsers may limit simultaneous audio sources
  - *Mitigation*: Implement priority system and source management
  
- **Web Audio API Latency**: Some browsers may have higher audio latency
  - *Mitigation*: Optimize buffer sizes and use AudioWorklet if needed

### Implementation Challenges
- **Rapid Sound Triggers**: Fast gameplay may trigger many sounds quickly
  - *Mitigation*: Implement sound prioritization and concurrent limits
  
- **Cross-Browser Performance**: Audio performance varies across browsers
  - *Mitigation*: Profile and optimize for each target browser
  
- **Memory Leak Prevention**: AudioBufferSourceNode objects need proper cleanup
  - *Mitigation*: Implement automatic cleanup and resource management

### Mitigation Strategies
- Start with conservative concurrent sound limits and test performance
- Implement performance monitoring to detect audio system bottlenecks
- Use short, optimized audio files to minimize memory usage
- Provide fallback to simpler audio implementation if performance issues arise
- Test extensively on lower-powered devices and browsers

## Definition of Done
- [ ] SoundEffectManager class implemented with Web Audio API
- [ ] Audio buffer loading and caching system functional
- [ ] Concurrent sound playback management working
- [ ] Sound effect latency under 50ms target achieved
- [ ] Memory management and cleanup implemented
- [ ] React hook for component integration complete
- [ ] Performance monitoring and optimization in place
- [ ] Error handling for loading and playback failures
- [ ] Integration with existing AudioManager successful
- [ ] Unit tests passing for core functionality
- [ ] Performance tests validate latency and memory targets
- [ ] Cross-browser compatibility verified

## Implementation Strategy
1. **Phase 1**: Core SoundEffectManager class with basic Web Audio API integration
2. **Phase 2**: Audio buffer loading and caching system
3. **Phase 3**: Concurrent sound management and performance optimization
4. **Phase 4**: React hook integration and component interface
5. **Phase 5**: Performance testing and optimization validation

This task creates the high-performance foundation for all game sound effects, ensuring responsive audio feedback that enhances gameplay without compromising performance.
````