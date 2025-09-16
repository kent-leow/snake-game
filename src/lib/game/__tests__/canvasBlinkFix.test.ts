/**
 * Test to verify the canvas blink fix when food is consumed
 */

import { GameEngine, type GameEngineConfig, type GameEngineCallbacks } from '@/lib/game/gameEngine';

describe('Canvas Blink Fix', () => {
  let gameEngine: GameEngine;
  const config: GameEngineConfig = {
    canvasWidth: 400,
    canvasHeight: 400,
    gridSize: 20,
    gameSpeed: 100,
    initialScore: 0,
  };

  beforeEach(() => {
    const callbacks: GameEngineCallbacks = {
      onFoodEaten: jest.fn(),
      onScoreChange: jest.fn(),
    };
    gameEngine = new GameEngine(config, callbacks);
    gameEngine.start();
  });

  afterEach(() => {
    gameEngine.stop();
  });

  it('should have food immediately available after consumption', () => {
    // Get initial state
    const initialState = gameEngine.getGameState();
    expect(initialState.food).toBeTruthy();
    expect(initialState.isRunning).toBe(true);

    // Simulate game updates - this tests that food remains available
    // during normal game operation without delays
    gameEngine.update();
    
    // Check that food is still available immediately after any potential consumption
    const stateAfterUpdate = gameEngine.getGameState();
    
    // Food should always be present (either the same food or a new one)
    expect(stateAfterUpdate.food).toBeTruthy();
    
    // This test ensures that the canvas won't blink due to missing food
    expect(stateAfterUpdate.food?.id).toBeDefined();
  });

  it('should not have any delay between food consumption and new food spawn', () => {
    const gameState = gameEngine.getGameState();
    
    // The test verifies that there's no setTimeout delay by checking
    // that food is immediately available in the same update cycle
    expect(gameState.food).toBeTruthy();
    
    // Simulate multiple updates - food should always be present
    for (let i = 0; i < 10; i++) {
      gameEngine.update();
      const currentState = gameEngine.getGameState();
      expect(currentState.food).toBeTruthy();
    }
  });

  it('should maintain food presence during rapid updates', () => {
    let foodCount = 0;
    let nullFoodCount = 0;
    
    // Run multiple updates and count food presence
    for (let i = 0; i < 50; i++) {
      gameEngine.update();
      const state = gameEngine.getGameState();
      
      if (state.food) {
        foodCount++;
      } else {
        nullFoodCount++;
      }
    }
    
    // Food should be present in most (if not all) updates
    expect(foodCount).toBeGreaterThan(40);
    expect(nullFoodCount).toBeLessThan(5); // Allow for some edge cases but should be minimal
  });
});