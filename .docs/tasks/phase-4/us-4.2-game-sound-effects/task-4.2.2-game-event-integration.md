````markdown
# Task: Game Event Audio Integration

## Task Header

- **ID**: 4.2.2
- **Title**: Game Event Audio Integration
- **Story ID**: US-4.2
- **Type**: frontend
- **Priority**: high
- **Effort Estimate**: 4-6 hours
- **Complexity**: moderate

## Objective

Integrate the sound effect system with game events to provide immediate audio feedback for player actions, creating a responsive and engaging gaming experience through well-timed audio cues that correspond to gameplay mechanics.

## Description

Connect the sound effect system to specific game events including food consumption, combo completion, and game over scenarios. Implement an event-driven audio system that triggers appropriate sounds based on game state changes while maintaining clean separation between game logic and audio implementation.

## Acceptance Criteria Covered

- GIVEN snake eats food block WHEN consumption occurs THEN appropriate eating sound plays
- GIVEN combo completed WHEN sequence 1→2→3→4→5 finishes THEN combo achievement sound plays
- GIVEN game over WHEN collision occurs THEN game over sound effect plays
- GIVEN eating sound WHEN played THEN provides satisfying feedback for successful action

## Implementation Notes

### Event-Driven Audio Architecture

```typescript
interface GameAudioEvents {
  // Game progression events
  onGameStart(): void;
  onGamePause(): void;
  onGameResume(): void;
  onGameOver(gameOverData: GameOverData): void;

  // Gameplay events
  onFoodEaten(foodData: FoodEatenData): void;
  onComboCompleted(comboData: ComboData): void;
  onSnakeMove(): void; // Optional for movement audio

  // UI events
  onMenuNavigation(): void;
  onButtonClick(): void;
  onSettingsChange(): void;
}

interface FoodEatenData {
  foodType: FoodType;
  foodNumber: number;
  score: number;
  snakeLength: number;
}

interface ComboData {
  comboLevel: number;
  bonusPoints: number;
  sequenceCompleted: number[];
  totalCombos: number;
}

interface GameOverData {
  finalScore: number;
  cause: 'wall-collision' | 'self-collision';
  gameTime: number;
  totalCombos: number;
}
```

### Game Engine Integration

```typescript
// Game engine audio event emitter
class GameAudioEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, data?: any): void;
  removeAllListeners(event?: string): void;
}

// Integration with existing game engine
class GameEngine {
  private audioEventEmitter: GameAudioEventEmitter;

  constructor() {
    this.audioEventEmitter = new GameAudioEventEmitter();
  }

  // Modified food consumption logic
  private consumeFood(foodIndex: number): void {
    const food = this.foods[foodIndex];

    // Existing game logic...
    this.updateScore(food.points);
    this.growSnake();

    // New audio event emission
    this.audioEventEmitter.emit('foodEaten', {
      foodType: food.type,
      foodNumber: food.number,
      score: this.score,
      snakeLength: this.snake.body.length,
    });

    // Check for combo completion
    if (this.isComboCompleted()) {
      this.audioEventEmitter.emit('comboCompleted', {
        comboLevel: this.currentCombo,
        bonusPoints: this.calculateComboBonus(),
        sequenceCompleted: this.getCompletedSequence(),
        totalCombos: this.totalCombos,
      });
    }
  }

  // Modified collision detection
  private checkCollisions(): boolean {
    if (this.hasCollision()) {
      this.audioEventEmitter.emit('gameOver', {
        finalScore: this.score,
        cause: this.getCollisionType(),
        gameTime: this.getGameTime(),
        totalCombos: this.totalCombos,
      });
      return true;
    }
    return false;
  }
}
```

### Audio Event Handler Implementation

