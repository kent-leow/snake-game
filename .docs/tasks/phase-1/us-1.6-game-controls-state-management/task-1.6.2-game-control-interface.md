# Task: Game Control Interface and User Interaction

## Task Header

- **ID**: T-1.6.2
- **Title**: Implement game control interface and user interaction system
- **Story ID**: US-1.6
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 2 hours
- **Complexity**: simple

## Task Content

### Objective

Create an intuitive game control interface with buttons and keyboard shortcuts that provide clear visual feedback and seamless interaction for starting, pausing, resuming, and restarting the game.

### Description

Build user-friendly control components that integrate with the game state management system to provide accessible and responsive game controls with clear visual indicators of current game state and available actions.

### Acceptance Criteria Covered

- GIVEN control input WHEN button clicked THEN state change occurs within 100ms
- GIVEN keyboard shortcuts WHEN used THEN respond equivalently to button clicks
- GIVEN game controls WHEN displayed THEN buttons are clearly labeled and visible
- GIVEN current state WHEN viewing THEN user can identify if game is running/paused
- GIVEN paused state WHEN active THEN clear indication shows game is paused
- GIVEN mobile device WHEN using controls THEN buttons are appropriately sized for touch

### Implementation Notes

1. Create game control components with clear labeling and state indicators
2. Implement keyboard shortcuts (spacebar for pause/resume)
3. Add visual feedback and state-based button enabling/disabling
4. Ensure mobile-friendly touch targets and responsive design
5. Integrate with game state management system

## Technical Specs

### File Targets

**New Files:**

- `src/components/game/GameControls.tsx` - Main game controls component
- `src/components/game/ControlButton.tsx` - Reusable control button component
- `src/components/game/GameStateIndicator.tsx` - Game state visual indicator
- `src/components/game/KeyboardShortcuts.tsx` - Keyboard shortcut component
- `src/hooks/useKeyboardShortcuts.ts` - Keyboard shortcuts hook
- `src/styles/gameControls.css` - Game controls styling

**Modified Files:**

- `src/components/game/GameCanvas.tsx` - Integrate game controls
- `src/app/game/page.tsx` - Add controls to game page
- `src/styles/game.css` - Add control styling integration

**Test Files:**

- `src/components/__tests__/GameControls.test.tsx` - Game controls tests
- `src/components/__tests__/ControlButton.test.tsx` - Button component tests
- `src/hooks/__tests__/useKeyboardShortcuts.test.ts` - Keyboard tests

### Game Controls Component

```typescript
// Main game controls component
interface GameControlsProps {
  currentState: GameState;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onGoToMenu: () => void;
  className?: string;
  showKeyboardHints?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  currentState,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onRestartGame,
  onGoToMenu,
  className,
  showKeyboardHints = true
}) => {
  const isPlaying = currentState === GameState.PLAYING;
  const isPaused = currentState === GameState.PAUSED;
  const isGameOver = currentState === GameState.GAME_OVER;
  const isMenu = currentState === GameState.MENU;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPause: isPlaying ? onPauseGame : undefined,
    onResume: isPaused ? onResumeGame : undefined,
    onRestart: !isMenu ? onRestartGame : undefined,
    enabled: true
  });

  const getControlButtons = () => {
    switch (currentState) {
      case GameState.MENU:
        return (
          <ControlButton
            onClick={onStartGame}
            variant="primary"
            size="large"
            icon="🎮"
          >
            Start Game
          </ControlButton>
        );

      case GameState.PLAYING:
        return (
          <>
            <ControlButton
              onClick={onPauseGame}
              variant="secondary"
              icon="⏸️"
              shortcut="Space"
            >
              Pause
            </ControlButton>
            <ControlButton
              onClick={onRestartGame}
              variant="outline"
              icon="🔄"
              shortcut="R"
            >
              Restart
            </ControlButton>
            <ControlButton
              onClick={onGoToMenu}
              variant="outline"
              icon="🏠"
            >
              Menu
            </ControlButton>
          </>
        );

      case GameState.PAUSED:
        return (
          <>
            <ControlButton
              onClick={onResumeGame}
              variant="primary"
              icon="▶️"
              shortcut="Space"
            >
              Resume
            </ControlButton>
            <ControlButton
              onClick={onRestartGame}
              variant="secondary"
              icon="🔄"
              shortcut="R"
            >
              Restart
            </ControlButton>
            <ControlButton
              onClick={onGoToMenu}
              variant="outline"
              icon="🏠"
            >
              Menu
            </ControlButton>
          </>
        );

      case GameState.GAME_OVER:
        return (
          <>
            <ControlButton
              onClick={onRestartGame}
              variant="primary"
              size="large"
              icon="🔄"
            >
              Play Again
            </ControlButton>
            <ControlButton
              onClick={onGoToMenu}
              variant="secondary"
              icon="🏠"
            >
              Main Menu
            </ControlButton>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`game-controls ${className || ''}`}>
      <GameStateIndicator currentState={currentState} />

      <div className="controls-buttons">
        {getControlButtons()}
      </div>

      {showKeyboardHints && !isMenu && (
        <KeyboardShortcuts currentState={currentState} />
      )}
    </div>
  );
};
```

### Control Button Component

