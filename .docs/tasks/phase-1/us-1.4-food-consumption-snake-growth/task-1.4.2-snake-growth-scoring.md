# Task: Snake Growth and Scoring System

## Task Header

- **ID**: T-1.4.2
- **Title**: Implement snake growth mechanics and scoring system
- **Story ID**: US-1.4
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 3-4 hours
- **Complexity**: moderate

## Task Content

### Objective

Create the snake growth system that adds segments when food is consumed and implement a scoring mechanism that tracks and displays points with real-time updates and visual feedback.

### Description

Build the core progression mechanics that reward players for successful food consumption through visible snake growth and score accumulation, providing immediate feedback and motivation for continued gameplay.

### Acceptance Criteria Covered

- GIVEN food consumed WHEN consumption occurs THEN snake length increases by one segment
- GIVEN food consumed WHEN consumption occurs THEN score increases by 10 points
- GIVEN score display WHEN points increase THEN current score updates immediately
- GIVEN score increase WHEN it happens THEN visual feedback confirms the action

### Implementation Notes

1. Implement snake growth mechanics with smooth animations
2. Create scoring system with configurable point values
3. Build score display component with real-time updates
4. Add visual feedback for score increases
5. Implement score persistence during game session

## Technical Specs

### File Targets

**New Files:**

- `src/lib/game/scoring.ts` - Scoring system implementation
- `src/lib/game/snakeGrowth.ts` - Snake growth mechanics
- `src/components/game/ScoreDisplay.tsx` - Score display component
- `src/components/game/ScoreAnimation.tsx` - Score increase animations
- `src/hooks/useScore.ts` - Score management hook

**Modified Files:**

- `src/lib/game/snake.ts` - Add growth methods
- `src/lib/game/gameEngine.ts` - Integrate scoring and growth
- `src/components/game/GameCanvas.tsx` - Add score display integration
- `src/lib/game/types.ts` - Add scoring types

**Test Files:**

- `src/lib/game/__tests__/scoring.test.ts` - Scoring system tests
- `src/lib/game/__tests__/snakeGrowth.test.ts` - Growth mechanics tests
- `src/components/__tests__/ScoreDisplay.test.tsx` - Score component tests

### Snake Growth Implementation

```typescript
// Snake growth mechanics
export class SnakeGrowthManager {
  private snake: Snake;
  private pendingGrowth: number = 0;

  constructor(snake: Snake) {
    this.snake = snake;
  }

  public addGrowth(segments: number = 1): void {
    this.pendingGrowth += segments;
  }

  public processGrowth(): void {
    if (this.pendingGrowth > 0) {
      this.snake.isGrowing = true;
      this.pendingGrowth--;
    }
  }

  public growSnake(): void {
    if (!this.snake.isGrowing) return;

    // Growth is handled by not removing the tail in movement logic
    // This method sets the flag for the movement system
    this.snake.isGrowing = false;
  }

  public getPendingGrowth(): number {
    return this.pendingGrowth;
  }

  public getSnakeLength(): number {
    return this.snake.segments.length;
  }
}
```

### Scoring System

```typescript
// Scoring system implementation
interface ScoreEvent {
  type: 'food' | 'combo' | 'bonus';
  points: number;
  timestamp: number;
  position?: Position;
}

export class ScoringSystem {
  private currentScore: number = 0;
  private scoreHistory: ScoreEvent[] = [];
  private scoreCallbacks: Array<(score: number, event: ScoreEvent) => void> =
    [];

  public addScore(event: Omit<ScoreEvent, 'timestamp'>): number {
    const scoreEvent: ScoreEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.currentScore += event.points;
    this.scoreHistory.push(scoreEvent);

    // Notify all subscribers
    this.scoreCallbacks.forEach(callback =>
      callback(this.currentScore, scoreEvent)
    );

    return this.currentScore;
  }

  public getCurrentScore(): number {
    return this.currentScore;
  }

  public getScoreHistory(): ScoreEvent[] {
    return [...this.scoreHistory];
  }

  public subscribeToScoreChanges(
    callback: (score: number, event: ScoreEvent) => void
  ): () => void {
    this.scoreCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.scoreCallbacks.indexOf(callback);
      if (index > -1) {
        this.scoreCallbacks.splice(index, 1);
      }
    };
  }

  public resetScore(): void {
    this.currentScore = 0;
    this.scoreHistory = [];
  }

  public getStatistics() {
    return {
      totalScore: this.currentScore,
      totalEvents: this.scoreHistory.length,
      averageScore:
        this.scoreHistory.length > 0
          ? this.currentScore / this.scoreHistory.length
          : 0,
      scoreBreakdown: this.getScoreBreakdown(),
    };
  }

  private getScoreBreakdown() {
    return this.scoreHistory.reduce(
      (breakdown, event) => {
        breakdown[event.type] = (breakdown[event.type] || 0) + event.points;
        return breakdown;
      },
      {} as Record<string, number>
    );
  }
}
```

