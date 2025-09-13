# Task: Implement Combo State Management

## Task Header
- **ID**: T-2.2.1
- **Title**: Implement Combo State Management
- **Story ID**: US-2.2
- **Type**: backend
- **Priority**: high
- **Effort Estimate**: 5-7 hours
- **Complexity**: moderate

## Objective
Create a comprehensive combo tracking system that monitors the sequence of food consumption, manages combo progress, and handles bonus point calculations.

## Description
Implement a state machine-based combo system that tracks the player's progress through the 1→2→3→4→5 sequence, awards bonus points for completion, and resets appropriately when the sequence is broken.

## Acceptance Criteria Covered
- GIVEN player eats food blocks in sequence 1→2→3→4→5 WHEN sequence completes THEN combo bonus of 5 points is awarded
- GIVEN player eating food blocks in correct sequence WHEN next correct number eaten THEN combo progress advances
- GIVEN player eating food blocks WHEN wrong number in sequence eaten THEN combo progress resets to 0
- GIVEN combo completion WHEN achieved THEN new combo tracking begins immediately

## Implementation Notes
- Use state machine pattern for robust sequence tracking
- Integrate with existing scoring system
- Ensure thread-safe state updates
- Provide clear APIs for UI components to display progress

## Technical Specifications

### File Targets
#### New Files
- `src/game/ComboManager.ts` - Core combo logic and state management
- `src/types/Combo.ts` - TypeScript interfaces for combo system
- `src/constants/ComboConfig.ts` - Combo configuration constants

#### Modified Files
- `src/game/Game.ts` - Integrate combo system with food consumption
- `src/game/ScoreManager.ts` - Update to handle combo bonus points

### Component Specifications
```typescript
interface ComboState {
  currentSequence: number[]; // Numbers eaten in current attempt
  expectedNext: 1 | 2 | 3 | 4 | 5; // Next number needed for combo
  comboProgress: 0 | 1 | 2 | 3 | 4 | 5; // How far through sequence (0-5)
  totalCombos: number; // Total combos completed this game
  isComboActive: boolean; // Whether player is in middle of sequence
}

interface ComboResult {
  type: 'progress' | 'complete' | 'broken';
  newState: ComboState;
  pointsAwarded: number;
  message?: string;
}

class ComboManager {
  private state: ComboState;
  private readonly COMBO_BONUS_POINTS = 5;
  private readonly BASE_FOOD_POINTS = 10;

  constructor();
  processFood(consumedNumber: 1 | 2 | 3 | 4 | 5): ComboResult;
  getCurrentState(): ComboState;
  reset(): void;
  private advanceSequence(number: number): ComboResult;
  private completeCombo(): ComboResult;
  private breakCombo(): ComboResult;
  private isExpectedNumber(number: number): boolean;
}
```

### State Machine Logic
```typescript
enum ComboStateType {
  WAITING_FOR_ONE = 'WAITING_FOR_ONE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

const COMBO_SEQUENCE = [1, 2, 3, 4, 5] as const;
const SEQUENCE_LENGTH = 5;
```

### DTO Definitions
```typescript
interface FoodConsumptionEvent {
  foodNumber: 1 | 2 | 3 | 4 | 5;
  position: Position;
  timestamp: number;
}

interface ComboEvent {
  type: 'started' | 'progress' | 'completed' | 'broken';
  sequence: number[];
  progress: number;
  totalPoints: number;
  timestamp: number;
}
```

## Testing Requirements

### Unit Tests
- Test sequence progression through 1→2→3→4→5
- Test combo break when wrong number consumed
- Test multiple combo completions in succession
- Test state transitions and edge cases
- Test point calculation accuracy

### Integration Tests
- Test integration with food consumption system
- Test combo state persistence during game
- Test UI notification triggers

### E2E Scenarios
- Complete full combo sequence and verify bonus points
- Break combo at each step and verify reset
- Complete multiple combos and verify cumulative scoring

## Dependencies

### Prerequisite Tasks
- T-2.1.1 (Multiple Food Block System)

### Blocking Tasks
None

### External Dependencies
- Existing ScoreManager for point integration

## Risks and Considerations

### Technical Risks
- **State Corruption**: Combo state becoming inconsistent
- **Performance**: Frequent state updates impacting game performance

### Implementation Challenges
- **Concurrent Updates**: Ensuring atomic state transitions
- **Error Recovery**: Handling unexpected state scenarios

### Mitigation Strategies
- Implement immutable state updates
- Add comprehensive state validation
- Use TypeScript strict mode for type safety
- Implement state snapshots for debugging
- Add extensive unit test coverage for edge cases

---

*This task creates the core logical foundation for the combo system that drives strategic gameplay.*