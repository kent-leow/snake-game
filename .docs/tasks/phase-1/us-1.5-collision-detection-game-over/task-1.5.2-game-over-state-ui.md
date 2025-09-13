# Task: Game Over State and UI Implementation

## Task Header
- **ID**: T-1.5.2
- **Title**: Implement game over state management and UI components
- **Story ID**: US-1.5
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 2 hours
- **Complexity**: simple

## Task Content

### Objective
Create game over state management system and user interface components that provide clear feedback when the game ends and offer intuitive options for restarting or returning to the main menu.

### Description
Build the complete game over experience including state management, UI components, and user flow that handles game termination gracefully and encourages replay through clear visual design and accessible controls.

### Acceptance Criteria Covered
- GIVEN game over WHEN it occurs THEN game loop stops and no further movement happens
- GIVEN game over WHEN it occurs THEN clear "Game Over" message displays
- GIVEN game over screen WHEN shown THEN final score is prominently displayed
- GIVEN game over screen WHEN shown THEN restart and menu options are clearly visible
- GIVEN collision moment WHEN it happens THEN visual feedback indicates the collision point

### Implementation Notes
1. Create game over state management in game engine
2. Design and implement game over UI component
3. Add visual feedback for collision moment
4. Implement restart and navigation functionality
5. Ensure proper cleanup and state reset

## Technical Specs

### File Targets
**New Files:**
- `src/components/game/GameOverModal.tsx` - Game over UI component
- `src/components/game/CollisionFeedback.tsx` - Visual collision feedback
- `src/lib/game/gameOverState.ts` - Game over state management
- `src/hooks/useGameOver.ts` - Game over management hook
- `src/styles/gameOver.css` - Game over specific styles

**Modified Files:**
- `src/lib/game/gameEngine.ts` - Integrate game over state
- `src/components/game/GameCanvas.tsx` - Add game over integration
- `src/lib/game/types.ts` - Add game over types
- `src/styles/game.css` - Add game over styling

**Test Files:**
- `src/components/__tests__/GameOverModal.test.tsx` - Game over UI tests
- `src/lib/game/__tests__/gameOverState.test.ts` - State management tests

### Game Over State Management
```typescript
// Game over state types
interface GameOverState {
  isGameOver: boolean;
  cause: 'boundary' | 'self' | null;
  finalScore: number;
  collisionPosition?: Position;
  timestamp: number;
  gameStats?: GameStatistics;
}

interface GameStatistics {
  duration: number; // Game duration in seconds
  foodConsumed: number;
  maxSnakeLength: number;
  averageSpeed: number;
}

// Game over state manager
export class GameOverManager {
  private gameOverState: GameOverState;
  private callbacks: Array<(state: GameOverState) => void> = [];

  constructor() {
    this.gameOverState = {
      isGameOver: false,
      cause: null,
      finalScore: 0,
      timestamp: 0
    };
  }

  public triggerGameOver(
    cause: 'boundary' | 'self',
    finalScore: number,
    collisionPosition?: Position,
    gameStats?: GameStatistics
  ): void {
    this.gameOverState = {
      isGameOver: true,
      cause,
      finalScore,
      collisionPosition,
      timestamp: Date.now(),
      gameStats
    };

    // Notify all subscribers
    this.callbacks.forEach(callback => callback(this.gameOverState));
  }

  public resetGameOver(): void {
    this.gameOverState = {
      isGameOver: false,
      cause: null,
      finalScore: 0,
      timestamp: 0
    };

    // Notify subscribers of reset
    this.callbacks.forEach(callback => callback(this.gameOverState));
  }

  public getGameOverState(): GameOverState {
    return { ...this.gameOverState };
  }

  public subscribe(callback: (state: GameOverState) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  public isGameOver(): boolean {
    return this.gameOverState.isGameOver;
  }
}
```

### Game Over Modal Component
```typescript
// Game Over Modal React component
interface GameOverModalProps {
  isVisible: boolean;
  finalScore: number;
  cause: 'boundary' | 'self' | null;
  gameStats?: GameStatistics;
  onRestart: () => void;
  onMainMenu: () => void;
  className?: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVisible,
  finalScore,
  cause,
  gameStats,
  onRestart,
  onMainMenu,
  className
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const getCauseMessage = (cause: 'boundary' | 'self' | null): string => {
    switch (cause) {
      case 'boundary':
        return 'You hit the wall!';
      case 'self':
        return 'You hit yourself!';
      default:
        return 'Game Over!';
    }
  };

  const handleRestart = () => {
    setIsAnimating(false);
    setTimeout(onRestart, 150); // Small delay for animation
  };

  const handleMainMenu = () => {
    setIsAnimating(false);
    setTimeout(onMainMenu, 150);
  };

  if (!isVisible) return null;

  return (
    <div className={`game-over-overlay ${isAnimating ? 'animate-in' : ''}`}>
      <div className={`game-over-modal ${className || ''}`}>
        <div className="game-over-header">
          <h2 className="game-over-title">Game Over!</h2>
          <p className="game-over-cause">{getCauseMessage(cause)}</p>
        </div>

        <div className="game-over-score">
          <div className="final-score">
            <span className="score-label">Final Score</span>
            <span className="score-value">{finalScore.toLocaleString()}</span>
          </div>
        </div>

        {gameStats && (
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-label">Duration</span>
              <span className="stat-value">{Math.floor(gameStats.duration / 60)}:{(gameStats.duration % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Food Eaten</span>
              <span className="stat-value">{gameStats.foodConsumed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max Length</span>
              <span className="stat-value">{gameStats.maxSnakeLength}</span>
            </div>
          </div>
        )}

        <div className="game-over-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleRestart}
            autoFocus
          >
            Play Again
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleMainMenu}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Collision Feedback Component
```typescript
// Visual collision feedback component
interface CollisionFeedbackProps {
  position?: Position;
  type: 'boundary' | 'self' | null;
  onAnimationComplete: () => void;
}

