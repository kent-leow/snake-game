# Phase 1 Technical Specifications

## Overview

This document provides comprehensive technical specifications for Phase 1 implementation tasks, including API designs, database schemas, component interfaces, and configuration details.

## Architecture Overview

### Technology Stack

- **Frontend**: Next.js 14+ with TypeScript, React 18+, HTML5 Canvas API
- **Backend**: Next.js API Routes (Node.js runtime)
- **Database**: MongoDB with Mongoose ODM (Docker containerized)
- **Deployment**: Vercel platform
- **Development**: Docker Compose, ESLint, Prettier

### Project Structure

```
src/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main menu page
│   ├── game/page.tsx            # Game page
│   ├── scores/page.tsx          # High scores page
│   └── settings/page.tsx        # Settings page
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── Button.tsx
│   │   └── Navigation.tsx
│   ├── game/                    # Game-specific components
│   │   ├── GameCanvas.tsx
│   │   ├── GameControls.tsx
│   │   ├── ScoreDisplay.tsx
│   │   └── GameOverModal.tsx
│   └── navigation/              # Navigation components
│       └── MainMenu.tsx
├── lib/                         # Business logic and utilities
│   ├── game/                    # Game engine
│   │   ├── gameEngine.ts
│   │   ├── snake.ts
│   │   ├── food.ts
│   │   ├── collision.ts
│   │   ├── scoring.ts
│   │   ├── movement.ts
│   │   ├── rendering.ts
│   │   └── types.ts
│   ├── database/                # Database layer
│   │   ├── connection.ts
│   │   └── models/
│   └── utils/                   # Utility functions
├── hooks/                       # Custom React hooks
│   ├── useGameState.ts
│   ├── useKeyboard.ts
│   ├── useCanvas.ts
│   └── useScore.ts
└── styles/                      # Styling
    ├── globals.css
    ├── game.css
    └── components.css
```

## Core Type Definitions

### Game Types

```typescript
// Position and direction types
interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Snake types
interface SnakeSegment extends Position {
  id: string;
}

interface Snake {
  segments: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction;
  isGrowing: boolean;
}

// Food types
interface Food {
  position: Position;
  value: number;
  id: string;
  type: 'normal' | 'bonus';
  timestamp: number;
}

// Game state types
interface GameState {
  snake: Snake;
  food: Food | null;
  score: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameOver: boolean;
  speed: number;
}

// Score event types
interface ScoreEvent {
  type: 'food' | 'combo' | 'bonus';
  points: number;
  timestamp: number;
  position?: Position;
}
```

## Component Interface Specifications

### GameCanvas Component

```typescript
interface GameCanvasProps {
  width: number;
  height: number;
  gameState: GameState;
  onGameStateChange: (newState: Partial<GameState>) => void;
  onGameOver: () => void;
  className?: string;
}

interface GameCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
  getContext: () => CanvasRenderingContext2D | null;
  pause: () => void;
  resume: () => void;
  restart: () => void;
}
```

### Navigation Components

```typescript
interface NavigationProps {
  currentPath: string;
  className?: string;
}

interface NavigationItem {
  label: string;
  href: string;
  description: string;
  icon?: string;
}

interface MainMenuProps {
  onStartGame: () => void;
  onViewScores: () => void;
  onSettings: () => void;
}
```

### Score Display Components

```typescript
interface ScoreDisplayProps {
  score: number;
  className?: string;
  showAnimation?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
}

interface ScoreAnimationProps {
  scoreChange: number;
  position: Position;
  onAnimationComplete: () => void;
}
```

## Game Engine Specifications

### Core Classes and Methods

#### Snake Class

```typescript
class Snake {
  private segments: SnakeSegment[];
  private direction: Direction;
  private nextDirection: Direction;
  private isGrowing: boolean;

  constructor(initialPosition: Position, initialLength: number);
  public move(): void;
  public changeDirection(newDirection: Direction): boolean;
  public grow(): void;
  public getHead(): SnakeSegment;
  public getBody(): SnakeSegment[];
  public getLength(): number;
  public contains(position: Position): boolean;
}
```

#### Food Manager Class

```typescript
class FoodManager {
  private currentFood: Food | null;
  private gridSize: number;
  private canvasBounds: { width: number; height: number };

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number);
  public spawnFood(occupiedPositions: Position[]): Food;
  public getCurrentFood(): Food | null;
  public clearFood(): void;
  public isValidPosition(
    position: Position,
    occupiedPositions: Position[]
  ): boolean;
}
```

#### Collision Detector Class

```typescript
class CollisionDetector {
  private gridSize: number;

  constructor(gridSize: number);
  public checkFoodCollision(snakeHead: Position, food: Food): boolean;
  public checkWallCollision(
    position: Position,
    bounds: { width: number; height: number }
  ): boolean;
  public checkSelfCollision(head: Position, body: Position[]): boolean;
}
```

#### Game Engine Class

```typescript
class GameEngine {
  private snake: Snake;
  private foodManager: FoodManager;
  private collisionDetector: CollisionDetector;
  private scoringSystem: ScoringSystem;
  private gameState: GameState;

  constructor(canvasWidth: number, canvasHeight: number, gridSize: number);
  public start(): void;
  public pause(): void;
  public resume(): void;
  public restart(): void;
  public update(deltaTime: number): void;
  public handleInput(direction: Direction): void;
  public getGameState(): GameState;
}
```

## Configuration Constants

### Game Configuration

