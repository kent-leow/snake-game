import {
  validateScoreData,
  sanitizePlayerName,
  isValidScoreData,
  getValidationErrorMessage,
} from '../../utils/scoreValidation';
import { ScoreInput, GameMetrics, ComboStats } from '../../types/Database';

describe('Score Validation Utilities', () => {
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

  describe('validateScoreData', () => {
    it('should validate correct score data', () => {
      const result = validateScoreData(validScoreData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing player name', () => {
      const invalidData = { ...validScoreData };
      delete (invalidData as Partial<ScoreInput>).playerName;

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player name is required and must be a string');
    });

    it('should reject empty player name', () => {
      const invalidData = { ...validScoreData, playerName: '   ' };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player name cannot be empty');
    });

    it('should reject player name that is too long', () => {
      const invalidData = { ...validScoreData, playerName: 'ThisNameIsTooLongForTheSystem' };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player name cannot exceed 20 characters');
    });

    it('should reject player name with invalid characters', () => {
      const invalidData = { ...validScoreData, playerName: 'Test@Player!' };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Player name can only contain letters, numbers, spaces, hyphens, and underscores'
      );
    });

    it('should reject negative score', () => {
      const invalidData = { ...validScoreData, score: -100 };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Score cannot be negative');
    });

    it('should reject non-integer score', () => {
      const invalidData = { ...validScoreData, score: 123.45 };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Score must be an integer');
    });

    it('should warn about unusually high score', () => {
      const highScoreData = { 
        ...validScoreData, 
        score: 1500000, // Higher than 1M threshold
        gameMetrics: {
          ...validScoreData.gameMetrics,
          totalFood: 1000, // Much higher to avoid cross-validation issues
        },
        comboStats: {
          ...validScoreData.comboStats,
          basePoints: 1000000,
          totalComboPoints: 500000,
        }
      };

      const result = validateScoreData(highScoreData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('Score is unusually high - please verify');
    });

    it('should reject missing game metrics', () => {
      const invalidData = { ...validScoreData };
      delete (invalidData as Partial<ScoreInput>).gameMetrics;

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Game metrics are required');
    });

    it('should reject missing combo stats', () => {
      const invalidData = { ...validScoreData };
      delete (invalidData as Partial<ScoreInput>).comboStats;

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Combo statistics are required');
    });
  });

  describe('Game Metrics Validation', () => {
    it('should reject negative total food', () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, totalFood: -5 },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total food cannot be negative');
    });

    it('should reject non-integer total food', () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, totalFood: 5.5 },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total food must be an integer');
    });

    it('should reject unrealistic longest combo', () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, longestCombo: 150 },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Longest combo seems unrealistically high');
    });

    it('should reject game time exceeding 2 hours', () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, gameTimeSeconds: 8000 },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Game time cannot exceed 2 hours');
    });

    it('should reject game time less than 1 second', () => {
      const invalidData = {
        ...validScoreData,
        gameMetrics: { ...validScoreData.gameMetrics, gameTimeSeconds: 0.5 },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Game time must be at least 1 second');
    });
  });

  describe('Combo Stats Validation', () => {
    it('should reject negative combo points', () => {
      const invalidData = {
        ...validScoreData,
        comboStats: { ...validScoreData.comboStats, totalComboPoints: -100 },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total combo points cannot be negative');
    });

    it('should reject combo efficiency over 100%', () => {
      const invalidData = {
        ...validScoreData,
        comboStats: { ...validScoreData.comboStats, comboEfficiency: 150 },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Combo efficiency cannot exceed 100%');
    });

    it('should reject infinite average combo length', () => {
      const invalidData = {
        ...validScoreData,
        comboStats: { ...validScoreData.comboStats, averageComboLength: Infinity },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Average combo length must be a finite number');
    });
  });

  describe('Metadata Validation', () => {
    it('should accept valid metadata', () => {
      const result = validateScoreData(validScoreData);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid screen resolution format', () => {
      const invalidData = {
        ...validScoreData,
        metadata: { ...validScoreData.metadata, screenResolution: 'invalid-format' },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Screen resolution must be in format "1920x1080"');
    });

    it('should reject invalid difficulty', () => {
      const invalidData = {
        ...validScoreData,
        metadata: { ...validScoreData.metadata, difficulty: 'impossible' as any },
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Difficulty must be easy, normal, or hard');
    });

    it('should work without metadata', () => {
      const dataWithoutMetadata = { ...validScoreData };
      delete dataWithoutMetadata.metadata;

      const result = validateScoreData(dataWithoutMetadata);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Cross-field Validation', () => {
    it('should reject score too low for food consumed', () => {
      const invalidData = {
        ...validScoreData,
        score: 100, // Too low for 50 food items
      };

      const result = validateScoreData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Score too low for amount of food consumed');
    });

    it('should warn about high combo rate', () => {
      const suspiciousData = {
        ...validScoreData,
        gameMetrics: {
          ...validScoreData.gameMetrics,
          totalFood: 30,
          totalCombos: 15, // Very high combo rate
        },
      };

      const result = validateScoreData(suspiciousData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('High combo rate - please verify legitimacy');
    });

    it('should warn about score significantly higher than calculated points', () => {
      const suspiciousData = {
        ...validScoreData,
        score: 2000,
        comboStats: {
          ...validScoreData.comboStats,
          basePoints: 500,
          totalComboPoints: 700,
        },
      };

      const result = validateScoreData(suspiciousData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Score significantly higher than calculated points');
    });
  });

  describe('sanitizePlayerName', () => {
    it('should sanitize valid name correctly', () => {
      const result = sanitizePlayerName('Valid_Player-123');
      expect(result).toBe('Valid_Player-123');
    });

    it('should remove invalid characters', () => {
      const result = sanitizePlayerName('Test@Player!#$');
      expect(result).toBe('TestPlayer');
    });

    it('should trim and limit length', () => {
      const result = sanitizePlayerName('  ThisIsVeryLongPlayerNameThatExceedsLimit  ');
      expect(result).toBe('ThisIsVeryLongPlayer');
    });

    it('should normalize spaces', () => {
      const result = sanitizePlayerName('Test   Player  Name');
      expect(result).toBe('Test Player Name');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizePlayerName('')).toBe('');
      expect(sanitizePlayerName(null as any)).toBe('');
      expect(sanitizePlayerName(undefined as any)).toBe('');
    });
  });

  describe('isValidScoreData', () => {
    it('should return true for valid data', () => {
      expect(isValidScoreData(validScoreData)).toBe(true);
    });

    it('should return false for invalid data', () => {
      const invalidData = { ...validScoreData, score: -100 };
      expect(isValidScoreData(invalidData)).toBe(false);
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should return empty string for valid data', () => {
      const result = validateScoreData(validScoreData);
      expect(getValidationErrorMessage(result)).toBe('');
    });

    it('should return error message for invalid data', () => {
      const invalidData = { ...validScoreData, score: -100 };
      const result = validateScoreData(invalidData);
      const message = getValidationErrorMessage(result);

      expect(message).toContain('Score cannot be negative');
    });

    it('should limit error messages and indicate more errors', () => {
      const invalidData = {
        ...validScoreData,
        playerName: '',
        score: -100,
        gameMetrics: undefined as unknown as GameMetrics,
        comboStats: undefined as unknown as ComboStats,
      };
      const result = validateScoreData(invalidData);
      const message = getValidationErrorMessage(result);

      expect(message).toContain('and');
      expect(message).toContain('more errors');
    });
  });
});