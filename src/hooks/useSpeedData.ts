import { useState, useEffect, useCallback } from 'react';
import type { GameEngine } from '../lib/game/gameEngine';

/**
 * Interface for speed data from the game engine
 */
export interface SpeedData {
  speedLevel: number;
  currentSpeed: number;
  baseSpeed: number;
  isTransitioning: boolean;
  isAtMaxSpeed: boolean;
  speedProgress: number;
}

/**
 * Hook to manage speed data from the game engine
 * Provides real-time speed information for UI components
 */
export function useSpeedData(gameEngine: GameEngine | null): SpeedData {
  const [speedData, setSpeedData] = useState<SpeedData>({
    speedLevel: 0,
    currentSpeed: 150, // Default base speed
    baseSpeed: 150,
    isTransitioning: false,
    isAtMaxSpeed: false,
    speedProgress: 0,
  });

  const updateSpeedData = useCallback((): void => {
    if (!gameEngine) return;

    try {
      const speedManager = gameEngine.getSpeedManager();
      const speedState = speedManager.getSpeedState();
      const speedConfig = speedManager.getConfig();

      setSpeedData({
        speedLevel: speedState.speedLevel,
        currentSpeed: speedState.currentSpeed,
        baseSpeed: speedConfig.baseSpeed,
        isTransitioning: speedState.isTransitioning,
        isAtMaxSpeed: gameEngine.isAtMaxSpeed(),
        speedProgress: speedManager.getSpeedProgress(),
      });
    } catch (error) {
      console.warn('Failed to update speed data:', error);
    }
  }, [gameEngine]);

  useEffect(() => {
    if (!gameEngine) return;

    // Initial update
    updateSpeedData();

    try {
      // Subscribe to speed changes
      const speedManager = gameEngine.getSpeedManager();
      const unsubscribe = speedManager.onSpeedChange(() => {
        updateSpeedData();
      });

      // Update on game state changes (optional, for safety) - reduced frequency
      const interval = setInterval(updateSpeedData, 500); // Reduced from 100ms to 500ms

      return (): void => {
        unsubscribe();
        clearInterval(interval);
      };
    } catch (error) {
      console.warn('Failed to setup speed data subscriptions:', error);
      
      // Still set up interval as fallback - reduced frequency
      const interval = setInterval(updateSpeedData, 500);
      return (): void => {
        clearInterval(interval);
      };
    }
  }, [gameEngine, updateSpeedData]);

  return speedData;
}