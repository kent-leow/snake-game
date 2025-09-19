/**
 * Local storage utilities for safe browser storage operations
 * Provides error handling and type safety for localStorage operations
 */

/**
 * Storage result for operations that may fail
 */
interface StorageResult<T> {
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
}

/**
 * Configuration for storage operations
 */
interface StorageOptions<T = unknown> {
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Default value if retrieval fails */
  defaultValue?: T;
  /** Whether to compress large objects */
  compress?: boolean;
}

/**
 * Safe localStorage wrapper with error handling and type safety
 */
export class LocalStorageUtils {
  private static readonly LOG_PREFIX = '[LocalStorage]';

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safely store data in localStorage
   */
  static setItem<T>(
    key: string, 
    value: T, 
    options: StorageOptions = {}
  ): StorageResult<void> {
    const { logErrors = true } = options;

    try {
      if (!this.isAvailable()) {
        const error = 'localStorage is not available';
        if (logErrors) console.warn(`${this.LOG_PREFIX} ${error}`);
        return { success: false, error };
      }

      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (logErrors) console.error(`${this.LOG_PREFIX} Failed to set item '${key}':`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Safely retrieve data from localStorage
   */
  static getItem<T>(
    key: string, 
    options: StorageOptions<T> = {}
  ): StorageResult<T> {
    const { logErrors = true, defaultValue } = options;

    try {
      if (!this.isAvailable()) {
        const error = 'localStorage is not available';
        if (logErrors) console.warn(`${this.LOG_PREFIX} ${error}`);
        return { success: false, error, data: defaultValue };
      }

      const item = localStorage.getItem(key);
      
      if (item === null) {
        return { success: true, data: defaultValue };
      }

      const parsedValue = JSON.parse(item) as T;
      return { success: true, data: parsedValue };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (logErrors) console.error(`${this.LOG_PREFIX} Failed to get item '${key}':`, errorMessage);
      return { success: false, error: errorMessage, data: defaultValue };
    }
  }

  /**
   * Safely remove item from localStorage
   */
  static removeItem(key: string, options: StorageOptions = {}): StorageResult<void> {
    const { logErrors = true } = options;

    try {
      if (!this.isAvailable()) {
        const error = 'localStorage is not available';
        if (logErrors) console.warn(`${this.LOG_PREFIX} ${error}`);
        return { success: false, error };
      }

      localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (logErrors) console.error(`${this.LOG_PREFIX} Failed to remove item '${key}':`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clear all localStorage data
   */
  static clear(options: StorageOptions = {}): StorageResult<void> {
    const { logErrors = true } = options;

    try {
      if (!this.isAvailable()) {
        const error = 'localStorage is not available';
        if (logErrors) console.warn(`${this.LOG_PREFIX} ${error}`);
        return { success: false, error };
      }

      localStorage.clear();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (logErrors) console.error(`${this.LOG_PREFIX} Failed to clear localStorage:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get available storage space (approximate)
   */
  static getStorageInfo(): { used: number; available: number; quota: number } {
    try {
      if (!this.isAvailable()) {
        return { used: 0, available: 0, quota: 0 };
      }

      let used = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Rough estimate - localStorage typically has ~5-10MB limit
      const quota = 5 * 1024 * 1024; // 5MB estimate
      const available = quota - used;

      return { used, available, quota };
    } catch {
      return { used: 0, available: 0, quota: 0 };
    }
  }

  /**
   * Check if storage has enough space for data
   */
  static hasSpaceFor(data: any): boolean {
    try {
      const serialized = JSON.stringify(data);
      const { available } = this.getStorageInfo();
      return serialized.length < available;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys in localStorage
   */
  static getAllKeys(): string[] {
    try {
      if (!this.isAvailable()) return [];
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  }

  /**
   * Get all items matching a key prefix
   */
  static getItemsByPrefix<T>(prefix: string): Record<string, T> {
    const result: Record<string, T> = {};
    
    try {
      if (!this.isAvailable()) return result;

      for (const key of this.getAllKeys()) {
        if (key.startsWith(prefix)) {
          const itemResult = this.getItem<T>(key, { logErrors: false });
          if (itemResult.success && itemResult.data !== undefined) {
            result[key] = itemResult.data;
          }
        }
      }
    } catch (error) {
      console.warn(`${this.LOG_PREFIX} Failed to get items by prefix '${prefix}':`, error);
    }

    return result;
  }

  /**
   * Remove all items matching a key prefix
   */
  static removeItemsByPrefix(prefix: string): number {
    let removedCount = 0;

    try {
      if (!this.isAvailable()) return removedCount;

      const keysToRemove = this.getAllKeys().filter(key => key.startsWith(prefix));
      
      for (const key of keysToRemove) {
        const result = this.removeItem(key, { logErrors: false });
        if (result.success) removedCount++;
      }
    } catch (error) {
      console.warn(`${this.LOG_PREFIX} Failed to remove items by prefix '${prefix}':`, error);
    }

    return removedCount;
  }
}

/**
 * Game-specific localStorage utilities
 */
export class GameStorageUtils {
  private static readonly GAME_PREFIX = 'snake_game_';
  
  /**
   * Game-specific storage keys
   */
  static readonly KEYS = {
    PLAYER_NAME: `${this.GAME_PREFIX}player_name`,
    PENDING_SCORES: `${this.GAME_PREFIX}pending_scores`,
    GAME_SETTINGS: `${this.GAME_PREFIX}settings`,
    HIGH_SCORES: `${this.GAME_PREFIX}high_scores`,
    GAME_STATISTICS: `${this.GAME_PREFIX}statistics`,
  } as const;

  /**
   * Save player name
   */
  static savePlayerName(name: string): boolean {
    const result = LocalStorageUtils.setItem(this.KEYS.PLAYER_NAME, name);
    return result.success;
  }

  /**
   * Get saved player name
   */
  static getPlayerName(): string {
    const result = LocalStorageUtils.getItem<string>(this.KEYS.PLAYER_NAME, {
      defaultValue: '',
    });
    return result.data || '';
  }

  /**
   * Save game settings
   */
  static saveGameSettings(settings: Record<string, any>): boolean {
    const result = LocalStorageUtils.setItem(this.KEYS.GAME_SETTINGS, settings);
    return result.success;
  }

  /**
   * Get game settings
   */
  static getGameSettings<T extends Record<string, any>>(defaultSettings: T): T {
    const result = LocalStorageUtils.getItem<T>(this.KEYS.GAME_SETTINGS, {
      defaultValue: defaultSettings,
    });
    return result.data || defaultSettings;
  }

  /**
   * Clear all game data
   */
  static clearAllGameData(): number {
    return LocalStorageUtils.removeItemsByPrefix(this.GAME_PREFIX);
  }

  /**
   * Get game storage usage info
   */
  static getGameStorageInfo(): { keys: string[]; totalSize: number } {
    const gameItems = LocalStorageUtils.getItemsByPrefix(this.GAME_PREFIX);
    const keys = Object.keys(gameItems);
    
    let totalSize = 0;
    for (const [key, value] of Object.entries(gameItems)) {
      totalSize += key.length + JSON.stringify(value).length;
    }

    return { keys, totalSize };
  }
}

export type { StorageResult, StorageOptions };