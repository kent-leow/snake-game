````markdown
# Task: Audio Manager Core Implementation

## Task Header
- **ID**: 4.1.1
- **Title**: Audio Manager Core Implementation
- **Story ID**: US-4.1
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 5-7 hours
- **Complexity**: complex

## Objective
Implement the core AudioManager class that serves as the foundation for all audio functionality in the game, providing a unified interface for both Web Audio API and HTML5 Audio management.

## Description
Create a comprehensive AudioManager system that handles audio context management, audio asset loading, volume controls, and provides the foundation for both background music and sound effects. This task establishes the core architecture that all other audio features will build upon.

## Acceptance Criteria Covered
- GIVEN game page loads WHEN user starts playing THEN background music begins playing
- GIVEN audio controls WHEN used THEN volume adjusts correctly  
- GIVEN mute control WHEN activated THEN background music stops immediately
- GIVEN browser autoplay restrictions WHEN encountered THEN music starts on first user interaction

## Implementation Notes

### Core AudioManager Class Structure
```typescript
class AudioManager {
  private audioContext: AudioContext | null = null;
  private musicElement: HTMLAudioElement | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  private config: AudioManagerConfig;
  private initialized: boolean = false;
  private gainNodes: {
    master: GainNode | null;
    music: GainNode | null;
    effects: GainNode | null;
  };

  constructor(config?: Partial<AudioManagerConfig>);
  async initialize(): Promise<boolean>;
  async loadAudioAssets(assetMap: Record<string, string>): Promise<void>;
  createAudioContext(): AudioContext | null;
  handleAutoplayRestrictions(): void;
  dispose(): void;
}
```

### Audio Context Management
- Initialize AudioContext with fallback for webkit browsers
- Handle suspended state and resume on user interaction
- Implement graceful degradation when audio is unavailable
- Create master gain node hierarchy for volume control

### Configuration Management  
- Default configuration with volume levels and preferences
- Settings persistence via localStorage
- Configuration validation and sanitization
- Event emission for configuration changes

### Error Handling and Fallbacks
- Detect browser audio support capabilities
- Handle AudioContext creation failures
- Implement silent mode when audio is blocked
- Provide meaningful error messages and recovery options

## Technical Specifications

### File Targets

#### New Files
- `src/lib/audio/AudioManager.ts` - Core AudioManager class implementation
- `src/lib/audio/AudioContext.ts` - Audio context lifecycle management
- `src/lib/audio/types.ts` - TypeScript interfaces and enums for audio system
- `src/lib/audio/config.ts` - Default audio configuration and constants
- `src/lib/utils/audioUtils.ts` - Audio utility functions and helpers

#### Modified Files
- `src/lib/utils/storageUtils.ts` - Add audio settings persistence functions

### API Endpoints
N/A - Frontend-only implementation

### Database Changes
N/A - Uses local storage for settings persistence

### Component Specs
```typescript
// Core interfaces for the audio system
interface AudioManagerConfig {
  musicVolume: number;        // 0-1
  effectsVolume: number;      // 0-1  
  masterVolume: number;       // 0-1
  muted: boolean;
  audioEnabled: boolean;
  autoplay: boolean;
}

interface AudioState {
  initialized: boolean;
  supported: boolean;
  contextState: 'suspended' | 'running' | 'closed' | 'unavailable';
  musicPlaying: boolean;
  muted: boolean;
  volumes: {
    master: number;
    music: number;
    effects: number;
  };
}

// Events for audio system communication
enum AudioEvent {
  INITIALIZED = 'audio:initialized',
  CONTEXT_RESUMED = 'audio:context-resumed',
  MUSIC_STARTED = 'audio:music-started',
  MUSIC_ENDED = 'audio:music-ended',
  VOLUME_CHANGED = 'audio:volume-changed',
  MUTE_TOGGLED = 'audio:mute-toggled',
  ERROR = 'audio:error'
}
```

### DTO Definitions
```typescript
// Settings data transfer object
interface AudioSettingsDTO {
  version: string;
  settings: AudioManagerConfig;
  timestamp: number;
}

// Error information object
interface AudioErrorDTO {
  code: string;
  message: string;
  context?: string;
  recoverable: boolean;
}
```

### Configuration Changes
```javascript
// next.config.js - Add audio file handling
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp3|wav|ogg|m4a)$/,
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

## Testing Requirements

### Unit Tests
- AudioManager initialization with various configurations
- Audio context creation and state management
- Configuration persistence and retrieval
- Error handling for unsupported browsers
- Volume control functionality
- Mute/unmute behavior

### Integration Tests  
- Integration with browser audio APIs
- Local storage persistence functionality
- Event emission and handling
- Resource cleanup and disposal

### E2E Scenarios
- Audio system initialization on page load
- Graceful handling of autoplay restrictions
- Configuration changes persist across page reloads
- Silent operation when audio is blocked

## Dependencies

### Prerequisite Tasks
- US-1.1 (Next.js Project Foundation) - Project structure must exist
- US-1.6 (Game Controls and State Management) - For state integration

### Blocking Tasks
- None - This is a foundational task

### External Dependencies
- Web Audio API (browser support)
- HTML5 Audio API (browser support)
- localStorage (browser storage)

## Risks and Considerations

### Technical Risks
- **Browser Audio Context Limitations**: Different browsers have varying autoplay policies
  - *Mitigation*: Implement robust autoplay restriction handling with user interaction triggers
  
- **Audio Context Creation Failures**: Some browsers may block audio context creation
  - *Mitigation*: Provide graceful fallbacks and clear user messaging
  
- **Memory Management**: Audio contexts and buffers can consume significant memory
  - *Mitigation*: Implement proper cleanup and resource management

### Implementation Challenges
- **Cross-Browser Compatibility**: Safari, Chrome, and Firefox have different audio behaviors
  - *Mitigation*: Comprehensive browser testing and compatibility layers
  
- **Autoplay Policy Changes**: Browser policies continue to evolve
  - *Mitigation*: Design for current policies with adaptable architecture
  
- **Performance Impact**: Audio processing can affect game performance
  - *Mitigation*: Profile audio operations and optimize for minimal impact

### Mitigation Strategies
- Start with feature detection and capability assessment
- Implement progressive enhancement for audio features
- Provide clear user feedback for audio state and restrictions
- Design for graceful degradation when audio is unavailable
- Use event-driven architecture for loose coupling

## Definition of Done
- [ ] AudioManager class implemented with full TypeScript typing
- [ ] Audio context creation and management functional
- [ ] Volume control system (master, music, effects) working
- [ ] Configuration persistence to localStorage implemented
- [ ] Error handling and fallback mechanisms in place
- [ ] Event system for audio state communication
- [ ] Browser compatibility layer functional
- [ ] Memory management and cleanup implemented
- [ ] Unit tests passing for core functionality
- [ ] Integration with existing project structure complete
- [ ] Documentation updated with API reference

## Implementation Strategy
1. **Phase 1**: Core AudioManager class with basic initialization
2. **Phase 2**: Audio context management and browser compatibility
3. **Phase 3**: Configuration system and persistence
4. **Phase 4**: Error handling and fallback mechanisms
5. **Phase 5**: Testing and integration validation

This foundational task provides the core infrastructure that enables all subsequent audio features while ensuring robust browser compatibility and user experience.
````