/**
 * @jest-environment node
 */
import { ScoreService } from '../scoreService';
import { ValidationError, SecurityError, DatabaseError } from '../errorHandler';
import Score from '../../../models/Score';
import { connectToDatabase } from '../../database/connection';

// Mock dependencies
jest.mock('@/lib/database/connection');
jest.mock('@/models/Score');
jest.mock('@/utils/scoreValidation');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const MockScore = Score as jest.MockedClass<typeof Score>;

describe('ScoreService', () => {
  let scoreService: ScoreService;
  
  beforeEach(() => {
    scoreService = new ScoreService();
    jest.clearAllMocks();
    
    // Clear rate limit cache
    if ((global as any).rateLimitCache) {
      (global as any).rateLimitCache = {};
    }
    
    // Mock successful database connection
    mockConnectToDatabase.mockResolvedValue({} as any);
  });

  describe('createScore', () => {
    const validScoreData = {
      playerName: 'TestPlayer',
      score: 1000,
      gameMetrics: {
        totalFood: 50,
        totalCombos: 10,
        longestCombo: 5,
        maxSpeedLevel: 3,
        gameTimeSeconds: 120,
        finalSnakeLength: 25,
      },
      comboStats: {
        totalComboPoints: 500,
        basePoints: 500,
        comboEfficiency: 20,
        averageComboLength: 2.5,
      },
    };

    beforeEach(() => {
      // Mock validation to pass
      const validateScoreData = require('@/utils/scoreValidation').validateScoreData;
      validateScoreData.mockReturnValue({ isValid: true, errors: [] });
    });

    it('should create a score successfully with valid data', async () => {
      const mockSavedScore = { ...validScoreData, _id: 'mock-id', timestamp: new Date() };
      const mockScoreInstance = {
        save: jest.fn().mockResolvedValue(mockSavedScore),
        ...mockSavedScore,
      };
      
      MockScore.mockImplementation(() => mockScoreInstance as any);

      const result = await scoreService.createScore(validScoreData);

      expect(mockConnectToDatabase).toHaveBeenCalled();
      expect(MockScore).toHaveBeenCalledWith({
        ...validScoreData,
        timestamp: expect.any(Date),
      });
      expect(mockScoreInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockScoreInstance);
    });

    it('should throw ValidationError for invalid data', async () => {
      const validateScoreData = require('@/utils/scoreValidation').validateScoreData;
      validateScoreData.mockReturnValue({
        isValid: false,
        errors: ['Score is required', 'Player name is required'],
      });

      await expect(scoreService.createScore({})).rejects.toThrow(ValidationError);
      expect(MockScore).not.toHaveBeenCalled();
    });

    it('should throw SecurityError for suspicious timing', async () => {
      const suspiciousData = {
        ...validScoreData,
        gameMetrics: {
          ...validScoreData.gameMetrics,
          gameTimeSeconds: 1, // Too fast
        },
      };

      await expect(scoreService.createScore(suspiciousData)).rejects.toThrow(SecurityError);
    });

    it('should throw SecurityError for impossible score', async () => {
      const impossibleData = {
        ...validScoreData,
        score: 1000000, // Way too high for the game metrics
      };

      await expect(scoreService.createScore(impossibleData)).rejects.toThrow(SecurityError);
    });

    it('should handle database errors', async () => {
      const mockScoreInstance = {
        save: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };
      MockScore.mockImplementation(() => mockScoreInstance as any);

      await expect(scoreService.createScore(validScoreData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('getScores', () => {
    const mockScores = [
      { _id: '1', playerName: 'Player1', score: 1000 },
      { _id: '2', playerName: 'Player2', score: 900 },
    ];

    beforeEach(() => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockScores),
      };

      MockScore.find = jest.fn().mockReturnValue(mockQuery);
      MockScore.countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(100),
      });
    });

    it('should retrieve scores with default pagination', async () => {
      const options = {
        limit: 10,
        offset: 0,
        sortBy: 'score',
        order: 'desc' as const,
      };

      const result = await scoreService.getScores(options);

      expect(mockConnectToDatabase).toHaveBeenCalled();
      expect(MockScore.find).toHaveBeenCalledWith({});
      expect(result).toEqual({
        scores: mockScores,
        total: 100,
      });
    });

    it('should handle custom sorting and pagination', async () => {
      const options = {
        limit: 20,
        offset: 10,
        sortBy: 'timestamp',
        order: 'asc' as const,
      };

      await scoreService.getScores(options);

      const mockQuery = MockScore.find.mock.results[0].value;
      expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: 1 });
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(mockQuery.skip).toHaveBeenCalledWith(10);
    });

    it('should throw ValidationError for invalid sort field', async () => {
      const options = {
        limit: 10,
        offset: 0,
        sortBy: 'invalidField',
        order: 'desc' as const,
      };

      await expect(scoreService.getScores(options)).rejects.toThrow(ValidationError);
    });

    it('should handle database errors', async () => {
      MockScore.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const options = {
        limit: 10,
        offset: 0,
        sortBy: 'score',
        order: 'desc' as const,
      };

      await expect(scoreService.getScores(options)).rejects.toThrow(DatabaseError);
    });
  });

  describe('getPlayerScores', () => {
    const mockPlayerScores = [
      { _id: '1', playerName: 'TestPlayer', score: 1000 },
      { _id: '2', playerName: 'TestPlayer', score: 900 },
    ];

    beforeEach(() => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPlayerScores),
      };

      MockScore.find = jest.fn().mockReturnValue(mockQuery);
    });

    it('should retrieve player scores successfully', async () => {
      const result = await scoreService.getPlayerScores('TestPlayer', 10);

      expect(mockConnectToDatabase).toHaveBeenCalled();
      expect(MockScore.find).toHaveBeenCalledWith({ playerName: 'TestPlayer' });
      expect(result).toEqual(mockPlayerScores);
    });

    it('should throw ValidationError for invalid player name', async () => {
      await expect(scoreService.getPlayerScores('', 10)).rejects.toThrow(ValidationError);
      await expect(scoreService.getPlayerScores(null as any, 10)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid limit', async () => {
      await expect(scoreService.getPlayerScores('TestPlayer', 0)).rejects.toThrow(ValidationError);
      await expect(scoreService.getPlayerScores('TestPlayer', 100)).rejects.toThrow(ValidationError);
    });
  });

  describe('getLeaderboard', () => {
    const mockLeaderboard = [
      { _id: '1', playerName: 'Player1', score: 1000, timestamp: new Date() },
      { _id: '2', playerName: 'Player2', score: 900, timestamp: new Date() },
    ];

    beforeEach(() => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockLeaderboard),
      };

      MockScore.find = jest.fn().mockReturnValue(mockQuery);
    });

    it('should retrieve all-time leaderboard', async () => {
      const options = {
        period: 'all' as const,
        limit: 10,
      };

      const result = await scoreService.getLeaderboard(options);

      expect(MockScore.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockLeaderboard);
    });

    it('should retrieve daily leaderboard with date filter', async () => {
      const options = {
        period: 'daily' as const,
        limit: 10,
      };

      await scoreService.getLeaderboard(options);

      const findCall = MockScore.find.mock.calls[0][0];
      expect(findCall).toHaveProperty('timestamp');
      expect(findCall.timestamp).toHaveProperty('$gte');
    });

    it('should throw ValidationError for invalid limit', async () => {
      const options = {
        period: 'all' as const,
        limit: 0,
      };

      await expect(scoreService.getLeaderboard(options)).rejects.toThrow(ValidationError);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Clear rate limit cache
      global.rateLimitCache = {};
    });

    afterEach(() => {
      // Clean up global state
      delete global.rateLimitCache;
    });

    it('should allow submissions within rate limit', async () => {
      const isLimited = await ScoreService.isRateLimited('test-client');
      expect(isLimited).toBe(false);
    });

    it('should block submissions when rate limit exceeded', async () => {
      const testClientId = 'rate-limit-test-client';
      
      // Simulate multiple rapid submissions with slight delays to ensure unique timestamps
      for (let i = 0; i < 5; i++) {
        await ScoreService.isRateLimited(testClientId);
        // Add tiny delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const isLimited = await ScoreService.isRateLimited(testClientId);
      expect(isLimited).toBe(true);
    });

    it('should handle rate limiting errors gracefully', async () => {
      // Mock Date.now to throw an error
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => {
        throw new Error('Time error');
      });

      const isLimited = await ScoreService.isRateLimited('test-client');
      expect(isLimited).toBe(false); // Should not block on error

      Date.now = originalDateNow;
    });
  });

  describe('getDatabaseStats', () => {
    beforeEach(() => {
      MockScore.countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(100),
      });
      MockScore.distinct = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(['Player1', 'Player2', 'Player3']),
      });
      MockScore.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ score: 5000 }),
      });
      MockScore.aggregate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ avgScore: 1250.5 }]),
      });
    });

    it('should return database statistics', async () => {
      const stats = await scoreService.getDatabaseStats();

      expect(stats).toEqual({
        totalScores: 100,
        uniquePlayers: 3,
        highestScore: 5000,
        averageScore: 1251, // Rounded
      });
    });

    it('should handle missing data gracefully', async () => {
      MockScore.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      MockScore.aggregate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const stats = await scoreService.getDatabaseStats();

      expect(stats).toEqual({
        totalScores: 100,
        uniquePlayers: 3,
        highestScore: 0,
        averageScore: 0,
      });
    });
  });
});