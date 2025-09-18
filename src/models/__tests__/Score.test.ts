/**
 * @jest-environment node
 */

import mongoose from 'mongoose';
import Score from '../../models/Score';
import { ScoreInput } from '../../types/Database';

describe('Score Model', () => {
  // Sample valid score data for testing
  const validScoreData: ScoreInput = {
    playerName: 'TestPlayer',
    score: 1250,
    gameMetrics: {
      totalFood: 50,
      totalCombos: 10,
      longestCombo: 5,
      maxSpeedLevel: 3,
      gameTimeSeconds: 120,
      finalSnakeLength: 55,
    },
    comboStats: {
      totalComboPoints: 750,
      basePoints: 500,
      comboEfficiency: 80,
      averageComboLength: 3.2,
    },
    metadata: {
      browserInfo: 'Chrome 91.0',
      screenResolution: '1920x1080',
      gameVersion: '1.0.0',
      difficulty: 'normal',
    },
  };

  beforeAll(async () => {
    // Connect to test database
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/snake_game_test';
    await mongoose.connect(mongoUrl);
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear the scores collection before each test
    await Score.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should save a valid score document', async () => {
      const score = new Score(validScoreData);
      const savedScore = await score.save();

      expect(savedScore._id).toBeDefined();
      expect(savedScore.playerName).toBe(validScoreData.playerName);
      expect(savedScore.score).toBe(validScoreData.score);
      expect(savedScore.gameMetrics.totalFood).toBe(validScoreData.gameMetrics.totalFood);
      expect(savedScore.comboStats.totalComboPoints).toBe(validScoreData.comboStats.totalComboPoints);
      expect(savedScore.createdAt).toBeDefined();
      expect(savedScore.updatedAt).toBeDefined();
    });

    it('should reject score without player name', async () => {
      const invalidData = { ...validScoreData };
      delete (invalidData as Partial<ScoreInput>).playerName;

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Player name is required/);
    });

    it('should reject negative score', async () => {
      const invalidData = { ...validScoreData, score: -100 };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Score cannot be negative/);
    });

    it('should reject non-integer score', async () => {
      const invalidData = { ...validScoreData, score: 123.45 };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Score must be an integer/);
    });

    it('should reject player name with invalid characters', async () => {
      const invalidData = { ...validScoreData, playerName: 'Test@Player!' };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/can only contain letters/);
    });

    it('should reject player name that is too long', async () => {
      const invalidData = { ...validScoreData, playerName: 'ThisPlayerNameIsTooLongAndExceedsTwentyCharacters' };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/cannot exceed 20 characters/);
    });

    it('should reject unrealistically high score', async () => {
      const invalidData = { ...validScoreData, score: 2000000 };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/unrealistically high/);
    });
  });

  describe('Game Metrics Validation', () => {
    it('should reject negative total food', async () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, totalFood: -5 },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow();
    });

    it('should reject non-integer game metrics', async () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, totalCombos: 5.5 },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/must be an integer/);
    });

    it('should reject game time that is too long', async () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, gameTimeSeconds: 10000 },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/cannot exceed 2 hours/);
    });

    it('should reject game time that is too short', async () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, gameTimeSeconds: 0 },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/at least 1 second/);
    });
  });

  describe('Combo Stats Validation', () => {
    it('should reject negative combo points', async () => {
      const invalidData = {
        ...validScoreData,
        comboStats: { ...validScoreData.comboStats, totalComboPoints: -100 },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow();
    });

    it('should reject combo efficiency over 100%', async () => {
      const invalidData = {
        ...validScoreData,
        comboStats: { ...validScoreData.comboStats, comboEfficiency: 150 },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/cannot exceed 100/);
    });

    it('should reject non-finite average combo length', async () => {
      const invalidData = {
        ...validScoreData,
        comboStats: { ...validScoreData.comboStats, averageComboLength: Infinity },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/must be a valid number/);
    });
  });

  describe('Metadata Validation', () => {
    it('should accept valid metadata', async () => {
      const score = new Score(validScoreData);
      const savedScore = await score.save();

      expect(savedScore.metadata?.browserInfo).toBe(validScoreData.metadata?.browserInfo);
      expect(savedScore.metadata?.screenResolution).toBe(validScoreData.metadata?.screenResolution);
      expect(savedScore.metadata?.difficulty).toBe(validScoreData.metadata?.difficulty);
    });

    it('should reject invalid screen resolution format', async () => {
      const invalidData = {
        ...validScoreData,
        metadata: { ...validScoreData.metadata, screenResolution: 'invalid-format' },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/must be in format/);
    });

    it('should reject invalid difficulty value', async () => {
      const invalidData = {
        ...validScoreData,
        metadata: { ...validScoreData.metadata, difficulty: 'invalid' as 'easy' | 'normal' | 'hard' },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow();
    });

    it('should work without metadata', async () => {
      const dataWithoutMetadata = { ...validScoreData };
      delete dataWithoutMetadata.metadata;

      const score = new Score(dataWithoutMetadata);
      const savedScore = await score.save();

      expect(savedScore.metadata).toBeUndefined();
    });
  });

  describe('Cross-field Validation', () => {
    it('should reject score too low for food consumed', async () => {
      const invalidData = {
        ...validScoreData,
        score: 100, // Too low for 50 food items
        gameMetrics: { ...validScoreData.gameMetrics, totalFood: 50 },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Score too low/);
    });

    it('should reject more combos than total food', async () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: {
          ...validScoreData.gameMetrics,
          totalFood: 10,
          totalCombos: 15, // More combos than food
        },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Cannot have more combos/);
    });

    it('should reject longest combo exceeding total food', async () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: {
          ...validScoreData.gameMetrics,
          totalFood: 10,
          longestCombo: 15, // Longer than total food
        },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/cannot exceed total food/);
    });

    it('should reject score significantly higher than calculated points', async () => {
      const invalidData = {
        ...validScoreData,
        score: 5000, // Much higher than base + combo points
        comboStats: {
          ...validScoreData.comboStats,
          basePoints: 500,
          totalComboPoints: 750,
        },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/significantly higher/);
    });
  });

  describe('Indexes and Queries', () => {
    beforeEach(async () => {
      // Insert test data
      const testScores = [
        { ...validScoreData, playerName: 'Player1', score: 1000 },
        { ...validScoreData, playerName: 'Player2', score: 1500 },
        { ...validScoreData, playerName: 'Player1', score: 800 },
        { ...validScoreData, playerName: 'Player3', score: 2000 },
      ];

      await Score.insertMany(testScores);
    });

    it('should query scores by descending score order', async () => {
      const scores = await Score.find().sort({ score: -1 }).limit(3);

      expect(scores).toHaveLength(3);
      expect(scores[0].score).toBe(2000);
      expect(scores[1].score).toBe(1500);
      expect(scores[2].score).toBe(1000);
    });

    it('should query player scores in descending order', async () => {
      const playerScores = await Score.find({ playerName: 'Player1' }).sort({ score: -1 });

      expect(playerScores).toHaveLength(2);
      expect(playerScores[0].score).toBe(1000);
      expect(playerScores[1].score).toBe(800);
    });

    it('should query recent scores', async () => {
      const recentScores = await Score.find().sort({ timestamp: -1 }).limit(2);

      expect(recentScores).toHaveLength(2);
      expect(recentScores[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Model Methods and Statics', () => {
    it('should create timestamps automatically', async () => {
      const score = new Score(validScoreData);
      const savedScore = await score.save();

      expect(savedScore.createdAt).toBeInstanceOf(Date);
      expect(savedScore.updatedAt).toBeInstanceOf(Date);
      expect(savedScore.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should update timestamps on save', async () => {
      const score = new Score(validScoreData);
      const savedScore = await score.save();
      const originalUpdatedAt = savedScore.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      savedScore.score = 1300;
      const updatedScore = await savedScore.save();

      expect(updatedScore.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});