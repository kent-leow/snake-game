# Task: Integrate Combo System with Score Management

## Task Header
- **ID**: T-2.2.3
- **Title**: Integrate Combo System with Score Management
- **Story ID**: US-2.2
- **Type**: backend
- **Priority**: high
- **Effort Estimate**: 3-4 hours
- **Complexity**: simple

## Objective
Modify the existing score management system to handle both base food points and combo bonus points, ensuring accurate score calculation and display.

## Description
Update the ScoreManager to calculate and track both base points from food consumption and bonus points from combo completion, providing a unified scoring interface for the game.

## Acceptance Criteria Covered
- GIVEN combo achieved WHEN completed THEN total score includes base points (10) plus combo bonus (5)
- GIVEN combo calculation WHEN processing THEN score updates within 50ms of food consumption

## Implementation Notes
- Extend existing ScoreManager to handle combo bonuses
- Ensure score updates are atomic and performant
- Maintain backward compatibility with existing scoring
- Add score breakdown for debugging and transparency

## Technical Specifications

### File Targets
#### Modified Files
- `src/game/ScoreManager.ts` - Add combo bonus handling
- `src/game/Game.ts` - Update score calculation integration
- `src/types/Score.ts` - Add combo-related score fields

### Component Specifications
```typescript
interface ScoreBreakdown {
  basePoints: number;
  comboBonus: number;
  totalPoints: number;
  timestamp: number;
}

interface GameScore {
  currentScore: number;
  totalCombos: number;
  basePointsEarned: number;
  comboBonusEarned: number;
  averageComboLength: number;
}

class ScoreManager {
  private currentScore: number;
  private totalCombos: number;
  private basePointsEarned: number;
  private comboBonusEarned: number;
  private scoreHistory: ScoreBreakdown[];

  constructor();
  addFoodPoints(basePoints: number): void;
  addComboBonus(bonusPoints: number): void;
  addScore(basePoints: number, comboBonus: number): ScoreBreakdown;
  getCurrentScore(): number;
  getScoreBreakdown(): GameScore;
  getScoreHistory(): ScoreBreakdown[];
  reset(): void;
  
  // Event emitters for UI updates
  onScoreUpdate(callback: (score: GameScore) => void): void;
  private notifyScoreUpdate(): void;
}
```

### Integration Points
```typescript
// In Game.ts - Food consumption handling
const handleFoodConsumption = (foodNumber: 1 | 2 | 3 | 4 | 5) => {
  const comboResult = comboManager.processFood(foodNumber);
  
  // Calculate points
  const basePoints = FOOD_BASE_POINTS; // 10
  const comboBonus = comboResult.pointsAwarded; // 0 or 5
  
  // Update score with breakdown
  const scoreBreakdown = scoreManager.addScore(basePoints, comboBonus);
  
  // Notify UI of score change
  notifyScoreUpdate(scoreBreakdown);
};
```

### Performance Specifications
```typescript
const SCORE_UPDATE_CONFIG = {
  maxUpdateLatency: 50, // ms
  batchSize: 1, // Process immediately for real-time feel
  enableScoreHistory: true,
  maxHistorySize: 1000
};
```

## Testing Requirements

### Unit Tests
- Test base point addition without combo
- Test combo bonus addition with proper calculation
- Test score breakdown accuracy
- Test score history management
- Test performance under rapid score updates

### Integration Tests
- Test score integration with combo system
- Test UI notification triggers
- Test score persistence across game sessions

### E2E Scenarios
- Play game with combos and verify total score accuracy
- Break combos and verify only base points awarded
- Complete multiple combos and verify cumulative scoring

## Dependencies

### Prerequisite Tasks
- T-2.2.1 (Combo State Management)

### Blocking Tasks
None

### External Dependencies
- Existing ScoreManager implementation
- Game event system for score notifications

## Risks and Considerations

### Technical Risks
- **Score Calculation Errors**: Rounding or overflow issues with large scores
- **Performance Degradation**: Frequent score updates impacting game performance

### Implementation Challenges
- **State Synchronization**: Ensuring score and combo state remain consistent
- **Event Timing**: Coordinating score updates with visual feedback

### Mitigation Strategies
- Use integer arithmetic to avoid floating-point errors
- Implement score validation and bounds checking
- Add comprehensive unit tests for edge cases
- Use efficient event handling to minimize performance impact
- Implement score state snapshots for debugging

---

*This task ensures accurate and performant score calculation that properly rewards both basic gameplay and strategic combo execution.*