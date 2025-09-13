# Technical Specifications - Phase 2

## Overview
This document provides detailed technical specifications for Phase 2 implementation, covering API designs, database schemas, component interfaces, and system integration patterns for the combo system features.

## API Specifications

### Score Management Endpoints

#### POST /api/scores
**Purpose**: Save a new game score with comprehensive metrics

**Request Body**:
```typescript
{
  playerName: string; // 1-20 characters, alphanumeric + spaces/hyphens/underscores
  score: number; // Integer, 0-1,000,000
  gameMetrics: {
    totalFood: number; // Total food items consumed
    totalCombos: number; // Number of completed combos
    longestCombo: number; // Longest combo streak (0-100)
    maxSpeedLevel: number; // Highest speed level reached (0-50)
    gameTimeSeconds: number; // Game duration in seconds (1-7200)
    finalSnakeLength: number; // Snake length at game end (1-10000)
  };
  comboStats: {
    totalComboPoints: number; // Points earned from combos
    basePoints: number; // Points earned from regular food
    comboEfficiency: number; // Percentage of food eaten in combos (0-100)
    averageComboLength: number; // Average combo length (0-5)
  };
  metadata?: {
    browserInfo: string; // User agent string (max 200 chars)
    screenResolution: string; // "WIDTHxHEIGHT" (max 20 chars)
    gameVersion: string; // Version identifier (max 10 chars)
    difficulty?: 'easy' | 'normal' | 'hard';
  };
}
```

**Response** (201 Created):
```typescript
{
  success: true;
  data: {
    _id: string;
    playerName: string;
    score: number;
    timestamp: string; // ISO 8601
    // ... other fields
  };
  message: "Score saved successfully";
}
```

**Error Responses**:
- 400: Validation failed
- 403: Security check failed 
- 429: Rate limit exceeded
- 503: Database unavailable

#### GET /api/scores
**Purpose**: Retrieve scores with pagination and sorting

**Query Parameters**:
- `limit`: number (default: 50, max: 100)
- `offset`: number (default: 0)
- `sortBy`: string (default: 'score')
- `order`: 'asc' | 'desc' (default: 'desc')

**Response** (200 OK):
```typescript
{
  success: true;
  data: Score[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

#### GET /api/scores/player/[name]
**Purpose**: Get scores for specific player

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    playerName: string;
    scores: Score[];
    bestScore: number;
    totalGames: number;
  };
}
```

#### GET /api/scores/leaderboard
**Purpose**: Get top scores for leaderboard

**Query Parameters**:
- `period`: 'daily' | 'weekly' | 'monthly' | 'all' (default: 'all')
- `limit`: number (default: 10, max: 50)

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    period: string;
    leaderboard: Score[];
    lastUpdated: string; // ISO 8601
  };
}
```

## Database Schema

### Score Collection
```typescript
interface IScore extends Document {
  // Identity and basic info
  playerName: string; // Required, 1-20 chars, validated pattern
  score: number; // Required, integer, 0-1,000,000
  timestamp: Date; // Required, defaults to Date.now
  
  // Game performance metrics
  gameMetrics: {
    totalFood: number; // Required, integer, min 0
    totalCombos: number; // Required, integer, min 0
    longestCombo: number; // Required, integer, 0-100
    maxSpeedLevel: number; // Required, integer, 0-50
    gameTimeSeconds: number; // Required, 1-7200 seconds
    finalSnakeLength: number; // Required, integer, 1-10000
  };
  
  // Scoring breakdown
  comboStats: {
    totalComboPoints: number; // Required, integer, min 0
    basePoints: number; // Required, integer, min 0
    comboEfficiency: number; // Required, 0-100 percentage
    averageComboLength: number; // Required, 0-5 average
  };
  
  // Optional metadata
  metadata?: {
    browserInfo: string; // Max 200 chars
    screenResolution: string; // Max 20 chars
    gameVersion: string; // Max 10 chars
    difficulty?: 'easy' | 'normal' | 'hard';
  };
  
