# Task: Implement Food Block Visual Design

## Task Header

- **ID**: T-2.1.2
- **Title**: Implement Food Block Visual Design
- **Story ID**: US-2.1
- **Type**: frontend
- **Priority**: high
- **Effort Estimate**: 3-4 hours
- **Complexity**: simple

## Objective

Create visually distinct rendering for numbered food blocks with clear numbering, distinct colors, and responsive design that works across all screen sizes.

## Description

Design and implement the visual representation of numbered food blocks on the canvas, ensuring each number (1-5) is clearly readable and visually distinct through color coding and typography.

## Acceptance Criteria Covered

- GIVEN numbered food blocks WHEN displayed THEN each number is clearly readable
- GIVEN food blocks WHEN rendered THEN distinct visual styling makes them easily identifiable
- GIVEN mobile viewing WHEN displaying THEN food block numbers remain legible on small screens
- GIVEN food blocks WHEN present THEN color or styling helps distinguish from snake and background

## Implementation Notes

- Create rendering methods for numbered food blocks
- Implement responsive font sizing based on grid size
- Design color scheme that provides good contrast and accessibility
- Ensure visual consistency with overall game aesthetic

## Technical Specifications

### File Targets

#### New Files

- `src/game/FoodRenderer.ts` - Dedicated food rendering logic
- `src/constants/FoodColors.ts` - Color definitions for food blocks

#### Modified Files

- `src/components/GameCanvas.tsx` - Update rendering logic
- `src/styles/game.module.css` - Add food-related styles if needed

### Component Specifications

```typescript
interface FoodRenderConfig {
  colors: Record<1 | 2 | 3 | 4 | 5, string>;
  fontSize: number;
  fontFamily: string;
  borderWidth: number;
  borderColor: string;
}

class FoodRenderer {
  private config: FoodRenderConfig;
  private gridSize: number;

  constructor(gridSize: number);
  renderFood(ctx: CanvasRenderingContext2D, food: NumberedFood): void;
  updateGridSize(newGridSize: number): void;
  private calculateFontSize(): number;
  private renderBackground(
    ctx: CanvasRenderingContext2D,
    position: Position,
    color: string
  ): void;
  private renderNumber(
    ctx: CanvasRenderingContext2D,
    position: Position,
    number: number
  ): void;
}
```

### Design Specifications

```typescript
const FOOD_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#FF6B6B', // Red
  2: '#4ECDC4', // Teal
  3: '#45B7D1', // Blue
  4: '#96CEB4', // Green
  5: '#FECA57', // Yellow
};

const FOOD_STYLE = {
  borderWidth: 2,
  borderColor: '#2C3E50',
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  textBaseline: 'middle' as const,
};
```

## Testing Requirements

### Unit Tests

- Test font size calculation for different grid sizes
- Test color assignment for each food number
- Test rendering with various canvas contexts

### Integration Tests

- Test food rendering integration with game canvas
- Test visual appearance across different screen resolutions
- Test accessibility contrast ratios

### E2E Scenarios

- Verify food blocks are visually distinct in actual gameplay
- Test readability on mobile devices
- Validate color accessibility for colorblind users

## Dependencies

### Prerequisite Tasks

- T-2.1.1 (Multiple Food Block System)

### Blocking Tasks

None

### External Dependencies

- Canvas API 2D context
- Browser font rendering capabilities

## Risks and Considerations

### Technical Risks

- **Font Rendering**: Inconsistent font rendering across browsers
- **Mobile Legibility**: Text too small on mobile devices

### Implementation Challenges

- **Color Accessibility**: Ensuring colors work for colorblind users
- **Performance**: Efficient text rendering on each frame

### Mitigation Strategies

- Use web-safe fonts with fallbacks
- Implement minimum font size constraints
- Test colors with accessibility tools
- Cache font measurements for performance
- Provide high contrast mode option

---

_This task ensures numbered food blocks are visually clear and accessible across all devices and user needs._