### Score Display Component

```typescript
// Score display React component
interface ScoreDisplayProps {
  score: number;
  className?: string;
  showAnimation?: boolean;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  className,
  showAnimation = true
}) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (score !== displayScore && showAnimation) {
      setIsAnimating(true);

      // Animate score change
      const animationDuration = 300;
      const startTime = Date.now();
      const startScore = displayScore;
      const scoreDiff = score - startScore;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentScore = Math.round(startScore + (scoreDiff * easeOut));

        setDisplayScore(currentScore);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayScore(score);
    }
  }, [score, displayScore, showAnimation]);

  return (
    <div className={`score-display ${className || ''} ${isAnimating ? 'animating' : ''}`}>
      <div className="score-label">Score</div>
      <div className="score-value">{displayScore.toLocaleString()}</div>
    </div>
  );
};
```

### Score Management Hook

```typescript
// React hook for score management
interface UseScoreOptions {
  initialScore?: number;
  onScoreChange?: (score: number, event: ScoreEvent) => void;
}

export const useScore = ({
  initialScore = 0,
  onScoreChange,
}: UseScoreOptions = {}) => {
  const [score, setScore] = useState(initialScore);
  const [recentEvents, setRecentEvents] = useState<ScoreEvent[]>([]);
  const scoringSystemRef = useRef<ScoringSystem>(new ScoringSystem());

  useEffect(() => {
    const unsubscribe = scoringSystemRef.current.subscribeToScoreChanges(
      (newScore, event) => {
        setScore(newScore);
        setRecentEvents(prev => [...prev.slice(-4), event]); // Keep last 5 events
        onScoreChange?.(newScore, event);
      }
    );

    return unsubscribe;
  }, [onScoreChange]);

  const addScore = useCallback((event: Omit<ScoreEvent, 'timestamp'>) => {
    return scoringSystemRef.current.addScore(event);
  }, []);

  const resetScore = useCallback(() => {
    scoringSystemRef.current.resetScore();
    setScore(0);
    setRecentEvents([]);
  }, []);

  const getStatistics = useCallback(() => {
    return scoringSystemRef.current.getStatistics();
  }, []);

  return {
    score,
    recentEvents,
    addScore,
    resetScore,
    getStatistics,
  };
};
```

### Integration with Game Engine

```typescript
// Integration with existing game systems
export const handleFoodConsumption = (
  snake: Snake,
  food: Food,
  growthManager: SnakeGrowthManager,
  scoringSystem: ScoringSystem
): void => {
  // Add growth to snake
  growthManager.addGrowth(1);

  // Add score for food consumption
  scoringSystem.addScore({
    type: 'food',
    points: food.value,
    position: food.position,
  });

  // Visual feedback (will be handled by components)
  // Trigger food consumption animation
  // Play sound effect (future enhancement)
};
```

## Testing Requirements

### Unit Tests

- Snake growth mechanics work correctly
- Scoring system calculates points accurately
- Score display updates and animations function
- Score history and statistics are maintained

### Integration Tests

- Growth and scoring integrate with food consumption
- Score display reflects actual game score
- Animation timing works smoothly

### E2E Scenarios

- Complete food consumption with growth and scoring
- Score persistence during game session
- Visual feedback for score increases

## Dependencies

### Prerequisite Tasks

- T-1.4.1 (Food System and Collision Detection)

### Blocking Tasks

- None

### External Dependencies

- React hooks for component state management
- CSS animations for visual feedback

## Risks and Considerations

### Technical Risks

- Animation performance with frequent score updates
- Score calculation accuracy with rapid consumption
- Component re-rendering performance

### Implementation Challenges

- Smooth animation of score changes
- Synchronizing growth with movement system
- Managing score state across game sessions

### Mitigation Strategies

- Use requestAnimationFrame for smooth animations
- Implement score change batching if needed
- Add comprehensive testing for score calculations
- Optimize component rendering with React.memo

---

**Estimated Duration**: 3-4 hours  
**Risk Level**: Low-Medium  
**Dependencies**: T-1.4.1  
**Output**: Complete snake growth and scoring system with visual feedback and real-time updates
