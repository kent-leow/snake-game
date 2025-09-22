import { useState, useEffect, useCallback } from 'react';
import type { GameEngine } from '../lib/game/gameEngine';

/**
 * Combo data interface for UI consumption
 */
export interface ComboData {
  currentNumber: number;
  expectedNext: number;
  totalCombo: number;
  isActive: boolean;
  cumulativeCount: number;
}

/**
 * Hook to manage combo data from the game engine
 * Provides real-time combo information for UI components
 */
export function useComboData(gameEngine: GameEngine | null): ComboData {
  const [comboData, setComboData] = useState<ComboData>({
    currentNumber: 1,
    expectedNext: 1,
    totalCombo: 0,
    isActive: false,
    cumulativeCount: 0,
  });

  const updateComboData = useCallback((): void => {
    if (!gameEngine) return;

    try {
      const gameState = gameEngine.getGameState();
      const comboState = gameState.comboState;

      setComboData({
        currentNumber: comboState.expectedNext, // Show the next expected number
        expectedNext: comboState.expectedNext,
        totalCombo: comboState.cumulativeComboCount,
        isActive: comboState.isComboActive,
        cumulativeCount: comboState.cumulativeComboCount,
      });
    } catch (error) {
      console.warn('Failed to get combo data from game engine:', error);
    }
  }, [gameEngine]);

  // Update combo data when game engine changes
  useEffect(() => {
    updateComboData();
  }, [updateComboData]);

  // Set up real-time updates via game engine callback
  useEffect(() => {
    if (!gameEngine) return;

    const comboManager = gameEngine.getComboManager();
    
    // Subscribe to combo events for real-time updates
    const unsubscribe = comboManager.subscribe(() => {
      updateComboData();
    });

    return () => {
      unsubscribe();
    };
  }, [gameEngine, updateComboData]);

  return comboData;
}