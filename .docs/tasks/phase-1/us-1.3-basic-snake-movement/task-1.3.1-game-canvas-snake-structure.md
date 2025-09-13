# Task: Game Canvas and Snake Structure

## Task Header
- **ID**: T-1.3.1
- **Title**: Create game canvas component and snake data structure
- **Story ID**: US-1.3
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 3-4 hours
- **Complexity**: moderate

## Task Content

### Objective
Implement the HTML5 Canvas game component and establish the snake data structure with initial positioning and state management for the core game mechanics.

### Description
Create the foundational game canvas that will render all game elements, along with a well-structured snake object that can be manipulated for movement, growth, and collision detection throughout the game.

### Acceptance Criteria Covered
- GIVEN game is running WHEN canvas renders THEN game board displays with clear boundaries
- GIVEN snake movement WHEN direction changes THEN animation is smooth and natural
- GIVEN game canvas WHEN snake moves THEN movement appears fluid without stuttering

### Implementation Notes
1. Create HTML5 Canvas component with proper sizing
2. Implement snake data structure with segments array
3. Set up initial snake position and orientation
4. Create canvas rendering context and utilities
5. Establish game coordinate system and grid

## Technical Specs

### File Targets
**New Files:**
- `src/components/game/GameCanvas.tsx` - Main game canvas component
- `src/lib/game/snake.ts` - Snake data structure and methods
- `src/lib/game/types.ts` - Game type definitions
- `src/lib/game/constants.ts` - Game constants and configuration
- `src/lib/utils/canvas.ts` - Canvas utility functions
- `src/hooks/useCanvas.ts` - Canvas management hook

**Modified Files:**
- `src/app/game/page.tsx` - Integrate game canvas component
- `src/styles/game.css` - Add game-specific styles

**Test Files:**
- `src/lib/game/__tests__/snake.test.ts` - Snake structure tests
- `src/components/__tests__/GameCanvas.test.tsx` - Canvas component tests

### Snake Data Structure
```typescript
// Snake types and interfaces
interface Position {
  x: number;
  y: number;
}

interface SnakeSegment extends Position {
  id: string;
}

interface Snake {
  segments: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction;
  isGrowing: boolean;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Snake class implementation
class SnakeGame {
  private snake: Snake;
  private gridSize: number;
  private canvasSize: { width: number; height: number };

  constructor(canvasWidth: number, canvasHeight: number, gridSize: number = 20) {
    this.gridSize = gridSize;
    this.canvasSize = { width: canvasWidth, height: canvasHeight };
    this.initializeSnake();
  }

  private initializeSnake(): void {
    const centerX = Math.floor(this.canvasSize.width / 2 / this.gridSize) * this.gridSize;
    const centerY = Math.floor(this.canvasSize.height / 2 / this.gridSize) * this.gridSize;
    
    this.snake = {
      segments: [
        { x: centerX, y: centerY, id: 'head' },
        { x: centerX - this.gridSize, y: centerY, id: 'body-1' },
        { x: centerX - this.gridSize * 2, y: centerY, id: 'body-2' }
      ],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      isGrowing: false
    };
  }
}
```

### Canvas Component
```typescript
// GameCanvas component implementation
interface GameCanvasProps {
  width: number;
  height: number;
  onCanvasReady: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width, height, onCanvasReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    contextRef.current = context;
    onCanvasReady(canvas, context);
  }, [onCanvasReady]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="game-canvas"
      tabIndex={0}
    />
  );
};
```

### Game Constants
```typescript
// Game configuration constants
export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 20,
  INITIAL_SNAKE_LENGTH: 3,
  GAME_SPEED: 150, // milliseconds per frame
  COLORS: {
    BACKGROUND: '#1a1a1a',
    SNAKE_HEAD: '#4ade80',
    SNAKE_BODY: '#22c55e',
    FOOD: '#ef4444',
    BORDER: '#374151'
  }
} as const;
```

## Testing Requirements

### Unit Tests
- Snake initialization with correct position and length
- Snake data structure methods work correctly
- Canvas component renders without errors
- Grid positioning calculations are accurate

### Integration Tests
- Canvas integrates properly with React component lifecycle
- Snake renders correctly on canvas
- Coordinate system works consistently

### E2E Scenarios
- Game canvas loads and displays snake in center position
- Canvas scales appropriately on different screen sizes
- No rendering errors or memory leaks during extended use

## Dependencies

### Prerequisite Tasks
- T-1.1.2 (Project Structure Setup)
- T-1.2.1 (Main Menu and Page Components)

### Blocking Tasks
- None

### External Dependencies
- HTML5 Canvas API
- React hooks for component lifecycle management

## Risks and Considerations

### Technical Risks
- Canvas performance on low-end mobile devices
- Coordinate system complexity for different screen sizes
- Memory management for canvas operations

### Implementation Challenges
- Proper snake segment tracking and identification
- Canvas sizing and responsiveness
- Coordinate system consistency

### Mitigation Strategies
- Use efficient canvas drawing techniques
- Implement object pooling for snake segments
- Test performance on various devices
- Establish clear coordinate system documentation

---

**Estimated Duration**: 3-4 hours  
**Risk Level**: Medium  
**Dependencies**: T-1.1.2, T-1.2.1  
**Output**: Functional game canvas with snake data structure ready for movement implementation