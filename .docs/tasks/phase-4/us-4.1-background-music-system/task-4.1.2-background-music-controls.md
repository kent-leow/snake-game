````markdown
# Task: Background Music Integration and Controls

## Task Header
- **ID**: 4.1.2
- **Title**: Background Music Integration and Controls
- **Story ID**: US-4.1
- **Type**: frontend
- **Priority**: high
- **Effort Estimate**: 4-6 hours
- **Complexity**: moderate

## Objective
Implement background music playback functionality with seamless looping and user-friendly volume controls, building on the AudioManager foundation to provide an immersive gaming experience.

## Description
Create the background music system that uses HTML5 Audio for reliable music playback with seamless looping capabilities. Implement user controls for volume adjustment and mute functionality, integrated with the existing AudioManager. This includes the UI components for audio controls and the integration with the game page.

## Acceptance Criteria Covered
- GIVEN background music WHEN playing THEN loops seamlessly without gaps
- GIVEN audio controls WHEN used THEN volume adjusts correctly
- GIVEN mute control WHEN activated THEN background music stops immediately
- GIVEN background music WHEN starting THEN volume level is comfortable and not overwhelming

## Implementation Notes

### Background Music System
```typescript
interface MusicManager {
  currentTrack: HTMLAudioElement | null;
  trackQueue: string[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  
  loadTrack(src: string): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  setVolume(volume: number): void;
  setLoop(loop: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
}
```

### Audio Controls Component Design
- Volume slider with real-time visual feedback
- Mute/unmute toggle button with state indication
- Audio availability indicator
- Responsive design for mobile and desktop
- Accessibility support with ARIA labels

### Seamless Looping Implementation
- Use HTML5 Audio loop property for automatic looping
- Handle loop transition smoothly without gaps
- Implement crossfade between tracks (future enhancement)
- Monitor for playback errors and recovery

## Technical Specifications

### File Targets

#### New Files
- `src/lib/audio/MusicManager.ts` - Background music management class
- `src/components/audio/AudioControls.tsx` - Audio control UI component
- `src/components/audio/VolumeSlider.tsx` - Volume control slider component
- `src/components/audio/MuteButton.tsx` - Mute toggle button component
- `src/hooks/useAudio.ts` - React hook for audio state management
- `public/audio/music/background-music.mp3` - Background music asset

#### Modified Files
- `src/lib/audio/AudioManager.ts` - Add music management integration
- `src/pages/game.tsx` - Integrate audio controls and music playback
- `src/components/layout/Layout.tsx` - Add global audio controls

### Component Specs
```typescript
// MusicManager class extending AudioManager functionality
class MusicManager {
  private audioManager: AudioManager;
  private currentMusic: HTMLAudioElement | null = null;
  private musicGainNode: GainNode | null = null;
  
  constructor(audioManager: AudioManager);
  async loadBackgroundMusic(src: string): Promise<void>;
  async playMusic(): Promise<void>;
  pauseMusic(): void;
  stopMusic(): void;
  setMusicVolume(volume: number): void;
  getMusicState(): MusicState;
}

// AudioControls component interface
interface AudioControlsProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  disabled?: boolean;
}

// VolumeSlider component interface
interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  'aria-label'?: string;
}

// MuteButton component interface
interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  'aria-label'?: string;
}
```

### Game Integration Points
```typescript
// Game page integration
const GamePage: React.FC = () => {
  const { audioManager, playBackgroundMusic, pauseMusic } = useAudio();
  
  useEffect(() => {
    // Start background music when game page loads
    playBackgroundMusic('/audio/music/background-music.mp3');
    
    return () => {
      // Cleanup when leaving game page
      pauseMusic();
    };
  }, []);
  
  return (
    <div className="game-page">
      <AudioControls className="game-audio-controls" />
      <GameCanvas />
    </div>
  );
};
```

### DTO Definitions
```typescript
// Music state information
interface MusicState {
  isLoaded: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  track: string | null;
  error: string | null;
}

// Audio control events
interface AudioControlEvent {
  type: 'volume' | 'mute' | 'play' | 'pause';
  value?: number;
  timestamp: number;
}
```

### CSS Styling Framework
```css
/* Audio controls styling */
.audio-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.volume-slider {
  width: 100px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  position: relative;
  cursor: pointer;
}

.volume-slider__track {
  height: 100%;
  background: #4CAF50;
  border-radius: inherit;
  transition: width 0.1s ease;
}

.mute-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.mute-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mute-button--muted {
  color: #f44336;
}
```

## Testing Requirements

### Unit Tests
- MusicManager initialization and track loading
- Volume control functionality and range validation
- Mute/unmute state management
- Audio controls component rendering and interaction
- Seamless looping verification

### Integration Tests
- Background music starts when game page loads
- Volume changes reflect in actual audio playback
- Mute functionality stops audio immediately
- Settings persistence across page reloads
- Integration with existing AudioManager

### E2E Scenarios
- Complete game session with background music
- Volume adjustments during gameplay
- Mute/unmute during active gameplay
- Page navigation with music state preservation
- Mobile device audio control interaction

## Dependencies

### Prerequisite Tasks
- **4.1.1** (Audio Manager Core Implementation) - Core audio infrastructure required

### Blocking Tasks
- None - Can proceed after 4.1.1 completion

### External Dependencies
- Background music audio file (MP3 format)
- HTML5 Audio API support
- CSS3 for styling and animations

## Risks and Considerations

### Technical Risks
- **Audio Loading Delays**: Large music files may cause loading delays
  - *Mitigation*: Optimize audio file size, implement loading indicators
  
- **Seamless Looping Gaps**: Some browsers may have small gaps in audio loops
  - *Mitigation*: Use HTML5 Audio loop property, test across browsers
  
- **Mobile Audio Restrictions**: iOS and Android have specific audio limitations
  - *Mitigation*: Test on actual devices, implement touch-based audio triggers

### Implementation Challenges
- **Volume Control Precision**: Ensuring smooth volume transitions
  - *Mitigation*: Use gain nodes for precise volume control
  
- **UI Responsiveness**: Controls must work well on touch devices
  - *Mitigation*: Implement touch-friendly controls with appropriate sizing
  
- **Performance Impact**: Background music shouldn't affect game performance
  - *Mitigation*: Profile audio performance, optimize audio processing

### Mitigation Strategies
- Compress audio files appropriately for web delivery
- Implement progressive loading for large audio assets
- Test audio controls on various device types and screen sizes
- Provide visual feedback for all audio state changes
- Implement proper error handling for audio loading failures

## Definition of Done
- [ ] MusicManager class implemented with full functionality
- [ ] Background music loads and plays automatically on game page
- [ ] Seamless looping implemented without audible gaps
- [ ] Volume control slider working with real-time feedback
- [ ] Mute button toggles audio state correctly
- [ ] Audio controls responsive on mobile and desktop
- [ ] Settings persistence working across sessions
- [ ] Accessibility features implemented (ARIA labels, keyboard support)
- [ ] CSS styling consistent with game design
- [ ] Integration with game page complete
- [ ] Error handling for audio loading and playback
- [ ] Performance testing shows no negative impact on gameplay

## Implementation Strategy
1. **Phase 1**: MusicManager class implementation and HTML5 Audio integration
2. **Phase 2**: Basic audio controls UI components (volume, mute)
3. **Phase 3**: Game page integration and automatic music playback
4. **Phase 4**: Responsive design and mobile optimization
5. **Phase 5**: Testing, polish, and performance validation

This task creates the user-facing music experience that enhances gameplay immersion while providing intuitive controls for personalization.
````