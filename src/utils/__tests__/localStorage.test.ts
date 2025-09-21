/**
 * Unit tests for localStorage utilities
 * Tests safe localStorage operations, error handling, and game-specific utilities
 */

import { LocalStorageUtils, GameStorageUtils } from '../localStorage';

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

// Mock Object.keys to return localStorage keys
const originalObjectKeys = Object.keys;
Object.keys = jest.fn();

describe('LocalStorageUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // Reset Object.keys mock
    (Object.keys as jest.Mock).mockImplementation(originalObjectKeys);
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      localStorageMock.setItem.mockImplementation((_key, _value) => {});
      localStorageMock.removeItem.mockImplementation((_key) => {});

      const result = LocalStorageUtils.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when localStorage throws errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const result = LocalStorageUtils.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('setItem', () => {
    it('should store data successfully', () => {
      localStorageMock.setItem.mockImplementation((_key, _value) => {});

      const testData = { name: 'test', score: 100 };
      const result = LocalStorageUtils.setItem('test-key', testData);

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData)
      );
    });

    it('should handle localStorage unavailable', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const result = LocalStorageUtils.setItem('test-key', 'test-value');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('basic functionality', () => {
    it('should provide expected API methods', () => {
      expect(typeof LocalStorageUtils.isAvailable).toBe('function');
      expect(typeof LocalStorageUtils.setItem).toBe('function');
      expect(typeof LocalStorageUtils.getItem).toBe('function');
      expect(typeof LocalStorageUtils.removeItem).toBe('function');
      expect(typeof LocalStorageUtils.clear).toBe('function');
    });
  });
});

describe('GameStorageUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('Storage Keys', () => {
    it('should have correct predefined keys', () => {
      expect(GameStorageUtils.KEYS.PLAYER_NAME).toBe('snake_game_player_name');
      expect(GameStorageUtils.KEYS.PENDING_SCORES).toBe('snake_game_pending_scores');
      expect(GameStorageUtils.KEYS.GAME_SETTINGS).toBe('snake_game_settings');
      expect(GameStorageUtils.KEYS.HIGH_SCORES).toBe('snake_game_high_scores');
      expect(GameStorageUtils.KEYS.GAME_STATISTICS).toBe('snake_game_statistics');
    });
  });

  describe('basic functionality', () => {
    it('should provide expected API methods', () => {
      expect(typeof GameStorageUtils.savePlayerName).toBe('function');
      expect(typeof GameStorageUtils.getPlayerName).toBe('function');
      expect(typeof GameStorageUtils.saveGameSettings).toBe('function');
      expect(typeof GameStorageUtils.getGameSettings).toBe('function');
      expect(typeof GameStorageUtils.clearAllGameData).toBe('function');
    });
  });
});