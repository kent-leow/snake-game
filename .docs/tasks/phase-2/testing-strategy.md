# Testing Strategy - Phase 2

## Overview
Comprehensive testing approach for Phase 2 combo system implementation, covering unit tests, integration tests, and end-to-end scenarios for all major features.

## Testing Scope

### Features Under Test
- Multiple numbered food block system
- Order-based combo tracking and scoring
- Progressive speed mechanics  
- High score persistence with MongoDB
- Visual feedback and UI components
- API endpoints and data validation
- Offline/online score management

## Unit Testing Strategy

### Game Logic Tests

#### FoodManager Tests
```typescript
describe('FoodManager', () => {
  test('initializes exactly 5 numbered food blocks', () => {
    const foodManager = new FoodManager(20, 800, 600);
    foodManager.initializeFoods([]);
    const foods = foodManager.getFoods();
    
    expect(foods).toHaveLength(5);
    expect(foods.map(f => f.number).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test('prevents food spawning on snake positions', () => {
    const snakePositions = [{ x: 100, y: 100 }, { x: 120, y: 100 }];
    const foodManager = new FoodManager(20, 800, 600);
    foodManager.initializeFoods(snakePositions);
    
    const foods = foodManager.getFoods();
    foods.forEach(food => {
      expect(snakePositions).not.toContainEqual(food.position);
    });
  });

  test('replaces consumed food with same number', () => {
    const foodManager = new FoodManager(20, 800, 600);
    foodManager.initializeFoods([]);
    
    const consumedFood = foodManager.consumeFood(3, []);
    expect(consumedFood?.number).toBe(3);
    
    const foods = foodManager.getFoods();
    expect(foods.filter(f => f.number === 3)).toHaveLength(1);
  });
});
```

#### ComboManager Tests
```typescript
describe('ComboManager', () => {
  test('tracks combo sequence correctly', () => {
    const comboManager = new ComboManager();
    
    const result1 = comboManager.processFood(1);
    expect(result1.type).toBe('progress');
    expect(result1.newState.comboProgress).toBe(1);
    
    const result2 = comboManager.processFood(2);
    expect(result2.type).toBe('progress');
    expect(result2.newState.comboProgress).toBe(2);
  });

  test('awards bonus points on combo completion', () => {
    const comboManager = new ComboManager();
    
    [1, 2, 3, 4].forEach(num => comboManager.processFood(num));
    const result = comboManager.processFood(5);
    
    expect(result.type).toBe('complete');
    expect(result.pointsAwarded).toBe(5);
    expect(result.newState.totalCombos).toBe(1);
  });

  test('resets combo on wrong sequence', () => {
    const comboManager = new ComboManager();
    
    comboManager.processFood(1);
    comboManager.processFood(2);
    const result = comboManager.processFood(4); // Skip 3
    
    expect(result.type).toBe('broken');
    expect(result.newState.comboProgress).toBe(0);
    expect(result.newState.expectedNext).toBe(1);
  });

  test('handles multiple consecutive combos', () => {
    const comboManager = new ComboManager();
    
    // First combo
    [1, 2, 3, 4, 5].forEach(num => comboManager.processFood(num));
    
    // Second combo
    [1, 2, 3, 4].forEach(num => comboManager.processFood(num));
    const result = comboManager.processFood(5);
    
    expect(result.newState.totalCombos).toBe(2);
  });
});
```

