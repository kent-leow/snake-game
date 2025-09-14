'use client';

import { useCallback, useEffect } from 'react';
import type { Snake, EnhancedFood } from '@/lib/game/types';
import type { GameStateData, GameStateEnum } from '@/lib/game/gameState';

/**
 * Game persistence data structure for saving/loading game state
 */
export interface GamePersistenceData {
  snake: Snake;
  food: EnhancedFood | null;
  score: number;
  gameStartTime: number;
  pausedTime: number;
  totalPausedDuration: number;
  timestamp: number;
  version: string;
}

/**
 * Persistence configuration options
 */
export interface PersistenceConfig {
  storageKey: string;
  maxAge: number; // milliseconds
  autoSave: boolean;
  compress: boolean;
}

/**
 * Persistence operation result
 */
export interface PersistenceResult {
  success: boolean;
  error?: string;
  data?: GamePersistenceData;
}

/**
 * Hook options for game persistence
 */
export interface UseGamePersistenceOptions {
  config?: Partial<PersistenceConfig>;
  onSave?: (data: GamePersistenceData) => void;
  onLoad?: (data: GamePersistenceData) => void;
  onError?: (error: string) => void;
}

/**
 * Default persistence configuration
 */
const DEFAULT_CONFIG: PersistenceConfig = {
  storageKey: 'snake-game-state',
  maxAge: 60 * 60 * 1000, // 1 hour
  autoSave: true,
  compress: false,
};

/**
 * Current version for persistence data format
 */
const PERSISTENCE_VERSION = '1.0.0';

/**
 * Game persistence hook for saving and loading game state
 */
