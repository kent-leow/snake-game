# Task: Keyboard Input and Movement Logic

## Task Header
- **ID**: T-1.3.2
- **Title**: Implement keyboard input handling and snake movement logic
- **Story ID**: US-1.3
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 3-4 hours
- **Complexity**: moderate

## Task Content

### Objective
Create keyboard input handling for arrow keys and WASD controls, implement snake movement logic with direction changes, and ensure smooth continuous movement with proper input validation.

### Description
Build the core movement system that responds to player input, manages snake direction changes, prevents invalid moves (like reversing into body), and provides smooth continuous movement that forms the foundation of the gameplay experience.

### Acceptance Criteria Covered
- GIVEN game is running WHEN user presses up arrow or W THEN snake moves upward
- GIVEN game is running WHEN user presses down arrow or S THEN snake moves downward
- GIVEN game is running WHEN user presses left arrow or A THEN snake moves leftward
- GIVEN game is running WHEN user presses right arrow or D THEN snake moves rightward
- GIVEN snake moving right WHEN user presses left arrow THEN snake continues moving right (no reverse)
- GIVEN snake moving in any direction WHEN no input given THEN snake continues in current direction

### Implementation Notes
1. Implement keyboard event listeners for arrow keys and WASD
2. Create direction change validation logic
3. Implement smooth snake movement with timing
4. Add movement queue system for responsive input
5. Test input handling across different browsers

## Technical Specs

### File Targets
**New Files:**
- `src/hooks/useKeyboardInput.ts` - Keyboard input management hook
- `src/lib/game/movement.ts` - Snake movement logic
- `src/lib/game/inputHandler.ts` - Input processing and validation
- `src/lib/utils/direction.ts` - Direction utilities and validation

**Modified Files:**
- `src/lib/game/snake.ts` - Add movement methods to snake class
- `src/components/game/GameCanvas.tsx` - Integrate keyboard input
- `src/lib/game/types.ts` - Add movement-related types

**Test Files:**
- `src/hooks/__tests__/useKeyboardInput.test.ts` - Input hook tests
- `src/lib/game/__tests__/movement.test.ts` - Movement logic tests

### Keyboard Input Implementation
```typescript
// useKeyboardInput hook
interface KeyboardInputOptions {
  onDirectionChange: (direction: Direction) => void;
  enabled: boolean;
}

export const useKeyboardInput = ({ onDirectionChange, enabled }: KeyboardInputOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent default browser behavior
      const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
      if (validKeys.includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          onDirectionChange('UP');
          break;
        case 'arrowdown':
        case 's':
          onDirectionChange('DOWN');
          break;
        case 'arrowleft':
        case 'a':
          onDirectionChange('LEFT');
          break;
        case 'arrowright':
        case 'd':
          onDirectionChange('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onDirectionChange, enabled]);
};
```

### Movement Logic
```typescript
// Direction utilities
export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};

export const DIRECTION_VECTORS: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

// Movement validation
export const isValidDirectionChange = (currentDirection: Direction, newDirection: Direction): boolean => {
  // Cannot reverse directly into opposite direction
  return OPPOSITE_DIRECTIONS[currentDirection] !== newDirection;
};

// Snake movement implementation
export class SnakeMovement {
  private snake: Snake;
  private gridSize: number;
  private inputQueue: Direction[] = [];

  constructor(snake: Snake, gridSize: number) {
    this.snake = snake;
    this.gridSize = gridSize;
  }

  public queueDirectionChange(direction: Direction): void {
    // Only queue if it's a valid direction change
    if (isValidDirectionChange(this.snake.direction, direction)) {
      // Only keep the most recent direction change in queue
      this.inputQueue = [direction];
    }
  }

  public moveSnake(): void {
    // Process queued direction changes
    if (this.inputQueue.length > 0) {
      const newDirection = this.inputQueue.shift()!;
      if (isValidDirectionChange(this.snake.direction, newDirection)) {
        this.snake.direction = newDirection;
      }
    }

    // Calculate new head position
    const currentHead = this.snake.segments[0];
    const directionVector = DIRECTION_VECTORS[this.snake.direction];
    
    const newHead: SnakeSegment = {
      x: currentHead.x + directionVector.x * this.gridSize,
      y: currentHead.y + directionVector.y * this.gridSize,
      id: `head-${Date.now()}`
    };

    // Add new head
    this.snake.segments.unshift(newHead);

    // Remove tail (unless growing)
    if (!this.snake.isGrowing) {
      this.snake.segments.pop();
    } else {
      this.snake.isGrowing = false;
    }
  }
}
```

### Game Loop Integration
```typescript
// Game loop with movement
export const useGameLoop = (gameState: GameState, movementHandler: SnakeMovement) => {
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const gameLoop = (currentTime: number) => {
      if (currentTime - lastUpdateTime >= GAME_CONFIG.GAME_SPEED) {
        movementHandler.moveSnake();
        setLastUpdateTime(currentTime);
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, lastUpdateTime, movementHandler]);
};
```

## Testing Requirements

### Unit Tests
- Keyboard input detection for all supported keys
- Direction change validation logic
- Movement queue functionality
- Snake position calculations after movement

### Integration Tests
- Input handling integrates with React components
- Movement logic works with game loop
- Direction changes apply correctly during gameplay

### E2E Scenarios
- Complete keyboard control testing (all directions)
- Rapid direction changes and input queue handling
- Prevention of reverse direction moves
- Continuous movement without input

## Dependencies

### Prerequisite Tasks
- T-1.3.1 (Game Canvas and Snake Structure)

### Blocking Tasks
- None

### External Dependencies
- Browser keyboard event API
- React hooks for component lifecycle

## Risks and Considerations

### Technical Risks
- Keyboard event handling differences across browsers
- Input lag or responsiveness issues
- Input queue overflow with rapid key presses

### Implementation Challenges
- Smooth movement timing with requestAnimationFrame
- Input validation without interfering with gameplay flow
- Cross-browser keyboard event consistency

### Mitigation Strategies
- Test keyboard handling on multiple browsers and devices
- Implement input debouncing for smooth gameplay
- Use event.preventDefault() to avoid browser interference
- Add comprehensive input validation tests

---

**Estimated Duration**: 3-4 hours  
**Risk Level**: Medium  
**Dependencies**: T-1.3.1  
**Output**: Fully functional keyboard control system with smooth snake movement and input validation