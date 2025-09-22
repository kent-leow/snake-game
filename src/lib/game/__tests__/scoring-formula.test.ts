/**
 * Test to verify the new scoring formula: 5 × Combo × Speed
 */
import { GameEngine, type GameEngineConfig, type GameEngineCallbacks } from '../gameEngine';

describe('New Scoring Formula Verification', () => {
  let gameEngine: GameEngine;
  let scoreChangeResults: number[] = [];
  
  const config: GameEngineConfig = {
    canvasWidth: 400,
    canvasHeight: 400,
    gridSize: 20,
    gameSpeed: 100,
    initialScore: 0,
  };

  beforeEach(() => {
    scoreChangeResults = [];
    const callbacks: GameEngineCallbacks = {
      onScoreChange: (score) => {
        scoreChangeResults.push(score);
      },
    };
    gameEngine = new GameEngine(config, callbacks);
    gameEngine.enableMultipleFood(); // Enable multiple food mode for combo testing
  });

  afterEach(() => {
    gameEngine.stop();
  });

  it('should calculate correct points for: first food = 5 × 1 × 1 = 5 points', () => {
    // GIVEN: Initial state (no combos completed yet)
    const speedManager = gameEngine.getSpeedManager();
    
    expect(speedManager.getSpeedLevel()).toBe(0); // No combos completed yet
    
    // WHEN: Eat first food
    const multipleFoods = gameEngine.getMultipleFoods();
    const food1 = multipleFoods.find(f => f.number === 1)!;
    
    // New formula: 5 × FoodCount × Speed
    // For first food: foodCount = 1, speed = 1 (minimum)
    const expectedPoints = 5 * 1 * 1; // 5 × 1 × 1 = 5
    
    // Simulate food consumption
    gameEngine['handleMultipleFoodConsumption'](food1);
    
    // THEN: Should get exactly 5 points
    expect(gameEngine.getScoreManager().getCurrentScore()).toBe(expectedPoints);
  });

  it('should calculate correct points for: sixth food after complete combo = 5 × 6 × 1 = 30 points', () => {
    // GIVEN: Complete one combo to get speed level 1
    
    // Complete full combo 1→2→3→4→5 to get speed level 1
    [1, 2, 3, 4, 5].forEach(num => {
      const food = gameEngine.getMultipleFoods().find(f => f.number === num)!;
      gameEngine['handleMultipleFoodConsumption'](food);
    });
    
    expect(gameEngine.getSpeedManager().getSpeedLevel()).toBe(1); // One combo completed
    
    // WHEN: Eat the 6th food
    const food1 = gameEngine.getMultipleFoods().find(f => f.number === 1)!;
    const previousScore = gameEngine.getScoreManager().getCurrentScore();
    
    gameEngine['handleMultipleFoodConsumption'](food1); // 6th food eaten
    
    // Get the score increase from this food
    const currentScore = gameEngine.getScoreManager().getCurrentScore();
    const scoreIncrease = currentScore - previousScore;
    
    // THEN: 6th food should give 5 × 6 × 1 = 30 points
    expect(scoreIncrease).toBe(30);
  });

  it('should calculate correct points with two completed combos for 11th food = 5 × 11 × 2 = 110 points', () => {
    // GIVEN: Complete two combos to get speed level 2
    
    // Complete two full combos (10 foods total)
    for (let combo = 0; combo < 2; combo++) {
      [1, 2, 3, 4, 5].forEach(num => {
        const food = gameEngine.getMultipleFoods().find(f => f.number === num)!;
        gameEngine['handleMultipleFoodConsumption'](food);
      });
    }
    
    expect(gameEngine.getSpeedManager().getSpeedLevel()).toBe(2); // Two combos completed
    expect(gameEngine.getComboManager().getCurrentState().cumulativeComboCount).toBe(10); // 10 foods eaten
    
    // WHEN: Eat the 11th food
    const food1 = gameEngine.getMultipleFoods().find(f => f.number === 1)!;
    const previousScore = gameEngine.getScoreManager().getCurrentScore();
    
    gameEngine['handleMultipleFoodConsumption'](food1); // cumulativeComboCount becomes 11
    
    // Check that cumulative count increased
    expect(gameEngine.getComboManager().getCurrentState().cumulativeComboCount).toBe(11);
    
    // Get the score increase from this food
    const currentScore = gameEngine.getScoreManager().getCurrentScore();
    const scoreIncrease = currentScore - previousScore;
    
    // THEN: 11th food should give 5 × 11 × 2 = 110 points
    expect(scoreIncrease).toBe(110);
  });

  it('should continue food count even when combo is broken', () => {
    // GIVEN: Complete one combo to get speed level 1
    [1, 2, 3, 4, 5].forEach(num => {
      const food = gameEngine.getMultipleFoods().find(f => f.number === num)!;
      gameEngine['handleMultipleFoodConsumption'](food);
    });
    
    expect(gameEngine.getSpeedManager().getSpeedLevel()).toBe(1);
    
    // WHEN: Start combo correctly (1→2) then break it (eat 4 instead of 3)
    const food1 = gameEngine.getMultipleFoods().find(f => f.number === 1)!;
    const food2 = gameEngine.getMultipleFoods().find(f => f.number === 2)!;
    const food4 = gameEngine.getMultipleFoods().find(f => f.number === 4)!; // Wrong! Should be 3
    
    gameEngine['handleMultipleFoodConsumption'](food1); // 6th food
    gameEngine['handleMultipleFoodConsumption'](food2); // 7th food
    
    // Get score before breaking combo
    const scoreBeforeBreak = gameEngine.getScoreManager().getCurrentScore();
    
    // This should break the combo but still count as 8th food
    gameEngine['handleMultipleFoodConsumption'](food4); // 8th food, but combo broken
    
    // Check that combo is broken (progress should reset to 0, expectedNext back to 1)
    expect(gameEngine.getComboManager().getCurrentState().comboProgress).toBe(0);
    expect(gameEngine.getComboManager().getCurrentState().expectedNext).toBe(1);
    
    // Get the score increase from the broken combo food (8th food)
    const currentScore = gameEngine.getScoreManager().getCurrentScore();
    const scoreIncrease = currentScore - scoreBeforeBreak;
    
    // THEN: 8th food should still give 5 × 8 × 1 = 40 points (food count continues)
    expect(scoreIncrease).toBe(40);
  });
});