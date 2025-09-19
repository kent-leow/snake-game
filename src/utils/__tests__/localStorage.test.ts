/**
 * Unit tests for localStorage utilities
 * Tests safe localStorage operations, error handling, and game-specific utilities
 */

import { LocalStorageUtils, GameStorageUtils } from '@/utils/localStorage';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  hasOwnProperty: jest.fn(),
};

// Setup localStorage mock with keys iteration
Object.defineProperty(localStorageMock, 'hasOwnProperty', {
  value: jest.fn(),
});

// Mock Object.keys to return localStorage keys
const originalObjectKeys = Object.keys;
Object.keys = jest.fn();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

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

    it('should handle JSON serialization errors', () => {
      localStorageMock.setItem.mockImplementation((_key, _value) => {});
      
      // Create circular reference that can't be serialized
      const circularObj: any = { prop: 'value' };
      circularObj.circular = circularObj;

      const result = LocalStorageUtils.setItem('test-key', circularObj);

      expect(result.success).toBe(false);
      expect(result.error).toContain('circular');
    });

    it('should suppress error logging when logErrors is false', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Test error');
      });

      LocalStorageUtils.setItem('test-key', 'test-value', { logErrors: false });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getItem', () => {
    it('should retrieve data successfully', () => {
      const testData = { name: 'test', score: 100 };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

      const result = LocalStorageUtils.getItem<typeof testData>('test-key');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
    });

    it('should return default value when item not found', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const defaultValue = { default: true };
      const result = LocalStorageUtils.getItem('test-key', { defaultValue });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(defaultValue);
    });

    it('should handle JSON parsing errors', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json{');

      const result = LocalStorageUtils.getItem('test-key');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle localStorage unavailable', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const defaultValue = 'default';
      const result = LocalStorageUtils.getItem('test-key', { defaultValue });

      expect(result.success).toBe(false);
      expect(result.data).toBe(defaultValue);
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', () => {
      localStorageMock.removeItem.mockImplementation((_key) => {});

      const result = LocalStorageUtils.removeItem('test-key');

      expect(result.success).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle localStorage unavailable', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const result = LocalStorageUtils.removeItem('test-key');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear localStorage successfully', () => {
      localStorageMock.clear.mockImplementation(() => {});

      const result = LocalStorageUtils.clear();

      expect(result.success).toBe(true);
      expect(localStorageMock.clear).toHaveBeenCalled();
    });

    it('should handle localStorage unavailable', () => {
      localStorageMock.clear.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const result = LocalStorageUtils.clear();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getStorageInfo', () => {
    it('should calculate storage usage', () => {
      // Mock localStorage properties
      Object.defineProperty(localStorageMock, 'key1', {
        value: 'value1',
        enumerable: true,
      });
      Object.defineProperty(localStorageMock, 'key2', {
        value: 'value2',
        enumerable: true,
      });
      
      localStorageMock.hasOwnProperty
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      const info = LocalStorageUtils.getStorageInfo();

      expect(info.used).toBeGreaterThan(0);
      expect(info.quota).toBe(5 * 1024 * 1024); // 5MB
      expect(info.available).toBeLessThan(info.quota);
    });

    it('should handle localStorage unavailable', () => {
      // Mock localStorage iteration to throw
      Object.defineProperty(localStorageMock, Symbol.iterator, {
        value: () => {
          throw new Error('localStorage not available');
        },
      });

      const info = LocalStorageUtils.getStorageInfo();

      expect(info).toEqual({
        used: 0,
        available: 0,
        quota: 0,
      });
    });
  });

  describe('getAllKeys', () => {
    it('should return all localStorage keys', () => {
      (Object.keys as jest.Mock).mockReturnValue(['key1', 'key2', 'key3']);

      const keys = LocalStorageUtils.getAllKeys();

      expect(keys).toEqual(['key1', 'key2', 'key3']);
      expect(Object.keys).toHaveBeenCalledWith(localStorage);
    });

    it('should handle localStorage unavailable', () => {
      (Object.keys as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const keys = LocalStorageUtils.getAllKeys();

      expect(keys).toEqual([]);
    });
  });

  describe('getItemsByPrefix', () => {
    it('should return items matching prefix', () => {
      (Object.keys as jest.Mock).mockReturnValue([
        'snake_game_score1',
        'snake_game_score2',
        'other_key',
      ]);
      
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify({ score: 100 }))
        .mockReturnValueOnce(JSON.stringify({ score: 200 }));

      const items = LocalStorageUtils.getItemsByPrefix('snake_game_');

      expect(items).toEqual({
        'snake_game_score1': { score: 100 },
        'snake_game_score2': { score: 200 },
      });
    });

    it('should handle localStorage errors gracefully', () => {
      (Object.keys as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const items = LocalStorageUtils.getItemsByPrefix('test_');

      expect(items).toEqual({});
    });
  });

  describe('removeItemsByPrefix', () => {
    it('should remove items matching prefix', () => {
      (Object.keys as jest.Mock).mockReturnValue([
        'snake_game_score1',
        'snake_game_score2',
        'other_key',
      ]);
      
      localStorageMock.removeItem.mockImplementation(() => {});

      const removedCount = LocalStorageUtils.removeItemsByPrefix('snake_game_');

      expect(removedCount).toBe(2);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('snake_game_score1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('snake_game_score2');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other_key');
    });

    it('should handle removal errors gracefully', () => {
      (Object.keys as jest.Mock).mockReturnValue(['snake_game_score1']);
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Remove failed');
      });

      const removedCount = LocalStorageUtils.removeItemsByPrefix('snake_game_');

      expect(removedCount).toBe(0);
    });
  });
});