#### SpeedManager Tests
```typescript
describe('SpeedManager', () => {
  test('increases speed on combo completion', () => {
    const config = {
      baseSpeed: 150,
      speedIncrement: 15,
      maxSpeed: 60,
      minSpeed: 300,
      transitionDuration: 500
    };
    const speedManager = new SpeedManager(config);
    
    const initialSpeed = speedManager.getCurrentSpeed();
    speedManager.onComboCompleted();
    
    expect(speedManager.getCurrentSpeed()).toBe(initialSpeed - 15);
    expect(speedManager.getSpeedLevel()).toBe(1);
  });

  test('resets speed on combo break', () => {
    const speedManager = new SpeedManager(config);
    
    // Increase speed with combos
    speedManager.onComboCompleted();
    speedManager.onComboCompleted();
    expect(speedManager.getSpeedLevel()).toBe(2);
    
    // Break combo
    speedManager.onComboBreak();
    expect(speedManager.getCurrentSpeed()).toBe(150); // Base speed
    expect(speedManager.getSpeedLevel()).toBe(0);
  });

  test('enforces maximum speed limit', () => {
    const speedManager = new SpeedManager(config);
    
    // Trigger many combos
    for (let i = 0; i < 20; i++) {
      speedManager.onComboCompleted();
    }
    
    expect(speedManager.getCurrentSpeed()).toBeGreaterThanOrEqual(60); // Max speed
  });
});
```

### API Tests

#### Score API Tests
```typescript
describe('/api/scores', () => {
  test('POST /api/scores creates valid score', async () => {
    const scoreData = {
      playerName: 'TestPlayer',
      score: 1500,
      gameMetrics: {
        totalFood: 50,
        totalCombos: 8,
        longestCombo: 3,
        maxSpeedLevel: 5,
        gameTimeSeconds: 180,
        finalSnakeLength: 25
      },
      comboStats: {
        totalComboPoints: 40,
        basePoints: 500,
        comboEfficiency: 80,
        averageComboLength: 2.5
      }
    };

    const response = await request(app)
      .post('/api/scores')
      .send(scoreData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.playerName).toBe('TestPlayer');
    expect(response.body.data.score).toBe(1500);
  });

  test('POST /api/scores validates score data', async () => {
    const invalidData = {
      playerName: '', // Invalid: empty name
      score: -100, // Invalid: negative score
      gameMetrics: {} // Invalid: missing required fields
    };

    await request(app)
      .post('/api/scores')
      .send(invalidData)
      .expect(400);
  });

  test('GET /api/scores returns paginated results', async () => {
    const response = await request(app)
      .get('/api/scores?limit=10&offset=0')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('hasMore');
  });

  test('GET /api/scores/leaderboard returns top scores', async () => {
    const response = await request(app)
      .get('/api/scores/leaderboard?period=all&limit=5')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.leaderboard).toBeInstanceOf(Array);
    expect(response.body.data.leaderboard.length).toBeLessThanOrEqual(5);
  });
});
```

### Component Tests

#### UI Component Tests
```typescript
describe('ComboProgressIndicator', () => {
  test('renders combo progress correctly', () => {
    render(
      <ComboProgressIndicator
        currentProgress={3}
        expectedNext={4}
        totalCombos={2}
        isActive={true}
      />
    );

    expect(screen.getByText(/3\/5/)).toBeInTheDocument();
    expect(screen.getByText(/Next: 4/)).toBeInTheDocument();
    expect(screen.getByText(/Combos: 2/)).toBeInTheDocument();
  });

  test('shows inactive state when combo broken', () => {
    render(
      <ComboProgressIndicator
        currentProgress={0}
        expectedNext={1}
        totalCombos={1}
        isActive={false}
      />
    );

    const indicator = screen.getByTestId('combo-indicator');
    expect(indicator).toHaveClass('inactive');
  });
});

describe('SpeedIndicator', () => {
  test('displays speed level and percentage', () => {
    render(
      <SpeedIndicator
        speedLevel={3}
        currentSpeed={105}
        baseSpeed={150}
        isTransitioning={false}
      />
    );

    expect(screen.getByText('Speed Level: 3')).toBeInTheDocument();
    expect(screen.getByText(/143% speed/)).toBeInTheDocument();
  });

  test('shows transition animation', () => {
    render(
      <SpeedIndicator
        speedLevel={2}
        currentSpeed={120}
        baseSpeed={150}
        isTransitioning={true}
      />
    );

    const speedBar = screen.getByTestId('speed-fill');
    expect(speedBar).toHaveClass('transitioning');
  });
});
```

## Integration Testing

