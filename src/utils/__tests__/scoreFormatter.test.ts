import {
  formatScore,
  formatTimestamp,
  formatPlayerName,
  formatGameTime,
  formatComboCount,
  formatComboEfficiency,
  formatRank,
  formatFoodCount,
  abbreviateNumber,
  formatScoreEntry,
} from '../scoreFormatter';

describe('Score Formatter Utilities', () => {
  describe('formatScore', () => {
    it('should format positive numbers with thousand separators', () => {
      expect(formatScore(1000)).toBe('1,000');
      expect(formatScore(1234567)).toBe('1,234,567');
      expect(formatScore(500)).toBe('500');
      expect(formatScore(0)).toBe('0');
    });

    it('should handle invalid inputs gracefully', () => {
      expect(formatScore(NaN)).toBe('0');
      expect(formatScore(Number('invalid'))).toBe('0');
      expect(formatScore(-100)).toBe('0');
    });

    it('should handle edge cases', () => {
      expect(formatScore(Number.MAX_SAFE_INTEGER)).toContain(',');
      expect(formatScore(0.5)).toBe('1'); // Should round to nearest integer
    });
  });

  describe('formatTimestamp', () => {
    const now = new Date('2023-12-01T12:00:00Z');
    
    beforeAll(() => {
      // Mock Date constructor to return our fixed date
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should format relative timestamps correctly', () => {
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(formatTimestamp(oneMinuteAgo, 'relative')).toBe('1 minute ago');
      expect(formatTimestamp(oneHourAgo, 'relative')).toBe('1 hour ago');
      expect(formatTimestamp(oneDayAgo, 'relative')).toBe('1 day ago');
      expect(formatTimestamp(oneWeekAgo, 'relative')).toContain('Nov'); // Falls back to short format
    });

    it('should handle "just now" case', () => {
      const justNow = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
      expect(formatTimestamp(justNow, 'relative')).toBe('Just now');
    });

    it('should format short timestamps', () => {
      const testDate = new Date('2023-06-15T10:30:00Z');
      const result = formatTimestamp(testDate, 'short');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
    });

    it('should format long timestamps', () => {
      const testDate = new Date('2023-06-15T10:30:00Z');
      const result = formatTimestamp(testDate, 'long');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2023');
    });

    it('should handle invalid dates', () => {
      expect(formatTimestamp('invalid-date')).toBe('Unknown');
      expect(formatTimestamp(new Date('invalid'))).toBe('Unknown');
    });

    it('should handle string timestamps', () => {
      const isoString = '2023-06-15T10:30:00Z';
      const result = formatTimestamp(isoString, 'short');
      expect(result).toContain('Jun');
    });
  });

  describe('formatPlayerName', () => {
    it('should format valid names correctly', () => {
      expect(formatPlayerName('Player1')).toBe('Player1');
      expect(formatPlayerName('  Player Name  ')).toBe('Player Name');
    });

    it('should handle empty or invalid names', () => {
      expect(formatPlayerName('')).toBe('Anonymous');
      expect(formatPlayerName('   ')).toBe('Anonymous');
      expect(formatPlayerName(undefined as any)).toBe('Anonymous');
      expect(formatPlayerName(null as any)).toBe('Anonymous');
    });

    it('should truncate long names', () => {
      const longName = 'ThisIsAVeryLongPlayerNameThatExceedsTheLimit';
      const result = formatPlayerName(longName, 20);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });

    it('should sanitize dangerous characters', () => {
      expect(formatPlayerName('Player<script>alert(\"xss\")</script>', 50)).toBe('Playerscriptalert(xss)/script');
      expect(formatPlayerName('Player&Name')).toBe('PlayerName');
    });

    it('should handle custom max length', () => {
      const result = formatPlayerName('LongPlayerName', 10);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('formatGameTime', () => {
    it('should format seconds correctly', () => {
      expect(formatGameTime(30)).toBe('0:30');
      expect(formatGameTime(5)).toBe('0:05');
      expect(formatGameTime(0)).toBe('0:00');
    });

    it('should format minutes and seconds', () => {
      expect(formatGameTime(60)).toBe('1:00');
      expect(formatGameTime(125)).toBe('2:05');
      expect(formatGameTime(3661)).toBe('61:01'); // Over an hour
    });

    it('should handle invalid inputs', () => {
      expect(formatGameTime(NaN)).toBe('0:00');
      expect(formatGameTime(-5)).toBe('0:00');
      expect(formatGameTime(undefined as any)).toBe('0:00');
    });
  });

  describe('formatComboCount', () => {
    it('should format valid combo counts', () => {
      expect(formatComboCount(5)).toBe('5');
      expect(formatComboCount(0)).toBe('0');
      expect(formatComboCount(100)).toBe('100');
    });

    it('should handle invalid inputs', () => {
      expect(formatComboCount(NaN)).toBe('0');
      expect(formatComboCount(-5)).toBe('0');
      expect(formatComboCount(undefined as any)).toBe('0');
    });
  });

  describe('formatComboEfficiency', () => {
    it('should format efficiency as percentage', () => {
      expect(formatComboEfficiency(85.5)).toBe('85.5%');
      expect(formatComboEfficiency(100)).toBe('100.0%');
      expect(formatComboEfficiency(0)).toBe('0.0%');
    });

    it('should clamp values between 0 and 100', () => {
      expect(formatComboEfficiency(150)).toBe('100.0%');
      expect(formatComboEfficiency(-10)).toBe('0.0%');
    });

    it('should handle invalid inputs', () => {
      expect(formatComboEfficiency(NaN)).toBe('0.0%');
      expect(formatComboEfficiency(undefined as any)).toBe('0.0%');
    });
  });

  describe('formatRank', () => {
    it('should format ranks with ordinal suffixes', () => {
      expect(formatRank(1)).toBe('#1st');
      expect(formatRank(2)).toBe('#2nd');
      expect(formatRank(3)).toBe('#3rd');
      expect(formatRank(4)).toBe('#4th');
      expect(formatRank(11)).toBe('#11th');
      expect(formatRank(21)).toBe('#21st');
      expect(formatRank(22)).toBe('#22nd');
      expect(formatRank(23)).toBe('#23rd');
    });

    it('should handle invalid ranks', () => {
      expect(formatRank(0)).toBe('#1st');
      expect(formatRank(-5)).toBe('#1st');
      expect(formatRank(NaN)).toBe('#1st');
    });
  });

  describe('formatFoodCount', () => {
    it('should format food count correctly', () => {
      expect(formatFoodCount(50)).toBe('50');
      expect(formatFoodCount(0)).toBe('0');
    });

    it('should handle invalid inputs', () => {
      expect(formatFoodCount(NaN)).toBe('0');
      expect(formatFoodCount(-5)).toBe('0');
    });
  });

  describe('abbreviateNumber', () => {
    it('should abbreviate large numbers', () => {
      expect(abbreviateNumber(1000)).toBe('1.0K');
      expect(abbreviateNumber(1500)).toBe('1.5K');
      expect(abbreviateNumber(1000000)).toBe('1.0M');
      expect(abbreviateNumber(2500000)).toBe('2.5M');
    });

    it('should not abbreviate small numbers', () => {
      expect(abbreviateNumber(500)).toBe('500');
      expect(abbreviateNumber(999)).toBe('999');
    });

    it('should handle invalid inputs', () => {
      expect(abbreviateNumber(NaN)).toBe('0');
      expect(abbreviateNumber(undefined as any)).toBe('0');
    });
  });

  describe('formatScoreEntry', () => {
    const mockScoreData = {
      playerName: 'TestPlayer',
      score: 1000,
      timestamp: new Date('2023-06-15T10:30:00Z'),
      gameMetrics: {
        gameTimeSeconds: 300,
        totalFood: 50,
        longestCombo: 10,
      },
      comboStats: {
        comboEfficiency: 85.5,
      },
    };

    it('should format complete score entry', () => {
      const result = formatScoreEntry(mockScoreData, 1);

      expect(result.playerName).toBe('TestPlayer');
      expect(result.score).toBe('1,000');
      expect(result.rank).toBe('#1st');
      expect(result.gameTime).toBe('5:00');
      expect(result.foodCount).toBe('50');
      expect(result.longestCombo).toBe('10');
      expect(result.comboEfficiency).toBe('85.5%');
      expect(result.timestamp).toBeDefined();
    });

    it('should use different timestamp formats', () => {
      const result1 = formatScoreEntry(mockScoreData, 1, 'short');
      const result2 = formatScoreEntry(mockScoreData, 1, 'long');
      const result3 = formatScoreEntry(mockScoreData, 1, 'relative');

      expect(result1.timestamp).toContain('Jun');
      expect(result2.timestamp).toContain('2023');
      expect(result3.timestamp).toBeDefined();
    });

    it('should handle edge cases in score data', () => {
      const edgeCaseData = {
        ...mockScoreData,
        playerName: '',
        score: -100,
        gameMetrics: {
          ...mockScoreData.gameMetrics,
          gameTimeSeconds: -50,
        },
        comboStats: {
          comboEfficiency: 150,
        },
      };

      const result = formatScoreEntry(edgeCaseData, 0);

      expect(result.playerName).toBe('Anonymous');
      expect(result.score).toBe('0');
      expect(result.rank).toBe('#1st');
      expect(result.gameTime).toBe('0:00');
      expect(result.comboEfficiency).toBe('100.0%');
    });
  });
});

describe('Formatter Edge Cases', () => {
  it('should handle null and undefined inputs gracefully', () => {
    expect(formatScore(null as any)).toBe('0');
    expect(formatTimestamp(null as any)).toBe('Unknown');
    expect(formatPlayerName(null as any)).toBe('Anonymous');
    expect(formatGameTime(null as any)).toBe('0:00');
  });

  it('should handle extreme values', () => {
    expect(formatScore(Number.MAX_VALUE)).toContain(',');
    expect(formatGameTime(Number.MAX_VALUE)).toContain(':');
    expect(formatComboEfficiency(Number.MAX_VALUE)).toBe('100.0%');
  });

  it('should maintain consistent formatting', () => {
    // Test that repeated calls with same input produce same output
    const testValue = 12345;
    const result1 = formatScore(testValue);
    const result2 = formatScore(testValue);
    expect(result1).toBe(result2);
  });
});