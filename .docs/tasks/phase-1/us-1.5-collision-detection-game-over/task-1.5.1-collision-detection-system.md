# Task: Boundary and Self-Collision Detection

## Task Header

- **ID**: T-1.5.1
- **Title**: Implement boundary and self-collision detection system
- **Story ID**: US-1.5
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 2-3 hours
- **Complexity**: moderate

## Task Content

### Objective

Create comprehensive collision detection system that accurately detects when the snake collides with game boundaries or its own body, providing immediate and reliable game-ending conditions.

### Description

Implement the collision detection algorithms that form the core challenge mechanics of the snake game, ensuring pixel-perfect accuracy and immediate response to collision events for responsive gameplay.

### Acceptance Criteria Covered

- GIVEN snake moving WHEN head hits top boundary THEN game ends immediately
- GIVEN snake moving WHEN head hits bottom boundary THEN game ends immediately
- GIVEN snake moving WHEN head hits left boundary THEN game ends immediately
- GIVEN snake moving WHEN head hits right boundary THEN game ends immediately
- GIVEN snake moving WHEN head collides with body segment THEN game ends immediately
- GIVEN collision detection WHEN checking boundaries THEN response is immediate (within 50ms)

### Implementation Notes

1. Implement boundary collision detection for all four walls
2. Create self-collision detection that checks snake head against all body segments
3. Ensure collision detection is called on every frame before movement
4. Optimize collision detection for performance
5. Add collision event system for game state management

## Technical Specs

### File Targets

**New Files:**

- `src/lib/game/collisionDetection.ts` - Main collision detection system
- `src/lib/game/boundaries.ts` - Boundary collision utilities
- `src/lib/game/selfCollision.ts` - Self-collision detection
- `src/hooks/useCollisionDetection.ts` - Collision detection hook

**Modified Files:**

- `src/lib/game/gameEngine.ts` - Integrate collision detection
- `src/lib/game/types.ts` - Add collision-related types
- `src/lib/game/constants.ts` - Add collision configuration

**Test Files:**

- `src/lib/game/__tests__/collisionDetection.test.ts` - Collision detection tests
- `src/lib/game/__tests__/boundaries.test.ts` - Boundary collision tests

### Collision Detection Implementation

```typescript
// Collision detection types
interface CollisionResult {
  hasCollision: boolean;
  type: 'boundary' | 'self' | 'none';
  position?: Position;
  details?: string;
}

interface BoundaryConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Main collision detection class
export class CollisionDetector {
  private boundaries: BoundaryConfig;
  private gridSize: number;

  constructor(canvasWidth: number, canvasHeight: number, gridSize: number) {
    this.gridSize = gridSize;
    this.boundaries = {
      top: 0,
      bottom: canvasHeight - gridSize,
      left: 0,
      right: canvasWidth - gridSize,
    };
  }

  public checkAllCollisions(snake: Snake): CollisionResult {
    const head = snake.segments[0];

    // Check boundary collisions first (most common)
    const boundaryCollision = this.checkBoundaryCollision(head);
    if (boundaryCollision.hasCollision) {
      return boundaryCollision;
    }

    // Check self-collision
    const selfCollision = this.checkSelfCollision(
      head,
      snake.segments.slice(1)
    );
    if (selfCollision.hasCollision) {
      return selfCollision;
    }

    return { hasCollision: false, type: 'none' };
  }

  private checkBoundaryCollision(head: Position): CollisionResult {
    if (head.x < this.boundaries.left) {
      return {
        hasCollision: true,
        type: 'boundary',
        position: head,
        details: 'Left boundary collision',
      };
    }

    if (head.x > this.boundaries.right) {
      return {
        hasCollision: true,
        type: 'boundary',
        position: head,
        details: 'Right boundary collision',
      };
    }

    if (head.y < this.boundaries.top) {
      return {
        hasCollision: true,
        type: 'boundary',
        position: head,
        details: 'Top boundary collision',
      };
    }

    if (head.y > this.boundaries.bottom) {
      return {
        hasCollision: true,
        type: 'boundary',
        position: head,
        details: 'Bottom boundary collision',
      };
    }

    return { hasCollision: false, type: 'none' };
  }

  private checkSelfCollision(
    head: Position,
    body: SnakeSegment[]
  ): CollisionResult {
    for (const segment of body) {
      if (head.x === segment.x && head.y === segment.y) {
        return {
          hasCollision: true,
          type: 'self',
          position: head,
          details: `Self-collision with segment ${segment.id}`,
        };
      }
    }

    return { hasCollision: false, type: 'none' };
  }

  public updateBoundaries(canvasWidth: number, canvasHeight: number): void {
    this.boundaries = {
      top: 0,
      bottom: canvasHeight - this.gridSize,
      left: 0,
      right: canvasWidth - this.gridSize,
    };
  }

  public getBoundaries(): BoundaryConfig {
    return { ...this.boundaries };
  }
}
```

