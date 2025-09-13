# User Story: Collision Detection and Game Over

## Story Header
- **ID**: US-1.5
- **Title**: Collision Detection and Game Over
- **Phase**: phase-1
- **Priority**: critical
- **Size**: S
- **Source Requirements**: [FR-003]

## Story
**As a** Alex (casual gamer)  
**I want** the game to end when the snake hits walls or itself  
**So that** there are clear rules and consequences that create challenge and replayability

## Context
Essential game mechanic that defines the lose condition for the snake game. Without proper collision detection and game over states, there would be no challenge or defined end to gameplay sessions.

## Role
Alex represents casual gamers who expect clear rules and immediate feedback when game-ending situations occur.

## Functionality
- Detect collision between snake head and game boundaries
- Detect collision between snake head and snake body
- Immediate game over when collision occurs
- Display game over message with final score
- Option to restart game or return to main menu

## Business Value
Establishes the challenge and replay value that keeps players engaged by providing clear consequences for mistakes and motivation to improve performance.

## Acceptance Criteria

### Functional
- GIVEN snake moving WHEN head hits top boundary THEN game ends immediately
- GIVEN snake moving WHEN head hits bottom boundary THEN game ends immediately
- GIVEN snake moving WHEN head hits left boundary THEN game ends immediately
- GIVEN snake moving WHEN head hits right boundary THEN game ends immediately
- GIVEN snake moving WHEN head collides with body segment THEN game ends immediately
- GIVEN game over WHEN it occurs THEN game loop stops and no further movement happens

### Non-Functional
- GIVEN collision detection WHEN checking boundaries THEN response is immediate (within 50ms)
- GIVEN collision detection WHEN checking self-collision THEN accurate to pixel level
- GIVEN game over state WHEN triggered THEN game stops smoothly without lag
- GIVEN game over screen WHEN displayed THEN loads within 200ms

### UI/UX
- GIVEN game over WHEN it occurs THEN clear "Game Over" message displays
- GIVEN game over screen WHEN shown THEN final score is prominently displayed
- GIVEN game over screen WHEN shown THEN restart and menu options are clearly visible
- GIVEN collision moment WHEN it happens THEN visual feedback indicates the collision point

## Metadata

### Definition of Done
- [ ] Boundary collision detection implemented for all four walls
- [ ] Self-collision detection works for snake hitting its own body
- [ ] Game loop stops immediately upon collision
- [ ] Game over screen displays with final score
- [ ] Restart game functionality available from game over screen
- [ ] Return to main menu option available
- [ ] Collision detection is accurate and responsive
- [ ] Visual feedback clearly indicates collision

### Technical Notes
- Implement collision detection in main game loop
- Check boundary conditions based on canvas dimensions
- Use array/list iteration to check self-collision with all body segments
- Stop game loop using game state management
- Create game over UI component with score display
- Consider visual effects to highlight collision moment

### Test Scenarios
- Move snake into each of the four boundaries and verify game over
- Grow snake and turn it to collide with its own body
- Verify game stops immediately and doesn't continue moving
- Test restart functionality returns to fresh game state
- Verify final score matches accumulated points
- Test game over screen UI elements function correctly

### Dependencies
- US-1.3 (Basic Snake Movement)
- US-1.4 (Food Consumption and Snake Growth)

### Implementation Tasks
- **T-1.5.1**: Game Over Detection and Handling

---

*Story provides the essential challenge mechanism that creates defined gameplay sessions and motivates player improvement.*