### Game Flow Integration Tests
```typescript
describe('Game Integration', () => {
  test('complete combo flow affects all systems', async () => {
    const game = new Game();
    await game.initialize();

    // Simulate eating food in sequence
    const foods = game.foodManager.getFoods();
    const food1 = foods.find(f => f.number === 1);
    
    // Move snake to food and consume
    game.moveSnakeTo(food1.position);
    const result = game.consumeFood();

    // Verify combo progress
    expect(game.comboManager.getCurrentState().comboProgress).toBe(1);
    
    // Complete full combo sequence
    for (let i = 2; i <= 5; i++) {
      const food = game.foodManager.getFoods().find(f => f.number === i);
      game.moveSnakeTo(food.position);
      game.consumeFood();
    }

    // Verify combo completion effects
    const comboState = game.comboManager.getCurrentState();
    expect(comboState.totalCombos).toBe(1);
    
    const speedState = game.speedManager.getSpeedState();
    expect(speedState.speedLevel).toBe(1);
    
    const score = game.scoreManager.getCurrentScore();
    expect(score).toBe(55); // 5 foods * 10 points + 5 bonus
  });

  test('score submission integrates with all game systems', async () => {
    const game = new Game();
    const scoreService = new ScoreService();

    // Play game and generate score data
    await game.playSequence([1, 2, 3, 4, 5, 1, 3]); // One combo + break

    const scoreData = game.generateScoreData('TestPlayer');
    
    expect(scoreData.score).toBeGreaterThan(0);
    expect(scoreData.gameMetrics.totalCombos).toBe(1);
    expect(scoreData.comboStats.totalComboPoints).toBe(5);

    // Submit score
    const result = await scoreService.submitScore(scoreData);
    expect(result.success).toBe(true);
    expect(result.saved).toBe('online');
  });
});
```

### Database Integration Tests
```typescript
describe('Database Integration', () => {
  beforeEach(async () => {
    await connectToTestDatabase();
    await clearScoresCollection();
  });

  afterAll(async () => {
    await disconnectFromTestDatabase();
  });

  test('score CRUD operations work correctly', async () => {
    const scoreData = generateValidScoreData();
    
    // Create
    const score = new Score(scoreData);
    const saved = await score.save();
    expect(saved._id).toBeDefined();

    // Read
    const retrieved = await Score.findById(saved._id);
    expect(retrieved.playerName).toBe(scoreData.playerName);

    // Update (not typically done, but test capability)
    retrieved.score = 2000;
    await retrieved.save();
    
    const updated = await Score.findById(saved._id);
    expect(updated.score).toBe(2000);

    // Delete
    await Score.findByIdAndDelete(saved._id);
    const deleted = await Score.findById(saved._id);
    expect(deleted).toBeNull();
  });

  test('database indexes improve query performance', async () => {
    // Insert many scores for performance testing
    const scores = Array.from({ length: 1000 }, (_, i) => 
      generateValidScoreData(`Player${i}`, 1000 + i)
    );
    await Score.insertMany(scores);

    // Test query performance
    const start = Date.now();
    const topScores = await Score.find({})
      .sort({ score: -1 })
      .limit(10)
      .lean();
    const queryTime = Date.now() - start;

    expect(topScores).toHaveLength(10);
    expect(queryTime).toBeLessThan(100); // Should be fast with index
  });
});
```

## End-to-End Testing

