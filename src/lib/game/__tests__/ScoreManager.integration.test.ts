import { GameEngine, type GameEngineConfig, type GameEngineCallbacks } from '../gameEngine';
import { ScoreManager } from '../ScoreManager';

describe('Score Integration with Combo System - Acceptance Criteria', () => {
  let gameEngine: GameEngine;
  let scoreManager: ScoreManager;
  const config: GameEngineConfig = {
    canvasWidth: 400,
    canvasHeight: 400,
    gridSize: 20,
    gameSpeed: 100,
    initialScore: 0,
  };

  beforeEach(() => {
    const callbacks: GameEngineCallbacks = {
      onScoreBreakdown: jest.fn(),
    };
    gameEngine = new GameEngine(config, callbacks);
    scoreManager = gameEngine.getScoreManager();
    gameEngine.enableMultipleFood(); // Enable multiple food mode for combo testing
  });

  afterEach(() => {
    gameEngine.stop();
  });

  describe('Acceptance Criteria Validation', () => {
    it('GIVEN combo achieved WHEN completed THEN total score includes base points (10) plus combo bonus (5)', () => {
      // Simulate combo completion with the exact values from acceptance criteria
      const breakdown = scoreManager.addScore(10, 5);
      
      // Verify the breakdown matches acceptance criteria
      expect(breakdown.basePoints).toBe(10);
      expect(breakdown.comboBonus).toBe(5);
      expect(breakdown.totalPoints).toBe(15);
      
      // Verify total score is updated correctly
      expect(scoreManager.getCurrentScore()).toBe(15);
      
      // Verify game score breakdown
      const gameScore = scoreManager.getScoreBreakdown();
      expect(gameScore.currentScore).toBe(15);
      expect(gameScore.basePointsEarned).toBe(10);
      expect(gameScore.comboBonusEarned).toBe(5);
      expect(gameScore.totalCombos).toBe(1);
    });

    it('GIVEN combo calculation WHEN processing THEN score updates within 50ms of food consumption', () => {
      const startTime = performance.now();
      
      // Simulate the complete flow from food consumption to score update
      scoreManager.addScore(10, 5);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Verify score updates within 50ms requirement
      expect(processingTime).toBeLessThan(50);
      
      // Verify score is correctly calculated
      expect(scoreManager.getCurrentScore()).toBe(15);
    });

    it('GIVEN food consumption without combo WHEN processed THEN only base points awarded', () => {
      const breakdown = scoreManager.addScore(10, 0);
      
      expect(breakdown.basePoints).toBe(10);
      expect(breakdown.comboBonus).toBe(0);
      expect(breakdown.totalPoints).toBe(10);
      expect(scoreManager.getCurrentScore()).toBe(10);
      
      const gameScore = scoreManager.getScoreBreakdown();
      expect(gameScore.totalCombos).toBe(0);
      expect(gameScore.comboBonusEarned).toBe(0);
    });

    it('GIVEN multiple food consumption with mixed combos WHEN processed THEN accurate cumulative scoring', () => {
      // Simulate a realistic game scenario
      scoreManager.addScore(10, 0);  // Food 1: no combo
      scoreManager.addScore(10, 5);  // Food 2: combo achieved
      scoreManager.addScore(10, 0);  // Food 3: no combo
      scoreManager.addScore(10, 5);  // Food 4: combo achieved
      
      const gameScore = scoreManager.getScoreBreakdown();
      
      expect(gameScore.currentScore).toBe(50);      // Total: 40 base + 10 bonus
      expect(gameScore.basePointsEarned).toBe(40);  // 4 foods × 10 points
      expect(gameScore.comboBonusEarned).toBe(10);  // 2 combos × 5 points
      expect(gameScore.totalCombos).toBe(2);
      
      // Verify efficiency metrics
      const metrics = scoreManager.getEfficiencyMetrics();
      expect(metrics.comboContribution).toBe(20); // 10/50 = 20%
    });

    it('GIVEN score breakdown tracking WHEN accessed THEN provides transparency for debugging', () => {
      scoreManager.addScore(10, 5);
      
      const history = scoreManager.getScoreHistory();
      expect(history).toHaveLength(1);
      
      const breakdown = history[0];
      expect(breakdown).toEqual({
        basePoints: 10,
        comboBonus: 5,
        totalPoints: 15,
        timestamp: expect.any(Number),
      });
      
      // Verify debugging information
      const debugInfo = scoreManager.getDebugInfo();
      expect(debugInfo.currentScore).toBe(15);
      expect(debugInfo.breakdownCounts.withCombo).toBe(1);
      expect(debugInfo.lastBreakdown).toEqual(breakdown);
    });

    it('GIVEN score manager state WHEN validated THEN maintains consistency', () => {
      scoreManager.addScore(10, 5);
      scoreManager.addScore(10, 0);
      scoreManager.addScore(10, 5);
      
      const validation = scoreManager.validateState();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // Verify state consistency
      const pointsByType = scoreManager.getPointsByType();
      expect(pointsByType.base + pointsByType.combo).toBe(pointsByType.total);
      expect(pointsByType.total).toBe(scoreManager.getCurrentScore());
    });
  });

  describe('Performance Requirements', () => {
    it('GIVEN rapid score updates WHEN processing THEN maintains performance under load', () => {
      const startTime = performance.now();
      
      // Simulate 100 rapid score updates
      for (let i = 0; i < 100; i++) {
        scoreManager.addScore(10, i % 2 === 0 ? 5 : 0);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle 100 updates efficiently
      expect(totalTime).toBeLessThan(100); // Allow 100ms for 100 updates
      
      // Verify final state is correct
      expect(scoreManager.getCurrentScore()).toBe(1250); // 1000 base + 250 combo
      expect(scoreManager.getScoreBreakdown().totalCombos).toBe(50);
    });
  });

  describe('Integration with GameEngine', () => {
    it('GIVEN GameEngine with ScoreManager WHEN accessing score THEN returns consistent values', () => {
      // Add score through ScoreManager
      scoreManager.addScore(10, 5);
      
      // Verify GameEngine can access ScoreManager
      const retrievedScoreManager = gameEngine.getScoreManager();
      expect(retrievedScoreManager).toBe(scoreManager);
      
      // Verify score breakdown access
      const breakdown = gameEngine.getScoreBreakdown();
      expect(breakdown.currentScore).toBe(15);
      expect(breakdown.basePointsEarned).toBe(10);
      expect(breakdown.comboBonusEarned).toBe(5);
    });

    it('GIVEN GameEngine reset WHEN called THEN ScoreManager is also reset', () => {
      scoreManager.addScore(10, 5);
      expect(scoreManager.getCurrentScore()).toBe(15);
      
      gameEngine.reset();
      
      expect(scoreManager.getCurrentScore()).toBe(0);
      expect(scoreManager.getScoreHistory()).toHaveLength(0);
      expect(scoreManager.getScoreBreakdown().totalCombos).toBe(0);
    });
  });
});