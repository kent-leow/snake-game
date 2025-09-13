# User Story: Food Consumption and Snake Growth

## Story Header
- **ID**: US-1.4
- **Title**: Food Consumption and Snake Growth
- **Phase**: phase-1
- **Priority**: critical
- **Size**: M
- **Source Requirements**: [FR-002, FR-006]

## Story
**As a** Alex (casual gamer)  
**I want** the snake to grow longer when it eats food and earn points  
**So that** I can see progress and feel rewarded for successful gameplay

## Context
A fundamental snake game mechanic where consuming food causes the snake to grow and increases the player's score. This provides immediate feedback and creates the progressive challenge that makes snake games engaging.

## Role
Alex represents casual gamers who expect clear visual feedback and immediate rewards for successful actions in games.

## Functionality
- Single food item appears on game board
- Snake grows by one segment when eating food
- New food appears after consumption
- Score increases by 10 points per food consumed
- Visual feedback for successful food consumption

## Business Value
Creates the core reward mechanism that motivates continued play and provides the foundation for scoring and progression systems.

## Acceptance Criteria

### Functional
- GIVEN food on game board WHEN snake head touches food THEN food is consumed
- GIVEN food consumed WHEN consumption occurs THEN snake length increases by one segment
- GIVEN food consumed WHEN consumption occurs THEN score increases by 10 points
- GIVEN food consumed WHEN consumption occurs THEN new food appears at random location
- GIVEN new food spawning WHEN location chosen THEN food does not appear on snake body
- GIVEN score display WHEN points increase THEN current score updates immediately

### Non-Functional
- GIVEN food consumption WHEN it occurs THEN response is immediate (within 50ms)
- GIVEN food spawning WHEN triggered THEN new food appears within 100ms
- GIVEN score updates WHEN they occur THEN display updates smoothly without flicker
- GIVEN food collision detection WHEN checking THEN accuracy is pixel-perfect

### UI/UX
- GIVEN food on board WHEN displayed THEN clearly distinguishable from snake and background
- GIVEN snake growth WHEN it occurs THEN new segment appears naturally at tail
- GIVEN score increase WHEN it happens THEN visual feedback confirms the action
- GIVEN food consumption WHEN it occurs THEN brief visual effect indicates success

## Metadata

### Definition of Done
- [ ] Food item renders visibly on game canvas
- [ ] Collision detection works between snake head and food
- [ ] Snake grows by one segment when food is consumed
- [ ] Score increases by 10 points per food consumption
- [ ] New food spawns randomly after consumption
- [ ] Food never spawns on snake body
- [ ] Score displays and updates in real-time
- [ ] Visual feedback confirms food consumption

### Technical Notes
- Implement collision detection using bounding box or pixel detection
- Use random number generation for food placement with validation
- Ensure snake growth animation is smooth and natural
- Store snake segments in array/list for easy manipulation
- Update score state immediately upon food consumption
- Consider food appearance styling to make it visually appealing

### Test Scenarios
- Move snake to food and verify consumption, growth, and score increase
- Verify new food spawns immediately and not on snake body
- Test multiple food consumptions to confirm consistent behavior
- Verify score accumulation over multiple food items
- Test edge cases like food spawning near boundaries
- Confirm visual feedback provides clear indication of success

### Dependencies
- US-1.3 (Basic Snake Movement)

### Implementation Tasks
- **T-1.4.1**: Food Generation and Placement System
- **T-1.4.2**: Scoring System and UI Display

---

*Story establishes the core reward and progression mechanism that makes the snake game engaging and provides measurable progress.*