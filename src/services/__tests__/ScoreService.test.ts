/**
 * Unit tests for ScoreService
 * Tests online/offline functionality, local storage fallback, and sync behavior
 */

import { ScoreService, type ScoreSubmissionData } from '../ScoreService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
    userAgent: 'test-agent',
  },
  writable: true,
});

// Mock screen
Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
  },
});

describe('ScoreService', () => {
  let scoreService: ScoreService;
  let mockScoreData: ScoreSubmissionData;

  beforeEach(() => {
    scoreService = new ScoreService();
    
    // Reset all mocks
    mockFetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // Mock default localStorage behavior
    localStorageMock.getItem.mockReturnValue(null);
    
    // Setup mock score data
    mockScoreData = {
      playerName: 'TestPlayer',
      score: 1000,
      gameMetrics: {
        totalFood: 50,
        totalCombos: 10,
        longestCombo: 5,
        maxSpeedLevel: 3,
        gameTimeSeconds: 120,
        finalSnakeLength: 20,
      },
      comboStats: {
        totalComboPoints: 500,
        basePoints: 500,
        comboEfficiency: 0.8,
        averageComboLength: 4.5,
      },
    };
  });

  describe('Online Score Submission', () => {
    it('should submit score successfully when online', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: { _id: 'test-score-id' }
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await scoreService.submitScore(mockScoreData);

      expect(result.success).toBe(true);
      expect(result.saved).toBe('online');
      expect(result.scoreId).toBe('test-score-id');
      expect(mockFetch).toHaveBeenCalledWith('/api/scores', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"playerName":"TestPlayer"'),
      }));
    });

    it('should include metadata in online submissions', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: { _id: 'test-id' } })
      };
      mockFetch.mockResolvedValue(mockResponse);

      await scoreService.submitScore(mockScoreData);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.metadata).toEqual({
        browserInfo: 'test-agent',
        screenResolution: '1920x1080',
        gameVersion: '1.0.0',
      });
      expect(typeof requestBody.timestamp).toBe('string');
      expect(new Date(requestBody.timestamp).toISOString()).toBe(requestBody.timestamp);
    });

    it('should handle HTTP errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
      mockFetch.mockResolvedValue(mockResponse);
      localStorageMock.getItem.mockReturnValue('[]'); // Empty pending scores

      const result = await scoreService.submitScore(mockScoreData);

      expect(result.success).toBe(true); // Fallback to offline
      expect(result.saved).toBe('offline');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      localStorageMock.getItem.mockReturnValue('[]');

      const result = await scoreService.submitScore(mockScoreData);

      expect(result.success).toBe(true); // Fallback to offline
      expect(result.saved).toBe('offline');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Offline Score Storage', () => {
    it('should save score to localStorage when online submission fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      localStorageMock.getItem.mockReturnValue('[]');

      const result = await scoreService.submitScore(mockScoreData);

      expect(result.success).toBe(true);
      expect(result.saved).toBe('offline');
      
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      expect(setItemCall[0]).toBe('snake_game_pending_scores');
      
      const savedData = JSON.parse(setItemCall[1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0]).toMatchObject({
        ...mockScoreData,
        offline: true,
        attempts: 0,
      });
    });

    it('should limit offline scores to maximum count', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      // Mock existing 10 offline scores
      const existingScores = Array.from({ length: 10 }, (_, i) => ({
        ...mockScoreData,
        playerName: `Player${i}`,
        timestamp: new Date().toISOString(),
        offline: true,
        attempts: 0,
      }));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingScores));

      await scoreService.submitScore(mockScoreData);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      
      expect(savedData).toHaveLength(10); // Should not exceed maximum
      expect(savedData[savedData.length - 1].playerName).toBe('TestPlayer'); // New score should be last
    });

    it('should handle localStorage errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await scoreService.submitScore(mockScoreData);

      expect(result.success).toBe(false);
      expect(result.saved).toBe('failed');
      expect(result.error).toBe('Failed to save score locally');
      
      // Reset mocks for subsequent tests
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockImplementation(() => {});
    });
  });

  describe('Score Synchronization', () => {
    it('should sync pending scores when called', async () => {
      const pendingScores = [
        {
          ...mockScoreData,
          playerName: 'Player1',
          timestamp: '2023-01-01T00:00:00.000Z',
          offline: true,
          attempts: 0,
        },
        {
          ...mockScoreData,
          playerName: 'Player2',
          timestamp: '2023-01-01T00:01:00.000Z',
          offline: true,
          attempts: 0,
        },
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingScores));
      
      // Mock successful API calls
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({}) })
        .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({}) });

      await scoreService.syncPendingScores();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Should clear all synced scores
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const remainingScores = JSON.parse(setItemCall[1]);
      expect(remainingScores).toHaveLength(0);
    });

    it('should handle partial sync failures', async () => {
      const pendingScores = [
        {
          ...mockScoreData,
          playerName: 'Player1',
          timestamp: '2023-01-01T00:00:00.000Z',
          offline: true,
          attempts: 0,
        },
        {
          ...mockScoreData,
          playerName: 'Player2',
          timestamp: '2023-01-01T00:01:00.000Z',
          offline: true,
          attempts: 0,
        },
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingScores));
      
      // Mock one success, one failure
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({}) })
        .mockResolvedValueOnce({ ok: false, status: 500 });

      await scoreService.syncPendingScores();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Should only remove successfully synced score
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const remainingScores = JSON.parse(setItemCall[1]);
      expect(remainingScores).toHaveLength(1);
      expect(remainingScores[0].playerName).toBe('Player2');
    });

    it('should abandon scores after maximum attempts', async () => {
      const pendingScores = [
        {
          ...mockScoreData,
          playerName: 'Player1',
          timestamp: '2023-01-01T00:00:00.000Z',
          offline: true,
          attempts: 4, // Exceeds maximum
        },
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingScores));

      await scoreService.syncPendingScores();

      expect(mockFetch).not.toHaveBeenCalled(); // Should not attempt sync
      
      // Should remove abandoned score
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const remainingScores = JSON.parse(setItemCall[1]);
      expect(remainingScores).toHaveLength(0);
    });
  });

  describe('Utility Methods', () => {
    it('should return correct pending score count', () => {
      const pendingScores = [mockScoreData, mockScoreData];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingScores));

      const count = scoreService.getPendingScoreCount();
      expect(count).toBe(2);
    });

    it('should handle localStorage errors when getting count', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const count = scoreService.getPendingScoreCount();
      expect(count).toBe(0);
    });

    it('should clear pending scores', () => {
      scoreService.clearPendingScores();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('snake_game_pending_scores');
    });

    it('should check online status', () => {
      expect(scoreService.isOnline()).toBe(true);
      
      // Mock offline
      Object.defineProperty(window, 'navigator', {
        value: { onLine: false },
        writable: true,
      });
      
      expect(scoreService.isOnline()).toBe(false);
    });

    it('should return pending scores for display', () => {
      const pendingScores = [mockScoreData];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(pendingScores));

      const scores = scoreService.getPendingScoresForDisplay();
      expect(scores).toEqual(pendingScores);
    });
  });

  describe('Player Best Scores', () => {
    it('should fetch player best scores', async () => {
      const mockScores = [
        { score: 1000, timestamp: '2023-01-01' },
        { score: 800, timestamp: '2023-01-02' },
      ];
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: { scores: mockScores }
        })
      });

      const scores = await scoreService.getPlayerBestScores('TestPlayer');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/scores/player/TestPlayer');
      expect(scores).toEqual(mockScores);
    });

    it('should handle API errors when fetching player scores', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const scores = await scoreService.getPlayerBestScores('TestPlayer');
      expect(scores).toEqual([]);
    });

    it('should handle non-ok responses when fetching player scores', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const scores = await scoreService.getPlayerBestScores('TestPlayer');
      expect(scores).toEqual([]);
    });
  });
});