### User Journey Tests
```typescript
describe('E2E: Complete Game Session', () => {
  test('player can complete full game with score submission', async () => {
    // Launch game
    await page.goto('/');
    await page.click('[data-testid="start-game"]');

    // Verify game starts with 5 food blocks
    const foodBlocks = await page.$$('[data-testid="food-block"]');
    expect(foodBlocks).toHaveLength(5);

    // Verify numbers 1-5 are present
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`[data-number="${i}"]`)).toBeVisible();
    }

    // Simulate completing a combo
    for (let i = 1; i <= 5; i++) {
      await moveSnakeToFood(page, i);
      await waitForFoodConsumption(page);
    }

    // Verify combo completion feedback
    await expect(page.locator('[data-testid="combo-celebration"]')).toBeVisible();
    
    // Verify speed increase
    const speedIndicator = page.locator('[data-testid="speed-indicator"]');
    await expect(speedIndicator).toContainText('Speed Level: 1');

    // Trigger game over
    await moveSnakeToWall(page);
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible();

    // Submit score
    await page.fill('[data-testid="player-name"]', 'E2E Test Player');
    await page.click('[data-testid="submit-score"]');

    // Verify score submission success
    await expect(page.locator('[data-testid="score-submitted"]')).toBeVisible();
  });

  test('offline score storage and sync works', async () => {
    // Disable network
    await page.context().setOffline(true);

    // Play game and submit score
    await playCompleteGame(page);
    await submitScore(page, 'Offline Player');

    // Verify offline storage message
    await expect(page.locator('[data-testid="offline-notice"]')).toBeVisible();

    // Re-enable network
    await page.context().setOffline(false);

    // Verify sync occurs
    await page.reload();
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();
  });
});
```

### Performance Tests
```typescript
describe('Performance Tests', () => {
  test('game maintains 60 FPS with multiple food blocks', async () => {
    await page.goto('/');
    await page.click('[data-testid="start-game"]');

    // Monitor frame rate during gameplay
    const frameRates = [];
    
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      await page.waitForTimeout(16); // ~60 FPS
      const frameTime = performance.now() - start;
      frameRates.push(1000 / frameTime);
    }

    const averageFPS = frameRates.reduce((a, b) => a + b) / frameRates.length;
    expect(averageFPS).toBeGreaterThan(50); // Allow some variance
  });

  test('API endpoints respond within acceptable time', async () => {
    const scoreData = generateValidScoreData();

    const start = Date.now();
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData)
    });
    const responseTime = Date.now() - start;

    expect(response.ok).toBe(true);
    expect(responseTime).toBeLessThan(2000); // 2 second max
  });
});
```

## Test Data Setup

### Test Utilities
```typescript
// testUtils.ts
export const generateValidScoreData = (
  playerName = 'TestPlayer',
  score = 1000
) => ({
  playerName,
  score,
  gameMetrics: {
    totalFood: Math.floor(score / 10),
    totalCombos: Math.floor(score / 100),
    longestCombo: 5,
    maxSpeedLevel: 3,
    gameTimeSeconds: 120,
    finalSnakeLength: 20
  },
  comboStats: {
    totalComboPoints: score * 0.1,
    basePoints: score * 0.9,
    comboEfficiency: 75,
    averageComboLength: 3.2
  }
});

export const moveSnakeToFood = async (page, foodNumber) => {
  const food = page.locator(`[data-number="${foodNumber}"]`);
  const foodBox = await food.boundingBox();
  
  // Simulate arrow key presses to move snake
  await navigateSnakeTo(page, foodBox.x, foodBox.y);
};

export const waitForFoodConsumption = async (page) => {
  await page.waitForFunction(() => {
    const event = window.lastGameEvent;
    return event && event.type === 'food-consumed';
  });
};
```

## Coverage Requirements

### Minimum Coverage Targets
- Unit Tests: 85% code coverage
- Integration Tests: 70% feature coverage  
- E2E Tests: 90% user journey coverage

### Critical Path Coverage
- All combo sequence variations (100%)
- All speed progression scenarios (100%)
- All score submission paths (100%)
- All error handling paths (90%)

## Test Environment Setup

### Local Development
```bash
# Unit and integration tests
npm run test:unit
npm run test:integration

# E2E tests  
npm run test:e2e

# Coverage reports
npm run test:coverage
```

### CI/CD Pipeline
```yaml
test_matrix:
  - unit_tests: Jest + React Testing Library
  - integration_tests: Jest + Supertest + MongoDB Memory Server  
  - e2e_tests: Playwright + real database
  - performance_tests: Lighthouse + custom metrics
```

---

*This testing strategy ensures comprehensive validation of all Phase 2 features with appropriate coverage and quality gates.*