```typescript
class GameAudioHandler {
  private soundEffectManager: SoundEffectManager;
  private gameEventEmitter: GameAudioEventEmitter;

  constructor(
    soundEffectManager: SoundEffectManager,
    gameEventEmitter: GameAudioEventEmitter
  ) {
    this.soundEffectManager = soundEffectManager;
    this.gameEventEmitter = gameEventEmitter;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.gameEventEmitter.on('foodEaten', this.handleFoodEaten.bind(this));
    this.gameEventEmitter.on(
      'comboCompleted',
      this.handleComboCompleted.bind(this)
    );
    this.gameEventEmitter.on('gameOver', this.handleGameOver.bind(this));
  }

  private handleFoodEaten(data: FoodEatenData): void {
    // Play eating sound with slight volume variation
    const volume = 0.7 + Math.random() * 0.3; // 0.7-1.0 range
    this.soundEffectManager.playSound(SoundId.EAT_FOOD, { volume });
  }

  private handleComboCompleted(data: ComboData): void {
    // Play combo sound with intensity based on combo level
    const volume = Math.min(1.0, 0.6 + data.comboLevel * 0.1);
    this.soundEffectManager.playSound(SoundId.COMBO_COMPLETE, { volume });
  }

  private handleGameOver(data: GameOverData): void {
    // Stop all other sounds and play game over sound
    this.soundEffectManager.stopAllSounds();
    this.soundEffectManager.playSound(SoundId.GAME_OVER);
  }
}
```

### React Component Integration

```typescript
// Game canvas component with audio integration
const GameCanvas: React.FC = () => {
  const { audioManager } = useAudio();
  const gameEngineRef = useRef<GameEngine | null>(null);
  const audioHandlerRef = useRef<GameAudioHandler | null>(null);

  useEffect(() => {
    if (!audioManager || !gameEngineRef.current) return;

    // Initialize audio event handler
    audioHandlerRef.current = new GameAudioHandler(
      audioManager.soundEffects,
      gameEngineRef.current.audioEventEmitter
    );

    return () => {
      audioHandlerRef.current?.cleanup();
    };
  }, [audioManager]);

  // Game rendering and update logic...

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onKeyDown={handleKeyDown}
    />
  );
};

// Game page with audio integration
const GamePage: React.FC = () => {
  const { playSound } = useSoundEffects();

  const handleGameStart = useCallback(() => {
    // Optional: Play game start sound
    playSound(SoundId.MENU_CLICK);
  }, [playSound]);

  return (
    <div className="game-page">
      <GameCanvas />
      <button onClick={handleGameStart}>Start Game</button>
    </div>
  );
};
```

## Technical Specifications

### File Targets

#### New Files

- `src/lib/game/GameAudioEventEmitter.ts` - Event emitter for game audio events
- `src/lib/audio/GameAudioHandler.ts` - Game event to audio mapping
- `src/hooks/useGameAudio.ts` - React hook for game audio integration

#### Modified Files

- `src/lib/game/GameEngine.ts` - Add audio event emission to game logic
- `src/components/game/GameCanvas.tsx` - Integrate audio event handling
- `src/pages/game.tsx` - Setup audio event system
- `src/lib/game/SnakeGame.ts` - Add audio events to game state changes

### Event System Architecture

```typescript
// Centralized game audio event system
class GameAudioEventSystem {
  private eventEmitter: GameAudioEventEmitter;
  private audioHandler: GameAudioHandler;
  private soundEffectManager: SoundEffectManager;

  constructor(soundEffectManager: SoundEffectManager);

  initialize(): void;
  attachToGameEngine(gameEngine: GameEngine): void;
  detachFromGameEngine(): void;
  enableAudioEvents(): void;
  disableAudioEvents(): void;
  getEventStats(): AudioEventStats;
}

// Event timing and performance tracking
interface AudioEventStats {
  totalEvents: number;
  eventCounts: Record<string, number>;
  averageLatency: number;
  missedEvents: number;
  lastEventTime: number;
}
```

### Game Logic Integration Points

```typescript
// Specific integration points in game logic
const gameAudioIntegrationPoints = {
  // Food consumption in game loop
  consumeFood: {
    location: 'GameEngine.consumeFood()',
    event: 'foodEaten',
    timing: 'after score update, before visual effects',
  },

  // Combo completion detection
  comboComplete: {
    location: 'ComboSystem.checkComboCompletion()',
    event: 'comboCompleted',
    timing: 'immediately when sequence 1-5 completed',
  },

  // Game over scenarios
  gameOver: {
    location: 'GameEngine.checkCollisions()',
    event: 'gameOver',
    timing: 'before game state change to game-over',
  },

  // Optional: Snake movement (future enhancement)
  snakeMove: {
    location: 'GameEngine.updateSnakePosition()',
    event: 'snakeMove',
    timing: 'after position update, throttled',
  },
};
```

### Audio Timing and Synchronization

