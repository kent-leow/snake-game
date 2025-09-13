# Task: Implement Progressive Speed System

## Task Header

- **ID**: T-2.3.1
- **Title**: Implement Progressive Speed System
- **Story ID**: US-2.3
- **Type**: backend
- **Priority**: high
- **Effort Estimate**: 4-5 hours
- **Complexity**: moderate

## Objective

Create a dynamic speed management system that increases snake movement speed with each completed combo and resets to base speed when combos are broken, with appropriate maximum limits.

## Description

Implement a speed progression system that responds to combo events, providing escalating difficulty that rewards skillful play while maintaining playability through proper speed caps and smooth transitions.

## Acceptance Criteria Covered

- GIVEN combo completed WHEN sequence 1→2→3→4→5 finishes THEN snake speed increases by one increment
- GIVEN combo broken WHEN wrong food eaten THEN snake speed resets to base level immediately
- GIVEN speed increases WHEN multiple combos completed THEN each combo adds one speed increment
- GIVEN maximum speed WHEN reached THEN speed increases stop at defined cap

## Implementation Notes

- Integrate with existing game loop timing
- Use smooth speed transitions to maintain control responsiveness
- Implement configurable speed progression curve
- Add speed level visualization for player feedback

## Technical Specifications

### File Targets

#### New Files

- `src/game/SpeedManager.ts` - Core speed progression logic
- `src/constants/SpeedConfig.ts` - Speed configuration and progression curves
- `src/types/Speed.ts` - TypeScript interfaces for speed system

#### Modified Files

- `src/game/Game.ts` - Integrate speed changes with game loop
- `src/game/GameLoop.ts` - Update timing calculations for variable speed

### Component Specifications

```typescript
interface SpeedConfig {
  baseSpeed: number; // Initial movement speed (ms between moves)
  speedIncrement: number; // Speed increase per combo
  maxSpeed: number; // Maximum speed cap
  minSpeed: number; // Minimum playable speed
  transitionDuration: number; // Smooth transition time (ms)
}

interface SpeedState {
  currentSpeed: number;
  speedLevel: number; // Number of completed combos
  isTransitioning: boolean;
  targetSpeed: number;
}

class SpeedManager {
  private config: SpeedConfig;
  private state: SpeedState;
  private transitionStartTime: number;

  constructor(config: SpeedConfig);
  onComboCompleted(): void;
  onComboBreak(): void;
  getCurrentSpeed(): number;
  getSpeedLevel(): number;
  getSpeedState(): SpeedState;
  update(deltaTime: number): void; // For smooth transitions

  // Event handling
  onSpeedChange(callback: (state: SpeedState) => void): void;
  private notifySpeedChange(): void;
  private calculateTargetSpeed(comboLevel: number): number;
  private startTransition(targetSpeed: number): void;
}
```

### Speed Configuration

```typescript
const DEFAULT_SPEED_CONFIG: SpeedConfig = {
  baseSpeed: 150, // 150ms between moves (moderate pace)
  speedIncrement: 15, // Decrease by 15ms per combo
  maxSpeed: 60, // Maximum speed (fastest playable)
  minSpeed: 300, // Minimum speed (slowest)
  transitionDuration: 500, // 500ms smooth transition
};

// Speed progression curve
const calculateSpeedCurve = (
  comboLevel: number,
  config: SpeedConfig
): number => {
  const rawSpeed = config.baseSpeed - comboLevel * config.speedIncrement;
  return Math.max(rawSpeed, config.maxSpeed);
};
```

### Game Loop Integration

```typescript
// In GameLoop.ts
class GameLoop {
  private speedManager: SpeedManager;
  private lastMoveTime: number;

  update(currentTime: number): void {
    this.speedManager.update(currentTime - this.lastMoveTime);

    const currentSpeed = this.speedManager.getCurrentSpeed();

    if (currentTime - this.lastMoveTime >= currentSpeed) {
      this.moveSnake();
      this.lastMoveTime = currentTime;
    }
  }
}
```

## Testing Requirements

### Unit Tests

- Test speed increase on combo completion
- Test speed reset on combo break
- Test maximum speed cap enforcement
- Test smooth transition calculations
- Test edge cases with rapid combo changes

### Integration Tests

- Test speed integration with game loop timing
- Test speed changes during active gameplay
- Test performance impact of speed calculations

### E2E Scenarios

- Complete combos and verify speed increases feel natural
- Break combo and verify immediate speed reset
- Reach maximum speed and verify cap is enforced
- Test control responsiveness at all speed levels

## Dependencies

### Prerequisite Tasks

- T-2.2.1 (Combo State Management)

### Blocking Tasks

None

### External Dependencies

- Game loop timing system
- Combo event notifications

## Risks and Considerations

### Technical Risks

- **Control Responsiveness**: High speeds making game unplayable
- **Transition Smoothness**: Jarring speed changes disrupting gameplay

### Implementation Challenges

- **Timing Precision**: Accurate speed calculations affecting game feel
- **Performance Impact**: Speed calculations affecting frame rate

### Mitigation Strategies

- Implement extensive playtesting at various speed levels
- Use smooth interpolation for speed transitions
- Add configurable difficulty settings for different player skill levels
- Monitor performance impact of frequent speed calculations
- Provide visual feedback for current speed level

---

_This task creates dynamic difficulty progression that enhances the strategic combo system with meaningful speed-based consequences._
