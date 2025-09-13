# Task: Implement Speed Level UI Indicator

## Task Header

- **ID**: T-2.3.2
- **Title**: Implement Speed Level UI Indicator
- **Story ID**: US-2.3
- **Type**: frontend
- **Priority**: medium
- **Effort Estimate**: 2-3 hours
- **Complexity**: simple

## Objective

Create a visual indicator that displays the current speed level to players, showing both the numeric level and providing visual feedback for speed changes.

## Description

Design and implement a UI component that clearly shows the current speed level, provides visual feedback when speed changes occur, and helps players understand the relationship between combos and speed progression.

## Acceptance Criteria Covered

- GIVEN speed changes WHEN occurring THEN visual indicator shows current speed level
- GIVEN current speed WHEN displayed THEN player can see their current speed level

## Implementation Notes

- Create a subtle but clear speed indicator that doesn't obstruct gameplay
- Use animations to highlight speed changes
- Ensure indicator is readable at all screen sizes
- Consider accessibility for colorblind users

## Technical Specifications

### File Targets

#### New Files

- `src/components/SpeedIndicator.tsx` - Speed level display component
- `src/styles/speed-indicator.module.css` - Speed indicator styling

#### Modified Files

- `src/components/GameUI.tsx` - Add speed indicator to game interface

### Component Specifications

```typescript
interface SpeedIndicatorProps {
  speedLevel: number;
  currentSpeed: number;
  baseSpeed: number;
  isTransitioning: boolean;
  maxLevel?: number;
}

const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({
  speedLevel,
  currentSpeed,
  baseSpeed,
  isTransitioning,
  maxLevel = 10
}) => {
  const speedPercentage = ((baseSpeed - currentSpeed) / baseSpeed) * 100;

  return (
    <div className={styles.speedIndicator}>
      <div className={styles.speedLabel}>
        Speed Level: {speedLevel}
      </div>
      <div className={styles.speedBar}>
        <div
          className={`${styles.speedFill} ${isTransitioning ? styles.transitioning : ''}`}
          style={{ width: `${Math.min(speedPercentage, 100)}%` }}
        />
      </div>
      <div className={styles.speedValue}>
        {Math.round((baseSpeed / currentSpeed) * 100)}% speed
      </div>
    </div>
  );
};
```

### CSS Styling

```css
.speedIndicator {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-size: 14px;
  min-width: 120px;
  z-index: 10;
}

.speedLabel {
  font-weight: bold;
  margin-bottom: 4px;
  text-align: center;
}

.speedBar {
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin: 4px 0;
}

.speedFill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #ffc107 50%, #f44336 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.speedFill.transitioning {
  animation: speedPulse 0.5s ease-in-out;
}

.speedValue {
  font-size: 12px;
  text-align: center;
  opacity: 0.8;
}

@keyframes speedPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .speedIndicator {
    top: 10px;
    right: 10px;
    padding: 8px;
    font-size: 12px;
    min-width: 100px;
  }

  .speedBar {
    height: 6px;
  }
}
```

### Animation and Feedback

```typescript
const useSpeedAnimation = (speedLevel: number) => {
  const [previousLevel, setPreviousLevel] = useState(speedLevel);
  const [showChange, setShowChange] = useState(false);

  useEffect(() => {
    if (speedLevel !== previousLevel) {
      setShowChange(true);
      setPreviousLevel(speedLevel);

      const timer = setTimeout(() => {
        setShowChange(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [speedLevel, previousLevel]);

  return { showChange, isIncreasing: speedLevel > previousLevel };
};
```

## Testing Requirements

### Unit Tests

- Test speed indicator rendering with different speed levels
- Test animation triggers on speed changes
- Test responsive design across screen sizes

### Integration Tests

- Test speed indicator integration with speed manager
- Test real-time updates during gameplay
- Test accessibility features

### E2E Scenarios

- Verify speed indicator updates when combos are completed
- Test indicator resets when combos are broken
- Validate mobile display and readability

## Dependencies

### Prerequisite Tasks

- T-2.3.1 (Progressive Speed System)

### Blocking Tasks

None

### External Dependencies

- React for component rendering
- CSS modules for styling

## Risks and Considerations

### Technical Risks

- **Screen Real Estate**: Indicator taking up too much space on mobile
- **Performance**: Frequent updates affecting rendering performance

### Implementation Challenges

- **Visual Design**: Making indicator informative but not distracting
- **Accessibility**: Ensuring indicator works for users with visual impairments

### Mitigation Strategies

- Use minimal, clean design that's easy to ignore when not needed
- Implement smooth animations to draw attention only when speed changes
- Test on multiple device sizes for optimal placement
- Use semantic HTML and ARIA labels for accessibility
- Consider making indicator hideable for advanced players

---

_This task provides clear visual feedback about speed progression, helping players understand the consequences of their strategic choices._
