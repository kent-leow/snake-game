# Task: Food System and Collision Detection

## Task Header
- **ID**: T-1.4.1
- **Title**: Implement food spawning system and collision detection
- **Story ID**: US-1.4
- **Type**: frontend
- **Priority**: critical
- **Effort Estimate**: 3-4 hours
- **Complexity**: moderate

## Task Content

### Objective
Create a comprehensive food system that spawns food items randomly on the game board, detects collisions between snake head and food, and ensures food never spawns on the snake's body.

### Description
Build the food management system that provides the core reward mechanism for the snake game, including intelligent food placement that avoids conflicts with the snake's current position and accurate collision detection for seamless gameplay.

### Acceptance Criteria Covered
- GIVEN food on game board WHEN snake head touches food THEN food is consumed
- GIVEN food consumed WHEN consumption occurs THEN new food appears at random location
- GIVEN new food spawning WHEN location chosen THEN food does not appear on snake body
- GIVEN food collision detection WHEN checking THEN accuracy is pixel-perfect

### Implementation Notes
1. Implement food data structure and management
2. Create random food placement algorithm with collision avoidance
3. Implement precise collision detection between snake head and food
4. Add food rendering and visual feedback systems
5. Ensure consistent food spawning timing and placement

## Technical Specs

### File Targets
**New Files:**
- `src/lib/game/food.ts` - Food system implementation
- `src/lib/game/foodRenderer.ts` - Food rendering utilities
- `src/lib/game/collisionDetection.ts` - Collision detection system
- `src/lib/utils/randomPosition.ts` - Random positioning utilities

**Modified Files:**
- `src/lib/game/gameEngine.ts` - Integrate food system
- `src/lib/game/types.ts` - Add food-related types
- `src/lib/game/constants.ts` - Add food configuration

**Test Files:**
- `src/lib/game/__tests__/food.test.ts` - Food system tests
- `src/lib/game/__tests__/collisionDetection.test.ts` - Collision tests

### Food System Implementation
```typescript
// Food types and interfaces
interface Food {
  position: Position;
  value: number;
  id: string;
  type: 'normal' | 'bonus';
  timestamp: number;
}

interface FoodSpawnOptions {
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
  occupiedPositions: Position[];
}

// Food management class
export class FoodManager {
  private currentFood: Food | null = null;
  private gridSize: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(gridSize: number, canvasWidth: number, canvasHeight: number) {
    this.gridSize = gridSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  public spawnFood(occupiedPositions: Position[]): Food {
    let attempts = 0;
    const maxAttempts = 100;
    let position: Position;

    do {
      position = this.generateRandomPosition();
      attempts++;
    } while (
      this.isPositionOccupied(position, occupiedPositions) && 
      attempts < maxAttempts
    );

    if (attempts >= maxAttempts) {
      // Fallback: find first available position
      position = this.findFirstAvailablePosition(occupiedPositions);
    }

    this.currentFood = {
      position,
      value: 10,
      id: `food-${Date.now()}-${Math.random()}`,
      type: 'normal',
      timestamp: Date.now()
    };

    return this.currentFood;
  }

  private generateRandomPosition(): Position {
    const maxX = Math.floor(this.canvasWidth / this.gridSize) - 1;
    const maxY = Math.floor(this.canvasHeight / this.gridSize) - 1;

    return {
      x: Math.floor(Math.random() * maxX) * this.gridSize,
      y: Math.floor(Math.random() * maxY) * this.gridSize
    };
  }

  private isPositionOccupied(position: Position, occupiedPositions: Position[]): boolean {
    return occupiedPositions.some(occupied => 
      occupied.x === position.x && occupied.y === position.y
    );
  }

  private findFirstAvailablePosition(occupiedPositions: Position[]): Position {
    for (let y = 0; y < this.canvasHeight; y += this.gridSize) {
      for (let x = 0; x < this.canvasWidth; x += this.gridSize) {
        const position = { x, y };
        if (!this.isPositionOccupied(position, occupiedPositions)) {
          return position;
        }
      }
    }
    // Ultimate fallback
    return { x: 0, y: 0 };
  }

  public getCurrentFood(): Food | null {
    return this.currentFood;
  }

  public clearFood(): void {
    this.currentFood = null;
  }
}
```