  // Auto-generated
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes
```typescript
// Performance indexes
{ score: -1 } // High scores first
{ timestamp: -1 } // Recent scores first
{ playerName: 1, score: -1 } // Player's best scores
{ 'gameMetrics.totalCombos': -1 } // Most combos
{ score: -1, 'gameMetrics.totalCombos': -1, timestamp: -1 } // Compound leaderboard
```

## Component Interfaces

### Core Game Components

#### FoodManager
```typescript
interface NumberedFood {
  id: string;
  number: 1 | 2 | 3 | 4 | 5;
  position: Position;
  color: string;
}

class FoodManager {
  constructor(gridSize: number, boardWidth: number, boardHeight: number);
  initializeFoods(snakePositions: Position[]): void;
  getFoods(): NumberedFood[];
  consumeFood(number: number, snakePositions: Position[]): NumberedFood | null;
}
```

#### ComboManager
```typescript
interface ComboState {
  currentSequence: number[];
  expectedNext: 1 | 2 | 3 | 4 | 5;
  comboProgress: 0 | 1 | 2 | 3 | 4 | 5;
  totalCombos: number;
  isComboActive: boolean;
}

interface ComboResult {
  type: 'progress' | 'complete' | 'broken';
  newState: ComboState;
  pointsAwarded: number;
  message?: string;
}

class ComboManager {
  processFood(consumedNumber: 1 | 2 | 3 | 4 | 5): ComboResult;
  getCurrentState(): ComboState;
  reset(): void;
}
```

#### SpeedManager
```typescript
interface SpeedConfig {
  baseSpeed: number; // 150ms default
  speedIncrement: number; // 15ms per combo
  maxSpeed: number; // 60ms maximum
  minSpeed: number; // 300ms minimum
  transitionDuration: number; // 500ms smooth transition
}

interface SpeedState {
  currentSpeed: number;
  speedLevel: number;
  isTransitioning: boolean;
  targetSpeed: number;
}

class SpeedManager {
  onComboCompleted(): void;
  onComboBreak(): void;
  getCurrentSpeed(): number;
  getSpeedLevel(): number;
  update(deltaTime: number): void;
}
```

### UI Components

#### ComboProgressIndicator
```typescript
interface ComboProgressProps {
  currentProgress: 0 | 1 | 2 | 3 | 4 | 5;
  expectedNext: 1 | 2 | 3 | 4 | 5;
  totalCombos: number;
  isActive: boolean;
}

const ComboProgressIndicator: React.FC<ComboProgressProps>;
```

#### SpeedIndicator
```typescript
interface SpeedIndicatorProps {
  speedLevel: number;
  currentSpeed: number;
  baseSpeed: number;
  isTransitioning: boolean;
  maxLevel?: number;
}

const SpeedIndicator: React.FC<SpeedIndicatorProps>;
```

#### ScoreSubmissionModal
```typescript
interface ScoreSubmissionModalProps {
  isOpen: boolean;
  scoreData: Omit<ScoreSubmissionData, 'playerName'>;
  onClose: () => void;
  onSubmitted: (result: ScoreSubmissionResult) => void;
}

const ScoreSubmissionModal: React.FC<ScoreSubmissionModalProps>;
```

## Configuration Constants

### Food System
```typescript
const FOOD_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#FF6B6B', // Red
  2: '#4ECDC4', // Teal  
  3: '#45B7D1', // Blue
  4: '#96CEB4', // Green
  5: '#FECA57', // Yellow
};

const FOOD_COUNT = 5;
const FOOD_NUMBERS = [1, 2, 3, 4, 5] as const;
```

### Combo System
```typescript
const COMBO_CONFIG = {
  SEQUENCE: [1, 2, 3, 4, 5] as const,
  BONUS_POINTS: 5,
  BASE_FOOD_POINTS: 10,
} as const;
```

### Speed System
```typescript
const SPEED_CONFIG = {
  BASE_SPEED: 150, // ms between moves
  SPEED_INCREMENT: 15, // ms decrease per combo
  MAX_SPEED: 60, // fastest playable speed
  MIN_SPEED: 300, // slowest speed
  TRANSITION_DURATION: 500, // smooth transition time
} as const;
```

### Score System
```typescript
const SCORE_CONFIG = {
  BASE_POINTS: 10,
  COMBO_BONUS: 5,
  MAX_SCORE: 1000000,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_OFFLINE_SCORES: 10,
} as const;
```

## File Organization

Following Next.js and atomic design principles:

```
src/
├── components/           # UI components
│   ├── ComboProgressIndicator.tsx
│   ├── ComboFeedback.tsx
│   ├── SpeedIndicator.tsx
│   └── ScoreSubmissionModal.tsx
├── game/                # Game logic
│   ├── FoodManager.ts
│   ├── ComboManager.ts
│   ├── SpeedManager.ts
│   └── ScoreManager.ts
├── hooks/               # Custom React hooks
│   ├── useComboAnimation.ts
│   └── useScoreSubmission.ts
├── services/            # API and business services
│   └── ScoreService.ts
├── lib/                 # Core utilities and API
│   ├── api/
│   │   ├── scoreService.ts
│   │   └── errorHandler.ts
│   └── mongodb.ts
├── models/              # Database models
│   └── Score.ts
├── types/               # TypeScript definitions
│   ├── Food.ts
│   ├── Combo.ts
│   ├── Speed.ts
│   └── Score.ts
├── constants/           # Configuration constants
│   ├── FoodColors.ts
│   ├── ComboConfig.ts
│   └── SpeedConfig.ts
├── utils/               # Utility functions
│   ├── scoreValidation.ts
│   └── localStorage.ts
└── styles/              # CSS modules
    ├── combo.module.css
    └── speed-indicator.module.css

pages/
└── api/
    └── scores/
        ├── index.ts
        ├── leaderboard.ts
        └── player/
            └── [name].ts
```

## Performance Considerations

### Frontend Optimizations
- Canvas rendering optimized for 60 FPS with multiple food blocks
- Efficient collision detection using spatial partitioning
- Debounced score submissions to prevent rapid API calls
- Memoized component renders for combo and speed indicators

### Backend Optimizations
- Database indexes on commonly queried fields
- Connection pooling for MongoDB
- Rate limiting to prevent abuse
- Efficient aggregation queries for leaderboards

### Storage Optimizations
- LocalStorage fallback with size limits
- Automatic cleanup of old offline scores
- Compressed score data for storage efficiency

## Security Measures

### Input Validation
- Comprehensive server-side validation for all score data
- Client-side validation for immediate feedback
- Sanitization of player names and text inputs

### Anti-Cheating Measures
- Game time vs score ratio validation
- Maximum score limits and bounds checking
- Rate limiting for score submissions
- Logging of suspicious score patterns

### Data Protection
- No sensitive personal data collection
- Optional player names only
- Secure API endpoints with proper error handling

---

*This technical specification provides the detailed implementation guidance needed for all Phase 2 development tasks.*