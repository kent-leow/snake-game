# Task: Game State Management System

## Task Header
- **ID**: T-1.6.1
- **Title**: Implement comprehensive game state management system
- **Story ID**: US-1.6
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 2-3 hours
- **Complexity**: moderate

## Task Content

### Objective
Create a robust game state management system that handles all game states (playing, paused, game-over, menu) with proper transitions, state persistence, and integration with React components.

### Description
Build a centralized state management system that coordinates all game states, ensures proper state transitions, and provides a clean API for components to interact with game state while maintaining consistency and preventing invalid state combinations.

### Acceptance Criteria Covered
- GIVEN main menu or game page WHEN user clicks "Start Game" THEN new game begins
- GIVEN active game WHEN user clicks "Pause" or presses spacebar THEN game pauses
- GIVEN paused game WHEN user clicks "Resume" or presses spacebar THEN game resumes
- GIVEN any game state WHEN user clicks "Restart" THEN game resets to beginning
- GIVEN paused state WHEN user pauses THEN snake movement stops immediately
- GIVEN resumed state WHEN user resumes THEN snake continues from exact pause position

### Implementation Notes
1. Design comprehensive game state enum and management
2. Implement state transition logic with validation
3. Create React hooks for state management
4. Add state persistence for pause/resume functionality
5. Integrate with existing game systems (movement, collision, scoring)

## Technical Specs

### File Targets
**New Files:**
- `src/lib/game/gameState.ts` - Core game state management
- `src/lib/game/stateTransitions.ts` - State transition logic
- `src/hooks/useGameState.ts` - React game state hook
- `src/hooks/useGamePersistence.ts` - State persistence hook
- `src/lib/game/gameStateMachine.ts` - State machine implementation

**Modified Files:**
- `src/lib/game/gameEngine.ts` - Integrate state management
- `src/components/game/GameCanvas.tsx` - Use state management
- `src/lib/game/types.ts` - Add state management types
- `src/lib/game/constants.ts` - Add state-related constants

**Test Files:**
- `src/lib/game/__tests__/gameState.test.ts` - State management tests
- `src/lib/game/__tests__/stateTransitions.test.ts` - Transition tests
- `src/hooks/__tests__/useGameState.test.ts` - Hook tests