### Collision Detection System
```typescript
// Collision detection utilities
export class CollisionDetector {
  private gridSize: number;

  constructor(gridSize: number) {
    this.gridSize = gridSize;
  }

  public checkFoodCollision(snakeHead: Position, food: Food): boolean {
    return (
      snakeHead.x === food.position.x &&
      snakeHead.y === food.position.y
    );
  }

  public checkWallCollision(position: Position, canvasWidth: number, canvasHeight: number): boolean {
    return (
      position.x < 0 ||
      position.x >= canvasWidth ||
      position.y < 0 ||
      position.y >= canvasHeight
    );
  }

  public checkSelfCollision(head: Position, body: Position[]): boolean {
    // Skip the head itself (first element)
    return body.slice(1).some(segment =>
      segment.x === head.x && segment.y === head.y
    );
  }

  // Bounding box collision for more precise detection if needed
  public checkBoundingBoxCollision(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
}
```

### Food Rendering
```typescript
// Food rendering utilities
export class FoodRenderer {
  private context: CanvasRenderingContext2D;
  private gridSize: number;

  constructor(context: CanvasRenderingContext2D, gridSize: number) {
    this.context = context;
    this.gridSize = gridSize;
  }

  public renderFood(food: Food): void {
    if (!food) return;

    this.context.fillStyle = GAME_CONFIG.COLORS.FOOD;
    this.context.fillRect(
      food.position.x,
      food.position.y,
      this.gridSize,
      this.gridSize
    );

    // Add visual enhancement for food
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 1;
    this.context.strokeRect(
      food.position.x,
      food.position.y,
      this.gridSize,
      this.gridSize
    );
  }

  public renderFoodWithAnimation(food: Food, animationTime: number): void {
    if (!food) return;

    // Pulsing animation
    const pulseScale = 1 + Math.sin(animationTime * 0.005) * 0.1;
    const scaledSize = this.gridSize * pulseScale;
    const offset = (this.gridSize - scaledSize) / 2;

    this.context.fillStyle = GAME_CONFIG.COLORS.FOOD;
    this.context.fillRect(
      food.position.x + offset,
      food.position.y + offset,
      scaledSize,
      scaledSize
    );
  }
}
```

## Testing Requirements

### Unit Tests
- Food spawning in valid positions
- Collision detection accuracy
- Food placement avoids snake body
- Random position generation within bounds

### Integration Tests
- Food system integrates with game loop
- Collision detection works with snake movement
- Food rendering updates correctly

### E2E Scenarios
- Complete food consumption cycle
- Food spawning after consumption
- Edge cases with limited available space

## Dependencies

### Prerequisite Tasks
- T-1.3.1 (Game Canvas and Snake Structure)
- T-1.3.2 (Keyboard Input and Movement Logic)

### Blocking Tasks
- None

### External Dependencies
- Canvas rendering context
- Game grid system

## Risks and Considerations

### Technical Risks
- Infinite loops in food placement when board is nearly full
- Collision detection accuracy with different grid sizes
- Performance impact of collision checking

### Implementation Challenges
- Balancing random placement with guaranteed valid positions
- Ensuring pixel-perfect collision detection
- Managing food state during game pause/resume

### Mitigation Strategies
- Implement maximum attempt limits for food placement
- Use grid-based collision detection for accuracy
- Add comprehensive testing for edge cases
- Implement fallback positioning algorithms

---

**Estimated Duration**: 3-4 hours  
**Risk Level**: Medium  
**Dependencies**: T-1.3.1, T-1.3.2  
**Output**: Complete food system with spawning, collision detection, and rendering capabilities