export const CollisionFeedback: React.FC<CollisionFeedbackProps> = ({
  position,
  type,
  onAnimationComplete
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationComplete();
    }, 500); // Animation duration

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  if (!position || !isVisible) return null;

  return (
    <div 
      className={`collision-feedback collision-${type}`}
      style={{
        left: position.x,
        top: position.y,
        position: 'absolute',
        pointerEvents: 'none'
      }}
    >
      <div className="collision-ripple" />
      <div className="collision-flash" />
    </div>
  );
};
```

### Game Over Hook
```typescript
// React hook for game over management
interface UseGameOverOptions {
  onGameOver?: (state: GameOverState) => void;
  onRestart?: () => void;
}

export const useGameOver = ({ onGameOver, onRestart }: UseGameOverOptions = {}) => {
  const [gameOverState, setGameOverState] = useState<GameOverState>({
    isGameOver: false,
    cause: null,
    finalScore: 0,
    timestamp: 0
  });

  const gameOverManagerRef = useRef<GameOverManager>(new GameOverManager());

  useEffect(() => {
    const unsubscribe = gameOverManagerRef.current.subscribe((state) => {
      setGameOverState(state);
      onGameOver?.(state);
    });

    return unsubscribe;
  }, [onGameOver]);

  const triggerGameOver = useCallback((
    cause: 'boundary' | 'self',
    finalScore: number,
    collisionPosition?: Position,
    gameStats?: GameStatistics
  ) => {
    gameOverManagerRef.current.triggerGameOver(cause, finalScore, collisionPosition, gameStats);
  }, []);

  const resetGameOver = useCallback(() => {
    gameOverManagerRef.current.resetGameOver();
    onRestart?.();
  }, [onRestart]);

  return {
    gameOverState,
    triggerGameOver,
    resetGameOver,
    isGameOver: gameOverState.isGameOver
  };
};
```

### CSS Styling
```css
/* Game over modal styles */
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.game-over-overlay.animate-in {
  opacity: 1;
}

.game-over-modal {
  background: #1f2937;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  border: 2px solid #374151;
  transform: scale(0.8);
  animation: modalAppear 0.3s ease-out forwards;
}

@keyframes modalAppear {
  to {
    transform: scale(1);
  }
}

.collision-feedback {
  z-index: 999;
  animation: collisionPulse 0.5s ease-out;
}

@keyframes collisionPulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.7; }
  100% { transform: scale(2); opacity: 0; }
}
```

## Testing Requirements

### Unit Tests
- Game over state management functionality
- Game over modal component rendering
- Collision feedback visual effects
- State reset and cleanup

### Integration Tests
- Game over integration with collision detection
- Modal display and user interaction
- Navigation flow from game over to restart/menu

### E2E Scenarios
- Complete game over flow from collision to restart
- Game over modal accessibility and keyboard navigation
- Visual feedback timing and animation

## Dependencies

### Prerequisite Tasks
- T-1.5.1 (Collision Detection System)
- T-1.3.3 (Game Loop and Performance)
- T-1.4.2 (Snake Growth and Scoring)

### Blocking Tasks
- None

### External Dependencies
- React hooks for state management
- CSS animations for visual effects

## Risks and Considerations

### Technical Risks
- Modal z-index conflicts with other UI elements
- Animation performance on low-end devices
- State cleanup issues between games

### Implementation Challenges
- Proper timing of game over sequence
- Accessible keyboard navigation in modal
- Consistent visual feedback across devices

### Mitigation Strategies
- Use proper z-index hierarchy for modals
- Test animations on various devices
- Implement proper cleanup in useEffect hooks
- Add comprehensive accessibility attributes

---

**Estimated Duration**: 2 hours  
**Risk Level**: Low  
**Dependencies**: T-1.5.1, T-1.3.3, T-1.4.2  
**Output**: Complete game over experience with state management, UI, and user flow