### Game State Types and Management
```typescript
// Game state enumeration
export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  LOADING = 'loading'
}

// Extended game state with data
interface GameStateData {
  state: GameState;
  snake: Snake;
  food: Food | null;
  score: number;
  gameStartTime: number;
  pausedTime: number;
  totalPausedDuration: number;
  gameStats: GameStatistics;
}

// Game state manager class
export class GameStateManager {
  private currentState: GameState = GameState.MENU;
  private gameData: GameStateData;
  private stateHistory: GameState[] = [];
  private callbacks: Map<GameState, Array<(data: GameStateData) => void>> = new Map();
  private transitionCallbacks: Array<(from: GameState, to: GameState) => void> = [];

  constructor() {
    this.initializeGameData();
  }

  private initializeGameData(): void {
    this.gameData = {
      state: GameState.MENU,
      snake: this.createInitialSnake(),
      food: null,
      score: 0,
      gameStartTime: 0,
      pausedTime: 0,
      totalPausedDuration: 0,
      gameStats: {
        duration: 0,
        foodConsumed: 0,
        maxSnakeLength: 3,
        averageSpeed: 0
      }
    };
  }

  public getCurrentState(): GameState {
    return this.currentState;
  }

  public getGameData(): GameStateData {
    return { ...this.gameData };
  }

  public transitionTo(newState: GameState): boolean {
    if (!this.isValidTransition(this.currentState, newState)) {
      console.warn(`Invalid state transition from ${this.currentState} to ${newState}`);
      return false;
    }

    const previousState = this.currentState;
    this.currentState = newState;
    this.gameData.state = newState;
    this.stateHistory.push(newState);

    // Handle state-specific logic
    this.handleStateEntry(newState, previousState);

    // Notify transition callbacks
    this.transitionCallbacks.forEach(callback => 
      callback(previousState, newState)
    );

    // Notify state-specific callbacks
    const stateCallbacks = this.callbacks.get(newState) || [];
    stateCallbacks.forEach(callback => callback(this.gameData));

    return true;
  }

  private isValidTransition(from: GameState, to: GameState): boolean {
    const validTransitions: Record<GameState, GameState[]> = {
      [GameState.MENU]: [GameState.LOADING, GameState.PLAYING],
      [GameState.LOADING]: [GameState.PLAYING, GameState.MENU],
      [GameState.PLAYING]: [GameState.PAUSED, GameState.GAME_OVER, GameState.MENU],
      [GameState.PAUSED]: [GameState.PLAYING, GameState.MENU, GameState.GAME_OVER],
      [GameState.GAME_OVER]: [GameState.MENU, GameState.PLAYING]
    };

    return validTransitions[from]?.includes(to) || false;
  }

  private handleStateEntry(newState: GameState, previousState: GameState): void {
    switch (newState) {
      case GameState.PLAYING:
        if (previousState === GameState.MENU) {
          this.startNewGame();
        } else if (previousState === GameState.PAUSED) {
          this.resumeGame();
        }
        break;

      case GameState.PAUSED:
        this.pauseGame();
        break;

      case GameState.GAME_OVER:
        this.endGame();
        break;

      case GameState.MENU:
        this.resetGame();
        break;
    }
  }

  private startNewGame(): void {
    this.gameData.gameStartTime = Date.now();
    this.gameData.score = 0;
    this.gameData.snake = this.createInitialSnake();
    this.gameData.food = null;
    this.gameData.totalPausedDuration = 0;
    this.resetGameStats();
  }

  private pauseGame(): void {
    this.gameData.pausedTime = Date.now();
  }

  private resumeGame(): void {
    if (this.gameData.pausedTime > 0) {
      this.gameData.totalPausedDuration += Date.now() - this.gameData.pausedTime;
      this.gameData.pausedTime = 0;
    }
  }

  private endGame(): void {
    this.updateFinalGameStats();
  }

  private resetGame(): void {
    this.initializeGameData();
  }

  private createInitialSnake(): Snake {
    // Implementation depends on Snake class from previous tasks
    return {
      segments: [
        { x: 200, y: 200, id: 'head' },
        { x: 180, y: 200, id: 'body-1' },
        { x: 160, y: 200, id: 'body-2' }
      ],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      isGrowing: false
    };
  }

  private resetGameStats(): void {
    this.gameData.gameStats = {
      duration: 0,
      foodConsumed: 0,
      maxSnakeLength: 3,
      averageSpeed: 0
    };
  }

  private updateFinalGameStats(): void {
    const totalTime = Date.now() - this.gameData.gameStartTime - this.gameData.totalPausedDuration;
    this.gameData.gameStats.duration = Math.floor(totalTime / 1000);
  }

  // Subscription methods
  public onStateChange(state: GameState, callback: (data: GameStateData) => void): () => void {
    if (!this.callbacks.has(state)) {
      this.callbacks.set(state, []);
    }
    this.callbacks.get(state)!.push(callback);

    return () => {
      const callbacks = this.callbacks.get(state);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  public onStateTransition(callback: (from: GameState, to: GameState) => void): () => void {
    this.transitionCallbacks.push(callback);

    return () => {
      const index = this.transitionCallbacks.indexOf(callback);
      if (index > -1) {
        this.transitionCallbacks.splice(index, 1);
      }
    };
  }

  // Convenience methods
  public isPlaying(): boolean {
    return this.currentState === GameState.PLAYING;
  }

  public isPaused(): boolean {
    return this.currentState === GameState.PAUSED;
  }

  public isGameOver(): boolean {
    return this.currentState === GameState.GAME_OVER;
  }

  public canPause(): boolean {
    return this.currentState === GameState.PLAYING;
  }

  public canResume(): boolean {
    return this.currentState === GameState.PAUSED;
  }
}
```