### Collision Detection Hook

```typescript
// React hook for collision detection
interface UseCollisionDetectionOptions {
  snake: Snake;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  onCollision: (result: CollisionResult) => void;
  enabled: boolean;
}

export const useCollisionDetection = ({
  snake,
  canvasWidth,
  canvasHeight,
  gridSize,
  onCollision,
  enabled,
}: UseCollisionDetectionOptions) => {
  const detectorRef = useRef<CollisionDetector | null>(null);

  useEffect(() => {
    if (!enabled) return;

    detectorRef.current = new CollisionDetector(
      canvasWidth,
      canvasHeight,
      gridSize
    );
  }, [canvasWidth, canvasHeight, gridSize, enabled]);

  const checkCollisions = useCallback(() => {
    if (!enabled || !detectorRef.current) return null;

    const result = detectorRef.current.checkAllCollisions(snake);
    if (result.hasCollision) {
      onCollision(result);
    }
    return result;
  }, [snake, onCollision, enabled]);

  return { checkCollisions };
};
```

### Performance Optimization

```typescript
// Optimized collision detection for performance
export class OptimizedCollisionDetector extends CollisionDetector {
  private lastCheckedPosition: Position | null = null;
  private lastResult: CollisionResult | null = null;

  public checkAllCollisions(snake: Snake): CollisionResult {
    const head = snake.segments[0];

    // Cache optimization: if head hasn't moved, return cached result
    if (
      this.lastCheckedPosition &&
      this.lastCheckedPosition.x === head.x &&
      this.lastCheckedPosition.y === head.y &&
      this.lastResult
    ) {
      return this.lastResult;
    }

    const result = super.checkAllCollisions(snake);

    // Cache the result
    this.lastCheckedPosition = { ...head };
    this.lastResult = result;

    return result;
  }

  public clearCache(): void {
    this.lastCheckedPosition = null;
    this.lastResult = null;
  }
}
```

## Testing Requirements

### Unit Tests

- Boundary collision detection for all four walls
- Self-collision detection with various snake lengths
- Collision detection accuracy with different grid sizes
- Performance testing with large snake lengths

### Integration Tests

- Collision detection integration with game loop
- Collision event handling and game state changes
- Canvas resize handling and boundary updates

### E2E Scenarios

- Complete collision scenarios during actual gameplay
- Collision detection at various snake speeds
- Edge cases near boundaries and corners

## Dependencies

### Prerequisite Tasks

- T-1.3.1 (Game Canvas and Snake Structure)
- T-1.3.2 (Keyboard Input and Movement Logic)
- T-1.4.1 (Food System and Collision Detection) - for collision utilities

### Blocking Tasks

- None

### External Dependencies

- Game loop system for integration
- Snake data structure for collision checking

## Risks and Considerations

### Technical Risks

- False positive collisions due to floating point errors
- Performance degradation with very long snakes
- Collision detection timing issues with variable frame rates

### Implementation Challenges

- Pixel-perfect collision detection requirements
- Collision detection optimization for smooth gameplay
- Handling edge cases at exact boundary positions

### Mitigation Strategies

- Use integer-based grid coordinates to avoid floating point issues
- Implement collision detection caching for performance
- Add comprehensive test coverage for edge cases
- Use early exit strategies in collision loops

---

**Estimated Duration**: 2-3 hours  
**Risk Level**: Medium  
**Dependencies**: T-1.3.1, T-1.3.2, T-1.4.1  
**Output**: Comprehensive collision detection system with boundary and self-collision capabilities