```typescript
// Reusable control button component
interface ControlButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  className?: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  children,
  onClick,
  variant = 'medium',
  size = 'medium',
  icon,
  shortcut,
  disabled = false,
  className
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;

    setIsPressed(true);
    onClick();

    // Visual feedback
    setTimeout(() => setIsPressed(false), 150);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      className={`
        control-button
        control-button--${variant}
        control-button--${size}
        ${isPressed ? 'control-button--pressed' : ''}
        ${disabled ? 'control-button--disabled' : ''}
        ${className || ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      type="button"
      aria-label={`${children}${shortcut ? ` (${shortcut})` : ''}`}
    >
      <span className="control-button__content">
        {icon && <span className="control-button__icon">{icon}</span>}
        <span className="control-button__text">{children}</span>
        {shortcut && (
          <span className="control-button__shortcut">{shortcut}</span>
        )}
      </span>
    </button>
  );
};
```

### Game State Indicator Component

```typescript
// Visual game state indicator
interface GameStateIndicatorProps {
  currentState: GameState;
  className?: string;
}

export const GameStateIndicator: React.FC<GameStateIndicatorProps> = ({
  currentState,
  className
}) => {
  const getStateInfo = (state: GameState) => {
    switch (state) {
      case GameState.MENU:
        return {
          label: 'Ready to Play',
          icon: '🎮',
          color: 'blue'
        };
      case GameState.PLAYING:
        return {
          label: 'Game Active',
          icon: '🐍',
          color: 'green'
        };
      case GameState.PAUSED:
        return {
          label: 'Game Paused',
          icon: '⏸️',
          color: 'yellow'
        };
      case GameState.GAME_OVER:
        return {
          label: 'Game Over',
          icon: '💀',
          color: 'red'
        };
      default:
        return {
          label: 'Loading',
          icon: '⏳',
          color: 'gray'
        };
    }
  };

  const stateInfo = getStateInfo(currentState);

  return (
    <div className={`game-state-indicator game-state-indicator--${stateInfo.color} ${className || ''}`}>
      <span className="game-state-indicator__icon">{stateInfo.icon}</span>
      <span className="game-state-indicator__label">{stateInfo.label}</span>
    </div>
  );
};
```

### Keyboard Shortcuts Hook

```typescript
// Keyboard shortcuts management hook
interface KeyboardShortcutsOptions {
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  onMenu?: () => void;
  enabled: boolean;
}

export const useKeyboardShortcuts = ({
  onPause,
  onResume,
  onRestart,
  onMenu,
  enabled,
}: KeyboardShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ': // Spacebar
          event.preventDefault();
          if (onPause) {
            onPause();
          } else if (onResume) {
            onResume();
          }
          break;

        case 'r':
          if (event.ctrlKey || event.metaKey) return; // Don't interfere with browser refresh
          event.preventDefault();
          onRestart?.();
          break;

        case 'escape':
          event.preventDefault();
          onMenu?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onPause, onResume, onRestart, onMenu, enabled]);
};
```

### Keyboard Shortcuts Display Component

```typescript
// Display keyboard shortcuts to user
interface KeyboardShortcutsProps {
  currentState: GameState;
  className?: string;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  currentState,
  className
}) => {
  const getShortcuts = (state: GameState) => {
    const shortcuts = [];

    if (state === GameState.PLAYING) {
      shortcuts.push({ key: 'Space', action: 'Pause' });
    } else if (state === GameState.PAUSED) {
      shortcuts.push({ key: 'Space', action: 'Resume' });
    }

    if (state !== GameState.MENU) {
      shortcuts.push({ key: 'R', action: 'Restart' });
      shortcuts.push({ key: 'Esc', action: 'Menu' });
    }

    return shortcuts;
  };

  const shortcuts = getShortcuts(currentState);

  if (shortcuts.length === 0) return null;

  return (
    <div className={`keyboard-shortcuts ${className || ''}`}>
      <span className="keyboard-shortcuts__label">Shortcuts:</span>
      <div className="keyboard-shortcuts__list">
        {shortcuts.map(({ key, action }) => (
          <span key={key} className="keyboard-shortcut">
            <kbd className="keyboard-shortcut__key">{key}</kbd>
            <span className="keyboard-shortcut__action">{action}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
```

### CSS Styling

```css
/* Game controls styling */
.game-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: rgba(31, 41, 55, 0.9);
  border-radius: 8px;
  border: 1px solid #374151;
}

.controls-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.control-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch target size */
  min-width: 44px;
}

.control-button--primary {
  background: #3b82f6;
  color: white;
}

.control-button--primary:hover {
  background: #2563eb;
}

.control-button--large {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
}

.control-button--pressed {
  transform: scale(0.95);
}

.game-state-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.keyboard-shortcuts {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .controls-buttons {
    flex-direction: column;
  }

  .control-button {
    width: 100%;
    min-height: 48px; /* Larger touch targets on mobile */
  }
}
```

## Testing Requirements

### Unit Tests

- Control button component functionality
- Keyboard shortcut handling
- State indicator display logic
- Component props and event handling

### Integration Tests

- Game controls integration with state management
- Keyboard shortcuts with game state changes
- Mobile touch interaction testing

### E2E Scenarios

- Complete control flow during gameplay
- Keyboard shortcut functionality across different states
- Mobile device control interaction

## Dependencies

### Prerequisite Tasks

- T-1.6.1 (Game State Management System)
- T-1.2.2 (Responsive Navigation)

### Blocking Tasks

- None

### External Dependencies

- React hooks for component state
- CSS for responsive design

## Risks and Considerations

### Technical Risks

- Keyboard event conflicts with browser shortcuts
- Touch target sizing on mobile devices
- Component re-rendering performance

### Implementation Challenges

- Consistent visual feedback across different devices
- Accessible keyboard navigation
- State synchronization with game engine

### Mitigation Strategies

- Test keyboard shortcuts across different browsers
- Use proper touch target sizes (44px minimum)
- Implement proper accessibility attributes
- Add visual feedback for all user interactions

---

**Estimated Duration**: 2 hours  
**Risk Level**: Low  
**Dependencies**: T-1.6.1, T-1.2.2  
**Output**: Complete game control interface with keyboard shortcuts and responsive design
