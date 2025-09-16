import { GameEngine, type GameEngineConfig, type GameEngineCallbacks } from '../gameEngine';

describe('GameEngine - Multiple Food Integration', () => {
  let gameEngine: GameEngine;
  let mockCallbacks: jest.Mocked<GameEngineCallbacks>;
  
  const defaultConfig: GameEngineConfig = {
    canvasWidth: 800,
    canvasHeight: 600,
    gridSize: 20,
    gameSpeed: 150,
  };

  beforeEach(() => {
    mockCallbacks = {
      onScoreChange: jest.fn(),
      onFoodEaten: jest.fn(),
      onMultipleFoodEaten: jest.fn(),
      onGameOver: jest.fn(),
      onLevelUp: jest.fn(),
      onGameOverStateChange: jest.fn(),
    };

    gameEngine = new GameEngine(defaultConfig, mockCallbacks);
  });

  describe('multiple food mode activation', () => {
    it('should start in single food mode by default', () => {
      expect(gameEngine.isMultipleFoodEnabled()).toBe(false);
      
      const gameState = gameEngine.getGameState();
      expect(gameState.useMultipleFood).toBe(false);
      expect(gameState.multipleFoods).toHaveLength(0);
      expect(gameState.food).toBeTruthy(); // Should have single food
    });

    it('should enable multiple food mode', () => {
      gameEngine.enableMultipleFood();
      
      expect(gameEngine.isMultipleFoodEnabled()).toBe(true);
      
      const gameState = gameEngine.getGameState();
      expect(gameState.useMultipleFood).toBe(true);
      expect(gameState.multipleFoods).toHaveLength(5);
      expect(gameState.food).toBeNull(); // No single food in multiple mode
    });

    it('should disable multiple food mode and revert to single food', () => {
      gameEngine.enableMultipleFood();
      gameEngine.disableMultipleFood();
      
      expect(gameEngine.isMultipleFoodEnabled()).toBe(false);
      
      const gameState = gameEngine.getGameState();
      expect(gameState.useMultipleFood).toBe(false);
      expect(gameState.multipleFoods).toHaveLength(0);
      expect(gameState.food).toBeTruthy(); // Should have single food again
    });

    it('should initialize exactly 5 numbered foods when enabled', () => {
      gameEngine.enableMultipleFood();
      const multipleFoods = gameEngine.getMultipleFoods();
      
      expect(multipleFoods).toHaveLength(5);
      
      // Check all numbers 1-5 are present
      const numbers = multipleFoods.map(f => f.number).sort();
      expect(numbers).toEqual([1, 2, 3, 4, 5]);
      
      // Check all foods have unique positions
      const positions = multipleFoods.map(f => `${f.position.x},${f.position.y}`);
      const uniquePositions = new Set(positions);
      expect(positions.length).toBe(uniquePositions.size);
    });
  });

  describe('multiple food collision and consumption', () => {
    beforeEach(() => {
      gameEngine.enableMultipleFood();
    });

    it('should detect collision with numbered food during game update', () => {
      const multipleFoods = gameEngine.getMultipleFoods();
      const firstFood = multipleFoods[0];
      
      // Move snake to food position (simplified test)
      const gameState = gameEngine.getGameState();
      const snake = gameState.snake;
      const originalHead = snake.segments[0];
      
      // Manually set snake head to food position for testing
      snake.segments[0] = {
        ...originalHead,
        x: firstFood.position.x,
        y: firstFood.position.y,
      };
      
      const initialScore = gameEngine.getScore();
      
      // Update game to trigger collision detection
      gameEngine.update();
      
      // Should have consumed food and increased score
      const newScore = gameEngine.getScore();
      expect(newScore).toBeGreaterThan(initialScore);
      
      // Should have triggered multiple food eaten callback
      expect(mockCallbacks.onMultipleFoodEaten).toHaveBeenCalled();
      
      // Should still have 5 foods (replacement spawned)
      const newMultipleFoods = gameEngine.getMultipleFoods();
      expect(newMultipleFoods).toHaveLength(5);
    });

    it('should spawn replacement food with same number after consumption', () => {
      const multipleFoods = gameEngine.getMultipleFoods();
      const targetFood = multipleFoods.find(f => f.number === 3);
      expect(targetFood).toBeTruthy();
      
      const initialFoodId = targetFood!.id;
      
      // Simulate food consumption by moving snake to food position
      const gameState2 = gameEngine.getGameState();
      const snake = gameState2.snake;
      snake.segments[0] = {
        ...snake.segments[0],
        x: targetFood!.position.x,
        y: targetFood!.position.y,
      };
      
      gameEngine.update();
      
      // Check that food number 3 still exists but with different ID
      const newMultipleFoods = gameEngine.getMultipleFoods();
      const newFood3 = newMultipleFoods.find(f => f.number === 3);
      
      expect(newFood3).toBeTruthy();
      expect(newFood3!.id).not.toBe(initialFoodId);
      expect(newFood3!.number).toBe(3);
    });

    it('should provide consumption result through callback', () => {
      const multipleFoods = gameEngine.getMultipleFoods();
      const targetFood = multipleFoods[0];
      
      // Simulate collision
      const gameState3 = gameEngine.getGameState();
      const snake = gameState3.snake;
      snake.segments[0] = {
        ...snake.segments[0],
        x: targetFood.position.x,
        y: targetFood.position.y,
      };
      
      gameEngine.update();
      
      expect(mockCallbacks.onMultipleFoodEaten).toHaveBeenCalledWith(
        expect.objectContaining({
          consumedFood: expect.objectContaining({
            id: targetFood.id,
            number: targetFood.number,
          }),
          newFood: expect.objectContaining({
            number: targetFood.number,
            id: expect.not.stringMatching(targetFood.id),
          }),
        }),
        expect.any(Number)
      );
    });
  });

  describe('score calculation with multiple foods', () => {
    beforeEach(() => {
      gameEngine.enableMultipleFood();
    });

    it('should award different scores for different numbered foods', () => {
      const multipleFoods = gameEngine.getMultipleFoods();
      const food1 = multipleFoods.find(f => f.number === 1);
      const food5 = multipleFoods.find(f => f.number === 5);
      
      expect(food1).toBeTruthy();
      expect(food5).toBeTruthy();
      
      // Food 5 should have higher value than food 1
      expect(food5!.value).toBeGreaterThan(food1!.value);
    });

    it('should add correct score when consuming numbered food', () => {
      const multipleFoods = gameEngine.getMultipleFoods();
      const targetFood = multipleFoods.find(f => f.number === 4);
      expect(targetFood).toBeTruthy();
      
      const initialScore = gameEngine.getScore();
      
      // Simulate food consumption
      const gameState4 = gameEngine.getGameState();
      const snake = gameState4.snake;
      snake.segments[0] = {
        ...snake.segments[0],
        x: targetFood!.position.x,
        y: targetFood!.position.y,
      };
      
      gameEngine.update();
      
      const newScore = gameEngine.getScore();
      const scoreIncrease = newScore - initialScore;
      
      expect(scoreIncrease).toBe(targetFood!.value);
    });
  });

  describe('game state management with multiple foods', () => {
    it('should maintain multiple food state through reset', () => {
      gameEngine.enableMultipleFood();
      
      // Verify multiple food mode is active
      expect(gameEngine.isMultipleFoodEnabled()).toBe(true);
      expect(gameEngine.getMultipleFoods()).toHaveLength(5);
      
      // Reset game
      gameEngine.reset();
      
      // Should maintain multiple food mode
      expect(gameEngine.isMultipleFoodEnabled()).toBe(true);
      expect(gameEngine.getMultipleFoods()).toHaveLength(5);
    });

    it('should maintain single food state through reset', () => {
      // Start with single food mode
      expect(gameEngine.isMultipleFoodEnabled()).toBe(false);
      
      // Reset game
      gameEngine.reset();
      
      // Should maintain single food mode
      expect(gameEngine.isMultipleFoodEnabled()).toBe(false);
      expect(gameEngine.getGameState().food).toBeTruthy();
    });

    it('should provide correct game state information', () => {
      gameEngine.enableMultipleFood();
      const gameState = gameEngine.getGameState();
      
      expect(gameState).toMatchObject({
        useMultipleFood: true,
        multipleFoods: expect.arrayContaining([
          expect.objectContaining({
            number: expect.any(Number),
            position: expect.any(Object),
            color: expect.any(String),
          }),
        ]),
        food: null,
      });
      
      expect(gameState.multipleFoods).toHaveLength(5);
    });
  });

  describe('validation and statistics', () => {
    beforeEach(() => {
      gameEngine.enableMultipleFood();
    });

    it('should validate multiple food state', () => {
      const validation = gameEngine.validateMultipleFoodState();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should provide multiple food statistics', () => {
      const stats = gameEngine.getMultipleFoodStats();
      
      expect(stats).toMatchObject({
        totalFoods: 5,
        foodsByNumber: expect.any(Object),
        oldestFood: expect.any(Object),
        newestFood: expect.any(Object),
      });
      
      expect(Object.keys(stats.foodsByNumber)).toHaveLength(5);
    });
  });

  describe('integration with existing game systems', () => {
    it('should work with snake growth system', () => {
      gameEngine.enableMultipleFood();
      
      const gameState5 = gameEngine.getGameState();
      const initialLength = gameState5.snake.segments.length;
      const multipleFoods = gameEngine.getMultipleFoods();
      const targetFood = multipleFoods[0];
      
      // Simulate food consumption
      const snake = gameState5.snake;
      snake.segments[0] = {
        ...snake.segments[0],
        x: targetFood.position.x,
        y: targetFood.position.y,
      };
      
      gameEngine.update();
      
      // Snake should grow
      const gameState6 = gameEngine.getGameState();
      const newLength = gameState6.snake.segments.length;
      expect(newLength).toBeGreaterThan(initialLength);
    });

    it('should work with scoring system callbacks', () => {
      gameEngine.enableMultipleFood();
      
      const multipleFoods = gameEngine.getMultipleFoods();
      const targetFood = multipleFoods[0];
      
      // Simulate food consumption
      const gameState7 = gameEngine.getGameState();
      const snake = gameState7.snake;
      snake.segments[0] = {
        ...snake.segments[0],
        x: targetFood.position.x,
        y: targetFood.position.y,
      };
      
      gameEngine.update();
      
      // Should trigger score change callback
      expect(mockCallbacks.onScoreChange).toHaveBeenCalled();
    });

    it('should not interfere with game over detection', () => {
      gameEngine.enableMultipleFood();
      
      // Game over should still work normally
      const gameState8 = gameEngine.getGameState();
      const gameOverState = gameState8.gameOverState;
      expect(gameOverState.isGameOver).toBe(false);
      
      // Multiple food mode shouldn't affect game over logic
      expect(() => {
        gameEngine.checkCollision('boundary');
      }).not.toThrow();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle switching modes during gameplay', () => {
      // Start game, enable multiple food
      gameEngine.start();
      gameEngine.enableMultipleFood();
      
      expect(gameEngine.isMultipleFoodEnabled()).toBe(true);
      
      // Switch back to single food
      gameEngine.disableMultipleFood();
      
      expect(gameEngine.isMultipleFoodEnabled()).toBe(false);
      expect(gameEngine.getGameState().food).toBeTruthy();
    });

    it('should handle multiple food operations when disabled', () => {
      // Multiple food operations should work gracefully when disabled
      expect(gameEngine.getMultipleFoods()).toHaveLength(0);
      expect(gameEngine.validateMultipleFoodState().isValid).toBe(true);
      
      const stats = gameEngine.getMultipleFoodStats();
      expect(stats.totalFoods).toBe(0);
    });

    it('should maintain food positions within canvas boundaries', () => {
      gameEngine.enableMultipleFood();
      const multipleFoods = gameEngine.getMultipleFoods();
      
      multipleFoods.forEach(food => {
        expect(food.position.x).toBeGreaterThanOrEqual(0);
        expect(food.position.y).toBeGreaterThanOrEqual(0);
        expect(food.position.x).toBeLessThan(defaultConfig.canvasWidth);
        expect(food.position.y).toBeLessThan(defaultConfig.canvasHeight);
      });
    });
  });
});