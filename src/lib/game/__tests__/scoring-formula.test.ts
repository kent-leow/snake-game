/**
 * Test to verify the new scoring formula: 10 base points + (combo progress × speed level)
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

  it('should calculate correct points for: no combos, no speed = 10 base points only', () => {
    // GIVEN: Initial state (no combos completed, no speed increase)
    const comboManager = gameEngine.getComboManager();
    const speedManager = gameEngine.getSpeedManager();
    
    expect(speedManager.getSpeedLevel()).toBe(0); // No combos completed yet
    expect(comboManager.getCurrentState().comboProgress).toBe(0); // No current combo progress
    
    // WHEN: Eat first food (no combo)
    const multipleFoods = gameEngine.getMultipleFoods();
    const food1 = multipleFoods.find(f => f.number === 1)!;
    
    // Manually calculate expected score
    const basePoints = 10;
    const comboProgress = 0; // First food, no progress yet
    const speedLevel = 0; // No combos completed yet
    const expectedBonus = comboProgress * speedLevel; // 0 * 0 = 0
    const expectedTotal = basePoints + expectedBonus; // 10 + 0 = 10
    
    // Simulate food consumption
    gameEngine['handleMultipleFoodConsumption'](food1);
    
    // THEN: Should get exactly 10 points
    expect(gameEngine.getScoreManager().getCurrentScore()).toBe(expectedTotal);
  });

  it('should calculate correct points for: combo progress 2, speed level 1 = 10 + (2×1) = 12 points', () => {
    // GIVEN: Complete one combo to get speed level 1
    
    // Complete full combo 1→2→3→4→5 to get speed level 1
    [1, 2, 3, 4, 5].forEach(num => {
      const food = gameEngine.getMultipleFoods().find(f => f.number === num)!;
      gameEngine['handleMultipleFoodConsumption'](food);
    });
    
    expect(gameEngine.getSpeedManager().getSpeedLevel()).toBe(1); // One combo completed
    
    // Reset score to test next sequence
    gameEngine.getScoreManager().reset();
    
    // WHEN: Start new combo and eat first two foods (1→2)
    const food1 = gameEngine.getMultipleFoods().find(f => f.number === 1)!;
    const food2 = gameEngine.getMultipleFoods().find(f => f.number === 2)!;
    
    gameEngine['handleMultipleFoodConsumption'](food1); // Progress = 1
    gameEngine['handleMultipleFoodConsumption'](food2); // Progress = 2
    
    // Get the score from the second food consumption
    const scoreHistory = gameEngine.getScoreManager().getScoreHistory();
    const secondFoodScore = scoreHistory[1]; // Second food's score breakdown
    
    // THEN: Second food should give 10 + (2×1) = 12 points
    expect(secondFoodScore.basePoints).toBe(10);
    expect(secondFoodScore.comboBonus).toBe(2); // 2 progress × 1 speed level
    expect(secondFoodScore.totalPoints).toBe(12);
  });

  it('should calculate correct points for: combo progress 4, speed level 2 = 10 + (4×2) = 18 points', () => {
    // GIVEN: Complete two combos to get speed level 2
    
    // Complete two full combos
    for (let combo = 0; combo < 2; combo++) {
      [1, 2, 3, 4, 5].forEach(num => {
        const food = gameEngine.getMultipleFoods().find(f => f.number === num)!;
        gameEngine['handleMultipleFoodConsumption'](food);
      });
    }
    
    expect(gameEngine.getSpeedManager().getSpeedLevel()).toBe(2); // Two combos completed
    
    // Reset score to test next sequence
    gameEngine.getScoreManager().reset();
    
    // WHEN: Start new combo and eat 1→2→3→4
    [1, 2, 3, 4].forEach(num => {
      const food = gameEngine.getMultipleFoods().find(f => f.number === num)!;
      gameEngine['handleMultipleFoodConsumption'](food);
    });
    
    // Get the score from the fourth food consumption
    const scoreHistory = gameEngine.getScoreManager().getScoreHistory();
    const fourthFoodScore = scoreHistory[3]; // Fourth food's score breakdown
    
    // THEN: Fourth food should give 10 + (4×2) = 18 points
    expect(fourthFoodScore.basePoints).toBe(10);
    expect(fourthFoodScore.comboBonus).toBe(8); // 4 progress × 2 speed level
    expect(fourthFoodScore.totalPoints).toBe(18);
  });

  it('should reset bonus to zero when combo is broken', () => {
    // GIVEN: Complete one combo to get speed level 1
    [1, 2, 3, 4, 5].forEach(num => {
      const food = gameEngine.getMultipleFoods().find(f => f.number === num)!;
      gameEngine['handleMultipleFoodConsumption'](food);
    });
    
    expect(gameEngine.getSpeedManager().getSpeedLevel()).toBe(1);
    
    // Reset score to test
    gameEngine.getScoreManager().reset();
    
    // WHEN: Start combo correctly (1→2) then break it (eat 4 instead of 3)
    const food1 = gameEngine.getMultipleFoods().find(f => f.number === 1)!;
    const food2 = gameEngine.getMultipleFoods().find(f => f.number === 2)!;
    const food4 = gameEngine.getMultipleFoods().find(f => f.number === 4)!; // Wrong! Should be 3
    
    gameEngine['handleMultipleFoodConsumption'](food1); // Progress = 1
    gameEngine['handleMultipleFoodConsumption'](food2); // Progress = 2
    gameEngine['handleMultipleFoodConsumption'](food4); // Breaks combo, progress = 0
    
    // Get the score from the third food consumption (broken combo)
    const scoreHistory = gameEngine.getScoreManager().getScoreHistory();
    const thirdFoodScore = scoreHistory[2]; // Third food's score breakdown
    
    // THEN: Third food should give 10 + (0×1) = 10 points (combo broken)
    expect(thirdFoodScore.basePoints).toBe(10);
    expect(thirdFoodScore.comboBonus).toBe(0); // 0 progress × 1 speed level (combo broken)
    expect(thirdFoodScore.totalPoints).toBe(10);
    
    // And combo should be broken
    expect(gameEngine.getComboManager().getCurrentState().comboProgress).toBe(0);
    expect(gameEngine.getComboManager().getCurrentState().isComboActive).toBe(false);
  });
});