# Task: Implement Multiple Food Block System

## Task Header
- **ID**: T-2.1.1
- **Title**: Implement Multiple Food Block System
- **Story ID**: US-2.1
- **Type**: backend
- **Priority**: high
- **Effort Estimate**: 4-6 hours
- **Complexity**: moderate

## Objective
Extend the existing food system to generate and manage 5 numbered food blocks (1-5) simultaneously on the game board with proper collision detection and spawning logic.

## Description
Replace the single food item system with a multi-food system that maintains exactly 5 numbered food blocks on the board at all times. Implement robust spawning logic that prevents overlaps and ensures new food appears immediately when consumed.

## Acceptance Criteria Covered
- GIVEN game starts WHEN board initializes THEN exactly 5 food blocks appear with numbers 1, 2, 3, 4, 5
- GIVEN food block consumed WHEN eaten by snake THEN new food block appears with the same number at different location
- GIVEN food blocks WHEN spawning THEN none appear on snake body segments
- GIVEN food blocks WHEN spawning THEN none overlap with other food blocks

## Implementation Notes
- Modify existing Food class to support numbered food blocks
- Implement FoodManager class to handle multiple food instances
- Update collision detection to check against array of food blocks
- Add spawning logic with collision avoidance for snake and other food blocks

## Technical Specifications

### File Targets
#### New Files
- `src/game/FoodManager.ts` - Manages multiple food blocks
- `src/types/Food.ts` - TypeScript interfaces for food system

#### Modified Files
- `src/game/Game.ts` - Update to use FoodManager instead of single food
- `src/game/Snake.ts` - Update collision detection for multiple foods
- `src/components/GameCanvas.tsx` - Update rendering for multiple food blocks

### API Endpoints
None required for this task.

### Database Changes
None required for this task.

### Component Specifications
```typescript
interface NumberedFood {
  id: string;
  number: 1 | 2 | 3 | 4 | 5;
  position: Position;
  color: string;
}

class FoodManager {
  private foods: NumberedFood[];
  private gridSize: number;
  private boardWidth: number;
  private boardHeight: number;

  constructor(gridSize: number, boardWidth: number, boardHeight: number);
  initializeFoods(snakePositions: Position[]): void;
  getFoods(): NumberedFood[];
  consumeFood(number: number, snakePositions: Position[]): NumberedFood | null;
  private generateValidPosition(snakePositions: Position[], existingFoods: Position[]): Position;
  private createFood(number: 1 | 2 | 3 | 4 | 5, position: Position): NumberedFood;
}
```

### DTO Definitions
```typescript
interface Position {
  x: number;
  y: number;
}

interface FoodConsumptionResult {
  consumedFood: NumberedFood;
  newFood: NumberedFood;
}
```

## Testing Requirements

### Unit Tests
- Test FoodManager initialization with 5 unique numbered foods
- Test food consumption and replacement logic
- Test collision avoidance during spawning
- Test edge cases when board space is limited

### Integration Tests
- Test integration with existing Snake collision detection
- Test rendering of multiple food blocks on canvas
- Test food consumption affecting snake growth

### E2E Scenarios
- Start game and verify 5 numbered food blocks appear
- Consume each food type and verify replacement spawns
- Play until board is nearly full and verify spawning still works

## Dependencies

### Prerequisite Tasks
- Phase 1 foundation must be complete
- Basic snake movement and collision detection must be working

### Blocking Tasks
None - this is the foundation task for phase 2.

### External Dependencies
- Canvas API for rendering
- TypeScript compiler for type checking

## Risks and Considerations

### Technical Risks
- **Performance Impact**: Multiple collision detection checks may impact frame rate
- **Spawning Deadlocks**: Limited board space could prevent valid food spawning

### Implementation Challenges
- **State Synchronization**: Ensuring food state remains consistent across game components
- **Visual Distinction**: Making numbered foods clearly distinguishable

### Mitigation Strategies
- Implement efficient spatial partitioning for collision detection
- Add fallback logic for spawning when board space is limited
- Use distinct colors and clear typography for food numbers
- Implement comprehensive unit tests for edge cases

---

*This task establishes the foundation for the numbered food system required for strategic combo gameplay.*