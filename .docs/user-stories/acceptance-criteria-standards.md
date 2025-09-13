# Acceptance Criteria Standards & Guidelines

## GIVEN/WHEN/THEN Format

### Structure

```
GIVEN [initial context/state]
WHEN [action/trigger occurs]
THEN [expected outcome/result]
```

### Quality Guidelines

1. **Specific**: Avoid vague terms like "properly" or "correctly"
2. **Testable**: Each criterion should be verifiable
3. **Complete**: Cover all scenarios including edge cases
4. **Independent**: Each criterion stands alone
5. **User-Focused**: Written from user perspective

## Acceptance Criteria Categories

### 1. Functional Criteria

**Purpose**: Define what the feature should do  
**Examples**:

- GIVEN the game is running WHEN player presses arrow key THEN snake moves in that direction
- GIVEN 5 food blocks are visible WHEN player eats block #1 THEN score increases by 10 points

### 2. Non-Functional Criteria

**Purpose**: Define performance, security, accessibility requirements  
**Examples**:

- GIVEN game is running WHEN frame rate drops THEN game maintains minimum 30 FPS
- GIVEN user has audio disabled WHEN game events occur THEN visual feedback is provided
- GIVEN mobile device WHEN screen orientation changes THEN game adapts layout within 1 second

### 3. UI/UX Criteria

**Purpose**: Define user interface and experience expectations  
**Examples**:

- GIVEN mobile device WHEN user touches screen THEN touch controls respond within 100ms
- GIVEN combo achieved WHEN visual feedback displays THEN animation completes within 500ms
- GIVEN score updates WHEN display changes THEN transition is smooth and readable

## Standard Criteria Templates

### Game Performance

- GIVEN game is active WHEN performance measured THEN maintains 60 FPS on desktop
- GIVEN mobile device WHEN game loads THEN responds within 3 seconds
- GIVEN audio playing WHEN game actions occur THEN no audio lag exceeds 100ms

### Accessibility

- GIVEN user with disabilities WHEN accessing game THEN meets WCAG 2.1 AA guidelines
- GIVEN audio disabled WHEN game events happen THEN visual alternatives provided
- GIVEN keyboard navigation WHEN user navigates THEN all interactive elements accessible

### Cross-Browser Compatibility

- GIVEN modern browser WHEN game loads THEN functions correctly on Chrome, Firefox, Safari, Edge
- GIVEN mobile browser WHEN accessing game THEN responsive design works properly
- GIVEN browser without features WHEN game loads THEN graceful degradation occurs

### Data Persistence

- GIVEN high score achieved WHEN game ends THEN score saves to database
- GIVEN settings changed WHEN user navigates away THEN preferences persist
- GIVEN network failure WHEN saving data THEN user notified and fallback used

## Edge Cases & Error Scenarios

### Input Validation

- GIVEN invalid input WHEN user provides data THEN appropriate error message shows
- GIVEN rapid key presses WHEN controlling snake THEN only valid moves processed
- GIVEN paused game WHEN controls pressed THEN game remains paused

### Network & System

- GIVEN network disconnection WHEN saving scores THEN local storage used as fallback
- GIVEN database unavailable WHEN accessing high scores THEN cached data displayed
- GIVEN low system resources WHEN game runs THEN performance degrades gracefully

### User Experience

- GIVEN long loading time WHEN game starts THEN loading indicator shown
- GIVEN game error WHEN unexpected issue occurs THEN user-friendly error message displays
- GIVEN session timeout WHEN user idle THEN appropriate cleanup performed

## Definition of Done Template

Every user story must meet these completion criteria:

### Development

- [ ] Feature implemented according to acceptance criteria
- [ ] Code follows TypeScript strict mode requirements
- [ ] No console errors in browser
- [ ] Responsive design verified on mobile and desktop

### Testing

- [ ] All acceptance criteria manually verified
- [ ] Cross-browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness validated
- [ ] Performance meets specified requirements

### Documentation

- [ ] Code includes necessary comments
- [ ] Any architectural decisions documented
- [ ] User-facing changes noted

### Deployment

- [ ] Feature works in production environment
- [ ] Database migrations (if any) successful
- [ ] No breaking changes to existing functionality
- [ ] Vercel deployment successful