describe('GameStorageUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('Player Name Management', () => {
    it('should save and retrieve player name', () => {
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue(JSON.stringify('TestPlayer'));

      const saveResult = GameStorageUtils.savePlayerName('TestPlayer');
      expect(saveResult).toBe(true);

      const retrievedName = GameStorageUtils.getPlayerName();
      expect(retrievedName).toBe('TestPlayer');
    });

    it('should return empty string when no player name saved', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const playerName = GameStorageUtils.getPlayerName();
      expect(playerName).toBe('');
    });

    it('should handle save errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = GameStorageUtils.savePlayerName('TestPlayer');
      expect(result).toBe(false);
    });
  });

  describe('Game Settings Management', () => {
    it('should save and retrieve game settings', () => {
      const settings = { difficulty: 'hard', sound: true };
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue(JSON.stringify(settings));

      const saveResult = GameStorageUtils.saveGameSettings(settings);
      expect(saveResult).toBe(true);

      const defaultSettings = { difficulty: 'easy', sound: false };
      const retrievedSettings = GameStorageUtils.getGameSettings(defaultSettings);
      expect(retrievedSettings).toEqual(settings);
    });

    it('should return default settings when none saved', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const defaultSettings = { difficulty: 'easy', sound: false };
      const settings = GameStorageUtils.getGameSettings(defaultSettings);
      expect(settings).toEqual(defaultSettings);
    });
  });

  describe('Game Data Management', () => {
    it('should clear all game data', () => {
      (Object.keys as jest.Mock).mockReturnValue([
        'snake_game_player_name',
        'snake_game_settings',
        'other_key',
      ]);
      localStorageMock.removeItem.mockImplementation(() => {});

      const removedCount = GameStorageUtils.clearAllGameData();

      expect(removedCount).toBe(2);
    });

    it('should get game storage info', () => {
      (Object.keys as jest.Mock).mockReturnValue([
        'snake_game_player_name',
        'snake_game_settings',
      ]);
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify('TestPlayer'))
        .mockReturnValueOnce(JSON.stringify({ sound: true }));

      const info = GameStorageUtils.getGameStorageInfo();

      expect(info.keys).toEqual([
        'snake_game_player_name',
        'snake_game_settings',
      ]);
      expect(info.totalSize).toBeGreaterThan(0);
    });
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
});