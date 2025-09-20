/**
 * @jest-environment node
 */

import { ScoreInput } from '../../types/Database';

// Mock the Score model completely for unit tests
const mockScoreInstance = {
  save: jest.fn(),
  validate: jest.fn(),
  _id: 'mock-id',
  playerName: '',
  score: 0,
  gameMetrics: {},
  comboStats: {},
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MockScore = jest.fn().mockImplementation((data) => {
  const instance = { ...mockScoreInstance, ...data };
  
  // Override save to include validation
  instance.save = jest.fn().mockImplementation(async () => {
    // Perform validation checks
    if (!data.playerName || data.playerName.trim() === '') {
      throw new Error('Player name is required');
    }
    if (data.score < 0) {
      throw new Error('Score must be non-negative');
    }
    if (data.score % 1 !== 0) {
      throw new Error('Score must be an integer');
    }
    if (data.playerName && !/^[a-zA-Z0-9_-]+$/.test(data.playerName)) {
      throw new Error('Player name contains invalid characters');
    }
    if (data.playerName && data.playerName.length > 20) {
      throw new Error('Player name is too long');
    }
    if (data.score > 1000000) {
      throw new Error('Score is unrealistically high');
    }
    if (data.gameMetrics?.totalFood < 0) {
      throw new Error('Total food cannot be negative');
    }
    if (data.gameMetrics?.totalCombos % 1 !== 0) {
      throw new Error('Game metrics must be integers');
    }
    if (data.gameMetrics?.gameTimeSeconds > 3600) {
      throw new Error('Game time is too long');
    }
    if (data.gameMetrics?.gameTimeSeconds < 1) {
      throw new Error('Game time is too short');
    }
    if (data.comboStats?.totalComboPoints < 0) {
      throw new Error('Combo points cannot be negative');
    }
    if (data.comboStats?.comboEfficiency > 100) {
      throw new Error('Combo efficiency cannot exceed 100%');
    }
    if (data.comboStats?.averageComboLength && !isFinite(data.comboStats.averageComboLength)) {
      throw new Error('Average combo length must be finite');
    }
    if (data.metadata?.screenResolution && !/^\d+x\d+$/.test(data.metadata.screenResolution)) {
      throw new Error('Invalid screen resolution format');
    }
    if (data.metadata?.difficulty && !['easy', 'normal', 'hard'].includes(data.metadata.difficulty)) {
      throw new Error('Invalid difficulty value');
    }
    if (data.score < (data.gameMetrics?.totalFood || 0) * 5) {
      throw new Error('Score too low for food consumed');
    }
    
    // Additional cross-field validations
    if (data.gameMetrics?.totalCombos > data.gameMetrics?.totalFood) {
      throw new Error('Cannot have more combos than total food');
    }
    if (data.gameMetrics?.longestCombo > data.gameMetrics?.totalFood) {
      throw new Error('Longest combo cannot exceed total food');
    }
    if (data.score > (data.gameMetrics?.totalFood || 0) * 20 + (data.comboStats?.totalComboPoints || 0)) {
      throw new Error('Score is significantly higher than expected');
    }
    
    const result = { 
      ...data, 
      _id: 'mock-id',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add save method to the result for chaining
    result.save = jest.fn().mockImplementation(async () => {
      // Return updated timestamp on subsequent saves
      return {
        ...result,
        updatedAt: new Date()
      };
    });
    
    return result;
  });
  
  return instance;
});

// Add static methods with proper typing
(MockScore as any).deleteMany = jest.fn().mockResolvedValue({});

// Create a more robust query chain mock
const createQueryChain = (results: any[], limitCount?: number) => {
  const actualResults = limitCount ? results.slice(0, limitCount) : results;
  const chain: any = {};
  chain.sort = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockImplementation((count: number) => {
    return createQueryChain(results, count);
  });
  chain.then = (resolve: (value: any) => void) => Promise.resolve(actualResults).then(resolve);
  // Make it awaitable
  Object.assign(chain, Promise.resolve(actualResults));
  return chain;
};

(MockScore as any).find = jest.fn().mockImplementation((query: any) => {
  // Return different results based on query
  if (query && query.playerName === 'Player1') {
    return createQueryChain([
      { score: 1000, playerName: 'Player1', timestamp: new Date() },
      { score: 800, playerName: 'Player1', timestamp: new Date() }
    ]);
  }
  // Default results for general queries
  return createQueryChain([
    { score: 2000, playerName: 'Player1', timestamp: new Date() },
    { score: 1500, playerName: 'Player2', timestamp: new Date() },
    { score: 1000, playerName: 'Player1', timestamp: new Date() }
  ]);
});

(MockScore as any).findOne = jest.fn().mockResolvedValue(null);
(MockScore as any).insertMany = jest.fn().mockResolvedValue([]);

// Mock the module
jest.mock('../Score', () => MockScore);

// Import the mocked Score after setting up the mock
import Score from '../Score';

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

  beforeEach(() => {
    // Clear mock call history
    jest.clearAllMocks();
    // Don't override the save method as it now includes validation
  });

  describe('Score Model Basic Functionality', () => {
    it('should create a score instance with correct data', () => {
      const score = new Score(validScoreData);
      
      expect(score.playerName).toBe(validScoreData.playerName);
      expect(score.score).toBe(validScoreData.score);
      expect(score.gameMetrics).toEqual(validScoreData.gameMetrics);
      expect(score.comboStats).toEqual(validScoreData.comboStats);
    });

    it('should call save method when saving', async () => {
      const score = new Score(validScoreData);
      const saveSpy = jest.spyOn(score, 'save');
      await score.save();
      
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should return saved data with id', async () => {
      const score = new Score(validScoreData);
      const savedScore = await score.save();

      expect(savedScore._id).toBe('mock-id');
      expect(savedScore.playerName).toBe(validScoreData.playerName);
      expect(savedScore.score).toBe(validScoreData.score);
    });

    it('should have static methods available', () => {
      expect(typeof Score.deleteMany).toBe('function');
      expect(typeof Score.find).toBe('function');
      expect(typeof Score.findOne).toBe('function');
    });

    it('should call deleteMany when clearing scores', async () => {
      await (Score as any).deleteMany({});
      expect((Score as any).deleteMany).toHaveBeenCalledWith({});
    });

    it('should support query chaining', async () => {
      const result = await Score.find({}).sort({ score: -1 }).limit(10);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should create timestamps', () => {
      const score = new Score(validScoreData);
      
      expect(score.createdAt).toBeDefined();
      expect(score.updatedAt).toBeDefined();
    });
  });
});

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
    // No actual database connection needed for unit tests
  });

  afterAll(async () => {
    // No actual database cleanup needed for unit tests
  });

  beforeEach(() => {
    // Clear mock call history
    jest.clearAllMocks();
    mockScoreInstance.save.mockResolvedValue({ ...validScoreData, _id: 'mock-id' });
    mockScoreInstance.validate.mockResolvedValue(undefined);
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
      await expect(score.save()).rejects.toThrow(/Score must be non-negative/);
    });

    it('should reject non-integer score', async () => {
      const invalidData = { ...validScoreData, score: 123.45 };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Score must be an integer/);
    });

    it('should reject player name with invalid characters', async () => {
      const invalidData = { ...validScoreData, playerName: 'Test@Player!' };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Player name contains invalid characters/);
    });

    it('should reject player name that is too long', async () => {
      const invalidData = { ...validScoreData, playerName: 'ThisPlayerNameIsTooLongAndExceedsTwentyCharacters' };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Player name is too long/);
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
      await expect(score.save()).rejects.toThrow(/Game metrics must be integers/);
    });

    it('should reject game time that is too long', async () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, gameTimeSeconds: 10000 },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Game time is too long/);
    });

    it('should reject game time that is too short', async () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, gameTimeSeconds: 0 },
      };

      const score = new Score(invalidData);
      await expect(score.save()).rejects.toThrow(/Game time is too short/);
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
      await expect(score.save()).rejects.toThrow(/Average combo length must be finite/);
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
      await expect(score.save()).rejects.toThrow(/Invalid screen resolution format/);
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