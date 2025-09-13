# User Story: Basic Snake Movement

## Story Header

- **ID**: US-1.3
- **Title**: Basic Snake Movement
- **Phase**: phase-1
- **Priority**: critical
- **Size**: M
- **Source Requirements**: [FR-001]

## Story

**As a** Alex (casual gamer)  
**I want** to control the snake's movement using arrow keys or WASD  
**So that** I can play the classic snake game and enjoy smooth, responsive controls

## Context

The core mechanic of any snake game is the ability to control the snake's movement. This story implements the fundamental gameplay interaction that all other game features will build upon.

## Role

Alex represents casual gamers who expect intuitive controls and immediate responsiveness when playing games.

## Functionality

- Snake moves continuously in the current direction
- Arrow keys or WASD change snake direction
- Snake cannot reverse directly into itself
- Smooth movement animation on game canvas
- Consistent movement speed

## Business Value

Provides the essential gameplay mechanic that makes the application a functional game, enabling user engagement and the foundation for all advanced features.

## Acceptance Criteria

### Functional

- GIVEN game is running WHEN user presses up arrow or W THEN snake moves upward
- GIVEN game is running WHEN user presses down arrow or S THEN snake moves downward
- GIVEN game is running WHEN user presses left arrow or A THEN snake moves leftward
- GIVEN game is running WHEN user presses right arrow or D THEN snake moves rightward
- GIVEN snake moving right WHEN user presses left arrow THEN snake continues moving right (no reverse)
- GIVEN snake moving in any direction WHEN no input given THEN snake continues in current direction

### Non-Functional

- GIVEN control input WHEN key is pressed THEN snake responds within 100ms
- GIVEN game running WHEN performance measured THEN maintains 60 FPS on desktop
- GIVEN game running WHEN performance measured THEN maintains 30 FPS minimum on mobile
- GIVEN continuous play WHEN game runs for 10+ minutes THEN performance remains consistent

### UI/UX

- GIVEN snake movement WHEN direction changes THEN animation is smooth and natural
- GIVEN game canvas WHEN snake moves THEN movement appears fluid without stuttering
- GIVEN mobile device WHEN game runs THEN touch controls provide similar responsiveness
- GIVEN visual feedback WHEN snake moves THEN clear indication of snake head and body segments

## Metadata

### Definition of Done

- [ ] Snake responds to arrow keys and WASD controls
- [ ] Snake moves continuously in current direction
- [ ] Cannot reverse directly into body
- [ ] Smooth canvas-based animation implemented
- [ ] Performance meets frame rate requirements
- [ ] Touch controls work on mobile (basic implementation)
- [ ] Visual distinction between snake head and body
- [ ] Keyboard event handling works across browsers

### Technical Notes

- Use Canvas API for rendering snake movement
- Implement game loop with requestAnimationFrame
- Consider using game state management for snake position
- Handle keyboard events with proper preventDefault
- Ensure snake movement is frame-rate independent
- Use TypeScript for type safety in game objects

### Test Scenarios

- Test each direction control (up, down, left, right) with both arrow keys and WASD
- Attempt to reverse snake into itself and verify prevention
- Test continuous movement without input
- Verify performance on different devices and browsers
- Test rapid direction changes and ensure smooth response
- Verify touch controls provide equivalent functionality on mobile

### Dependencies

- US-1.1 (Project Foundation Setup)
- US-1.2 (Navigation Between Pages)

### Implementation Tasks

- **T-1.3.1**: Snake Movement Logic and Direction Control
- **T-1.3.2**: Collision Detection System

---

_Story provides the core interactive gameplay mechanic that defines the snake game experience._