```typescript
export const GAME_CONFIG = {
  // Canvas settings
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 20,

  // Game mechanics
  INITIAL_SNAKE_LENGTH: 3,
  INITIAL_GAME_SPEED: 150, // milliseconds per frame
  FOOD_VALUE: 10,

  // Performance settings
  TARGET_FPS: 60,
  MIN_FPS_MOBILE: 30,
  MAX_DELTA_TIME: 100,

  // Colors
  COLORS: {
    BACKGROUND: '#1a1a1a',
    SNAKE_HEAD: '#4ade80',
    SNAKE_BODY: '#22c55e',
    FOOD: '#ef4444',
    BORDER: '#374151',
    SCORE_TEXT: '#ffffff',
    UI_PRIMARY: '#3b82f6',
    UI_SECONDARY: '#6b7280',
  },

  // Input settings
  INPUT_BUFFER_SIZE: 3,
  INPUT_DEADZONE: 50, // milliseconds

  // Animation settings
  SCORE_ANIMATION_DURATION: 300,
  GROWTH_ANIMATION_DURATION: 200,
  GAME_OVER_FADE_DURATION: 500,
} as const;
```

### Performance Configuration

```typescript
export const PERFORMANCE_CONFIG = {
  // Frame rate settings
  TARGET_FPS: 60,
  MIN_FPS_MOBILE: 30,
  MAX_DELTA_TIME: 100,

  // Performance monitoring
  PERFORMANCE_SAMPLE_SIZE: 60,
  FPS_UPDATE_INTERVAL: 1000,
  FRAME_TIME_WARNING_THRESHOLD: 16.67,

  // Device detection
  HIGH_PERFORMANCE_THRESHOLD: 8, // CPU cores
  MEDIUM_PERFORMANCE_THRESHOLD: 4,

  // Memory management
  MAX_SCORE_HISTORY: 100,
  MAX_ANIMATION_QUEUE: 10,
  CLEANUP_INTERVAL: 30000, // 30 seconds
} as const;
```

## Database Specifications

### MongoDB Configuration

```typescript
// Database connection configuration
interface DatabaseConfig {
  url: string;
  options: {
    bufferCommands: boolean;
    maxPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    family: number;
  };
}

// Environment variables
interface EnvironmentVariables {
  MONGO_USERNAME: string;
  MONGO_PASSWORD: string;
  MONGO_DATABASE: string;
  MONGO_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}
```

### Future Database Models (Phase 2)

```typescript
// Score model for Phase 2 implementation
interface ScoreModel {
  _id: ObjectId;
  playerName?: string;
  score: number;
  timestamp: Date;
  comboCount: number;
  gameMode: 'classic' | 'combo';
  duration: number; // Game duration in seconds
  snakeLength: number;
}

// Game session model
interface GameSessionModel {
  _id: ObjectId;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  finalScore: number;
  foodConsumed: number;
  maxSnakeLength: number;
  gameEvents: ScoreEvent[];
}
```

## API Specifications (Future Phase 2)

### Score Management Endpoints

```typescript
// GET /api/scores - Retrieve high scores
interface GetScoresResponse {
  scores: {
    id: string;
    playerName?: string;
    score: number;
    timestamp: string;
    rank: number;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

// POST /api/scores - Submit new score
interface PostScoreRequest {
  playerName?: string;
  score: number;
  gameMode: 'classic' | 'combo';
  duration: number;
  comboCount?: number;
}

interface PostScoreResponse {
  success: boolean;
  scoreId: string;
  rank: number;
  isNewRecord: boolean;
}
```

## Testing Specifications

### Unit Test Coverage Requirements

- **Minimum Coverage**: 80% for business logic
- **Critical Path Coverage**: 95% for game engine components
- **Component Coverage**: 70% for UI components

### Test File Organization

```
src/
├── lib/
│   └── game/
│       └── __tests__/
│           ├── snake.test.ts
│           ├── food.test.ts
│           ├── collision.test.ts
│           ├── scoring.test.ts
│           └── gameEngine.test.ts
├── components/
│   └── __tests__/
│       ├── GameCanvas.test.tsx
│       ├── ScoreDisplay.test.tsx
│       └── Navigation.test.tsx
└── hooks/
    └── __tests__/
        ├── useGameState.test.ts
        └── useKeyboard.test.ts
```

## Performance Requirements

### Frame Rate Targets

- **Desktop**: 60 FPS consistent
- **Mobile**: 30 FPS minimum, 60 FPS target
- **Low-end devices**: 30 FPS minimum with reduced effects

### Memory Usage Targets

- **Initial load**: < 50MB
- **Peak gameplay**: < 100MB
- **Memory growth**: < 1MB per 10 minutes of gameplay

### Loading Time Targets

- **Initial page load**: < 3 seconds
- **Game start**: < 1 second
- **Page transitions**: < 500ms

## Accessibility Requirements

### Keyboard Navigation

- Tab order follows logical flow
- All interactive elements keyboard accessible
- Escape key closes modals/menus
- Space/Enter activates buttons

### Screen Reader Support

- Semantic HTML structure
- ARIA labels for game elements
- Score announcements for screen readers
- Game state announcements

### Visual Accessibility

- Color contrast ratio >= 4.5:1
- Focus indicators clearly visible
- Text scalable up to 200%
- No flashing content above 3Hz

---

**Document Version**: 1.0  
**Last Updated**: Phase 1 Implementation  
**Next Review**: Post Phase 1 completion
