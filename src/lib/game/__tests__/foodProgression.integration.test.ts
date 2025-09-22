// Simple integration test to verify food progression works correctly
import { GameEngine } from '../gameEngine';

describe('Food Progression Integration', () => {
  it('should demonstrate food progression behavior', () => {
    const gameEngine = new GameEngine({
      canvasWidth: 400,
      canvasHeight: 300,
      gridSize: 20,
      gameSpeed: 100,
    });

    gameEngine.enableMultipleFood();

    const comboManager = gameEngine.getComboManager();
    const multipleFoodManager = gameEngine.getMultipleFoodManager();

    // Test 1: Initial state should be 1-5
    let foods = multipleFoodManager.getFoods();
    const initialNumbers = foods.map(f => f.number).sort((a, b) => a - b);
    expect(initialNumbers).toEqual([1, 2, 3, 4, 5]);

    // Test 2: Complete first combo to progress to 6-10
    [1, 2, 3, 4, 5].forEach(num => {
      comboManager.processFood(num);
    });

    foods = multipleFoodManager.getFoods();
    const progressedNumbers = foods.map(f => f.number).sort((a, b) => a - b);
    expect(progressedNumbers).toEqual([6, 7, 8, 9, 10]);

    // Test 3: Break combo should reset back to 1-5
    comboManager.processFood(6); // Correct (maps to 1)
    comboManager.processFood(8); // Wrong! Should be 7 (maps to 2)

    foods = multipleFoodManager.getFoods();
    const resetNumbers = foods.map(f => f.number).sort((a, b) => a - b);
    expect(resetNumbers).toEqual([1, 2, 3, 4, 5]);

    // Test 4: Can progress again after reset
    [1, 2, 3, 4, 5].forEach(num => {
      comboManager.processFood(num);
    });

    foods = multipleFoodManager.getFoods();
    const secondProgressionNumbers = foods.map(f => f.number).sort((a, b) => a - b);
    expect(secondProgressionNumbers).toEqual([6, 7, 8, 9, 10]);

    gameEngine.stop();
  });
});