```typescript
// Ensure audio events synchronize properly with visual events
class AudioTimingManager {
  private eventQueue: Array<{
    event: string;
    data: any;
    scheduledTime: number;
  }> = [];

  scheduleAudioEvent(event: string, data: any, delay: number = 0): void;
  processScheduledEvents(): void;
  clearEventQueue(): void;
  getQueueLength(): number;
}
```

## Testing Requirements

### Unit Tests

- Game audio event emitter functionality
- Audio event handler response to different game events
- Event timing and synchronization
- Audio event data validation
- Integration with sound effect system

### Integration Tests

- Game engine to audio system integration
- React component audio event handling
- Event system performance under rapid game events
- Audio event cleanup and memory management
- Sound effect triggering accuracy

### E2E Scenarios

- Complete game session with all audio events
- Rapid food consumption with audio feedback
- Combo completion audio timing validation
- Game over audio behavior testing
- Audio event behavior during game pause/resume

### Game-Specific Test Scenarios

```javascript
const gameAudioTestScenarios = [
  {
    name: 'rapid_food_consumption',
    setup: 'Position snake to eat food quickly',
    action: 'Eat 5 food items within 2 seconds',
    expected: 'Each food consumption triggers eat sound without overlap issues',
  },
  {
    name: 'combo_completion_timing',
    setup: 'Set up combo sequence 1-4',
    action: 'Eat food #5 to complete combo',
    expected: 'Combo sound plays immediately after #5 consumption',
  },
  {
    name: 'game_over_audio_priority',
    setup: 'Snake near collision while eating',
    action: 'Trigger collision during food consumption',
    expected: 'Game over sound plays, other sounds stop',
  },
  {
    name: 'pause_resume_audio_state',
    setup: 'Game playing with active sounds',
    action: 'Pause and resume game',
    expected: 'Audio events resume correctly after unpause',
  },
];
```

## Dependencies

### Prerequisite Tasks

- **4.2.1** (Sound Effect System Implementation) - Sound system foundation required
- **4.1.1** (Audio Manager Core Implementation) - Audio infrastructure needed

### Blocking Tasks

- None - Can proceed after sound effect system is ready

### External Dependencies

- Existing game engine with modifiable event points
- React component structure for integration
- Game state management system

## Risks and Considerations

### Technical Risks

- **Event Timing Issues**: Audio events may not synchronize perfectly with visual events
  - _Mitigation_: Implement event scheduling and timing validation
- **Rapid Event Handling**: Fast gameplay may trigger many audio events quickly
  - _Mitigation_: Implement event throttling and priority management
- **Game Logic Coupling**: Tight coupling between game and audio could complicate maintenance
  - _Mitigation_: Use event-driven architecture for loose coupling

### Implementation Challenges

- **Integration Complexity**: Adding audio events to existing game logic
  - _Mitigation_: Identify clear integration points and minimize code changes
- **Performance Impact**: Audio event processing could affect game performance
  - _Mitigation_: Profile audio event handling and optimize hot paths
- **Event Reliability**: Ensuring audio events fire consistently for all game actions
  - _Mitigation_: Comprehensive testing and event validation

### Mitigation Strategies

- Use event emitter pattern to decouple audio from game logic
- Implement audio event validation and error handling
- Test audio integration with automated game scenarios
- Monitor performance impact of audio event processing
- Provide configuration options to disable audio events if needed

## Definition of Done

- [ ] Game audio event emitter implemented and integrated
- [ ] Audio event handlers responding to all game events
- [ ] Food consumption audio triggers correctly
- [ ] Combo completion audio timing is accurate
- [ ] Game over audio behavior implemented
- [ ] React component integration complete
- [ ] Event system performance validated
- [ ] Audio event synchronization with visual events verified
- [ ] Error handling for audio event failures
- [ ] Game logic integration is clean and maintainable
- [ ] Cross-browser audio event compatibility confirmed
- [ ] Performance impact minimal on game loop

## Implementation Strategy

1. **Phase 1**: Implement game audio event emitter and basic event structure
2. **Phase 2**: Integrate audio events into existing game engine logic
3. **Phase 3**: Create audio event handlers for all game scenarios
4. **Phase 4**: React component integration and state management
5. **Phase 5**: Testing, optimization, and performance validation

This task creates the responsive audio feedback system that makes the game feel more engaging and provides immediate confirmation of player actions through well-timed sound effects.
````