export const useGamePersistence = ({
  config: userConfig = {},
  onSave,
  onLoad,
  onError,
}: UseGamePersistenceOptions = {}) => {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  /**
   * Save game state to localStorage
   */
  const saveGameState = useCallback(
    (gameData: GameStateData): PersistenceResult => {
      try {
        const persistenceData: GamePersistenceData = {
          snake: gameData.snake,
          food: gameData.food,
          score: gameData.score,
          gameStartTime: gameData.gameStartTime,
          pausedTime: gameData.pausedTime,
          totalPausedDuration: gameData.totalPausedDuration,
          timestamp: Date.now(),
          version: PERSISTENCE_VERSION,
        };

        const dataString = JSON.stringify(persistenceData);
        
        // Basic compression if enabled (simple implementation)
        const finalData = config.compress ? compressData(dataString) : dataString;
        
        localStorage.setItem(config.storageKey, finalData);
        
        onSave?.(persistenceData);
        
        return {
          success: true,
          data: persistenceData,
        };
      } catch (error) {
        const errorMessage = `Failed to save game state: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        
        onError?.(errorMessage);
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [config.storageKey, config.compress, onSave, onError]
  );

  /**
   * Load game state from localStorage
   */
  const loadGameState = useCallback((): PersistenceResult => {
    try {
      const savedData = localStorage.getItem(config.storageKey);
      
      if (!savedData) {
        return {
          success: false,
          error: 'No saved game state found',
        };
      }

      // Decompress if needed
      const dataString = config.compress ? decompressData(savedData) : savedData;
      const data = JSON.parse(dataString) as GamePersistenceData;

      // Validate data format version
      if (!data.version || data.version !== PERSISTENCE_VERSION) {
        // Handle version mismatch - could implement migration logic here
        localStorage.removeItem(config.storageKey);
        return {
          success: false,
          error: 'Saved game state version mismatch',
        };
      }

      // Check if saved state is not too old
      if (Date.now() - data.timestamp > config.maxAge) {
        localStorage.removeItem(config.storageKey);
        return {
          success: false,
          error: 'Saved game state expired',
        };
      }

      // Validate required fields
      if (!validateGameData(data)) {
        localStorage.removeItem(config.storageKey);
        return {
          success: false,
          error: 'Invalid saved game state format',
        };
      }

      onLoad?.(data);

      return {
        success: true,
        data,
      };
    } catch (error) {
      const errorMessage = `Failed to load game state: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      // Clear corrupted data
      localStorage.removeItem(config.storageKey);
      onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [config.storageKey, config.maxAge, config.compress, onLoad, onError]);

  /**
   * Clear saved game state
   */
  const clearSavedState = useCallback((): PersistenceResult => {
    try {
      localStorage.removeItem(config.storageKey);
      return {
        success: true,
      };
    } catch (error) {
      const errorMessage = `Failed to clear saved game state: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [config.storageKey, onError]);

  /**
   * Check if saved game state exists
   */
  const hasSavedState = useCallback((): boolean => {
    try {
      const savedData = localStorage.getItem(config.storageKey);
      if (!savedData) return false;

      // Quick validation without full parsing
      const data = JSON.parse(savedData) as Partial<GamePersistenceData>;
      return !!(data.timestamp && Date.now() - data.timestamp <= config.maxAge);
    } catch {
      return false;
    }
  }, [config.storageKey, config.maxAge]);

  /**
   * Get saved game info without loading full state
   */
  const getSavedGameInfo = useCallback((): {
    exists: boolean;
    timestamp?: number;
    score?: number;
    duration?: number;
  } => {
    try {
      const savedData = localStorage.getItem(config.storageKey);
      if (!savedData) return { exists: false };

      const data = JSON.parse(savedData) as GamePersistenceData;
      const age = Date.now() - data.timestamp;
      
      if (age > config.maxAge) {
        return { exists: false };
      }

      const duration = data.gameStartTime > 0 
        ? Math.floor((data.timestamp - data.gameStartTime - data.totalPausedDuration) / 1000)
        : 0;

      return {
        exists: true,
        timestamp: data.timestamp,
        score: data.score,
        duration,
      };
    } catch {
      return { exists: false };
    }
  }, [config.storageKey, config.maxAge]);

  /**
   * Auto-save functionality when enabled
   */
  const autoSaveGameState = useCallback(
    (gameData: GameStateData, currentState: GameStateEnum) => {
      if (!config.autoSave) return;

      // Only auto-save during PAUSED state to preserve exact pause position
      if (currentState === 'paused') {
        saveGameState(gameData);
      }
    },
    [config.autoSave, saveGameState]
  );

  // Clean up expired saves on mount
  useEffect(() => {
    const cleanup = () => {
      try {
        const savedData = localStorage.getItem(config.storageKey);
        if (savedData) {
          const data = JSON.parse(savedData) as GamePersistenceData;
          if (Date.now() - data.timestamp > config.maxAge) {
            localStorage.removeItem(config.storageKey);
          }
        }
      } catch {
        // Clean up corrupted data
        localStorage.removeItem(config.storageKey);
      }
    };

    cleanup();
  }, [config.storageKey, config.maxAge]);

  return {
    saveGameState,
    loadGameState,
    clearSavedState,
    hasSavedState,
    getSavedGameInfo,
    autoSaveGameState,
    config,
  };
};

/**
 * Utility functions for data validation and compression
 */

/**
 * Validate game persistence data structure
 */
function validateGameData(data: any): data is GamePersistenceData {
  if (!data || typeof data !== 'object') return false;
  
  // Check required fields
  const requiredFields = [
    'snake',
    'score',
    'gameStartTime',
    'pausedTime',
    'totalPausedDuration',
    'timestamp',
    'version',
  ];
  
  for (const field of requiredFields) {
    if (!(field in data)) return false;
  }
  
  // Validate snake structure
  if (!data.snake || !Array.isArray(data.snake.segments) || data.snake.segments.length === 0) {
    return false;
  }
  
  // Validate numeric fields
  if (typeof data.score !== 'number' || data.score < 0) return false;
  if (typeof data.timestamp !== 'number' || data.timestamp <= 0) return false;
  
  return true;
}

/**
 * Simple compression using basic string compression
 * Note: This is a basic implementation, consider using a proper compression library for production
 */
function compressData(data: string): string {
  try {
    // Basic run-length encoding for repeated characters
    return data.replace(/(.)\1{2,}/g, (match, char) => {
      return `${char}*${match.length}`;
    });
  } catch {
    return data; // Return original if compression fails
  }
}

/**
 * Simple decompression for basic compressed data
 */
function decompressData(data: string): string {
  try {
    // Reverse the run-length encoding
    return data.replace(/(.)\*(\d+)/g, (_, char, count) => {
      return char.repeat(parseInt(count, 10));
    });
  } catch {
    return data; // Return original if decompression fails
  }
}

/**
 * Utility function to create a persistence hook with specific configuration
 */
export const createGamePersistence = (config: Partial<PersistenceConfig>) => {
  return (options: UseGamePersistenceOptions = {}) => {
    return useGamePersistence({
      ...options,
      config: { ...config, ...options.config },
    });
  };
};

/**
 * Pre-configured persistence hook for different use cases
 */
export const usePauseStatePersistence = createGamePersistence({
  storageKey: 'snake-game-pause-state',
  maxAge: 30 * 60 * 1000, // 30 minutes
  autoSave: true,
});

export const useCheckpointPersistence = createGamePersistence({
  storageKey: 'snake-game-checkpoint',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  autoSave: false,
});

export default useGamePersistence;