### React Hook for Game State
```typescript
// useGameState hook for React components
interface UseGameStateOptions {
  onStateChange?: (state: GameState, data: GameStateData) => void;
  onTransition?: (from: GameState, to: GameState) => void;
}

export const useGameState = ({ onStateChange, onTransition }: UseGameStateOptions = {}) => {
  const [currentState, setCurrentState] = useState<GameState>(GameState.MENU);
  const [gameData, setGameData] = useState<GameStateData | null>(null);
  const stateManagerRef = useRef<GameStateManager>(new GameStateManager());

  useEffect(() => {
    const stateManager = stateManagerRef.current;

    // Subscribe to all state changes
    const unsubscribers = Object.values(GameState).map(state => 
      stateManager.onStateChange(state, (data) => {
        setCurrentState(data.state);
        setGameData(data);
        onStateChange?.(data.state, data);
      })
    );

    // Subscribe to transitions
    const transitionUnsubscriber = stateManager.onStateTransition((from, to) => {
      onTransition?.(from, to);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      transitionUnsubscriber();
    };
  }, [onStateChange, onTransition]);

  const actions = useMemo(() => ({
    startGame: () => stateManagerRef.current.transitionTo(GameState.PLAYING),
    pauseGame: () => stateManagerRef.current.transitionTo(GameState.PAUSED),
    resumeGame: () => stateManagerRef.current.transitionTo(GameState.PLAYING),
    endGame: () => stateManagerRef.current.transitionTo(GameState.GAME_OVER),
    goToMenu: () => stateManagerRef.current.transitionTo(GameState.MENU),
    restartGame: () => {
      stateManagerRef.current.transitionTo(GameState.MENU);
      setTimeout(() => stateManagerRef.current.transitionTo(GameState.PLAYING), 100);
    }
  }), []);

  const selectors = useMemo(() => ({
    isPlaying: currentState === GameState.PLAYING,
    isPaused: currentState === GameState.PAUSED,
    isGameOver: currentState === GameState.GAME_OVER,
    isMenu: currentState === GameState.MENU,
    canPause: stateManagerRef.current.canPause(),
    canResume: stateManagerRef.current.canResume()
  }), [currentState]);

  return {
    currentState,
    gameData,
    actions,
    selectors,
    stateManager: stateManagerRef.current
  };
};
```

### State Persistence Hook
```typescript
// useGamePersistence hook for state persistence during pause
interface GamePersistenceData {
  snake: Snake;
  food: Food | null;
  score: number;
  timestamp: number;
}

export const useGamePersistence = () => {
  const saveGameState = useCallback((data: GameStateData): void => {
    const persistenceData: GamePersistenceData = {
      snake: data.snake,
      food: data.food,
      score: data.score,
      timestamp: Date.now()
    };

    localStorage.setItem('snake-game-state', JSON.stringify(persistenceData));
  }, []);

  const loadGameState = useCallback((): GamePersistenceData | null => {
    try {
      const saved = localStorage.getItem('snake-game-state');
      if (!saved) return null;

      const data = JSON.parse(saved) as GamePersistenceData;
      
      // Check if saved state is not too old (e.g., 1 hour)
      const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
      if (Date.now() - data.timestamp > maxAge) {
        localStorage.removeItem('snake-game-state');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load game state:', error);
      localStorage.removeItem('snake-game-state');
      return null;
    }
  }, []);

  const clearSavedState = useCallback((): void => {
    localStorage.removeItem('snake-game-state');
  }, []);

  return {
    saveGameState,
    loadGameState,
    clearSavedState
  };
};
```

## Testing Requirements

### Unit Tests
- Game state transitions and validation
- State manager subscription system
- State persistence and loading
- Invalid transition handling

### Integration Tests
- State management integration with game loop
- React hook integration with components
- State persistence across browser sessions

### E2E Scenarios
- Complete game state flow from menu to game over
- Pause and resume functionality during gameplay
- State persistence and recovery

## Dependencies

### Prerequisite Tasks
- T-1.3.1 (Game Canvas and Snake Structure)
- T-1.3.2 (Keyboard Input and Movement Logic)
- T-1.4.2 (Snake Growth and Scoring)

### Blocking Tasks
- None

### External Dependencies
- React hooks for component integration
- LocalStorage for state persistence

## Risks and Considerations

### Technical Risks
- State synchronization issues between components
- Memory leaks from subscription callbacks
- State persistence corruption or conflicts

### Implementation Challenges
- Complex state transition validation
- Timing issues with pause/resume functionality
- Integration with existing game systems

### Mitigation Strategies
- Comprehensive state transition testing
- Proper cleanup of subscriptions in useEffect
- Robust error handling for state persistence
- Clear state machine design documentation

---

**Estimated Duration**: 2-3 hours  
**Risk Level**: Medium  
**Dependencies**: T-1.3.1, T-1.3.2, T-1.4.2  
**Output**: Comprehensive game state management system with React integration and persistence