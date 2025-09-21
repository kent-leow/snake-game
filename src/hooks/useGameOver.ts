import { useState, useEffect, useRef, useCallback } from 'react';
import { GameOverManager, type GameOverState, type GameStatistics } from '../lib/game/gameOverState';
import type { Position } from '../lib/game/types';

/**
 * Options for useGameOver hook
 */
interface UseGameOverOptions {
  onGameOver?: (state: GameOverState) => void;
  onRestart?: () => void;
}

/**
 * Return type for useGameOver hook
 */
interface UseGameOverReturn {
  gameOverState: GameOverState;
  triggerGameOver: (
    cause: 'boundary' | 'self',
    finalScore: number,
    collisionPosition?: Position,
    gameStats?: GameStatistics
  ) => void;
  resetGameOver: () => void;
  isGameOver: boolean;
}

/**
 * React hook for managing game over state
 * Provides simplified interface for components to interact with game over functionality
 */
export const useGameOver = ({
  onGameOver,
  onRestart,
}: UseGameOverOptions = {}): UseGameOverReturn => {
  const [gameOverState, setGameOverState] = useState<GameOverState>({
    isGameOver: false,
    cause: null,
    finalScore: 0,
    timestamp: 0,
  });

  const gameOverManagerRef = useRef<GameOverManager>(new GameOverManager());

  useEffect(() => {
    const unsubscribe = gameOverManagerRef.current.subscribe(state => {
      setGameOverState(state);
      onGameOver?.(state);
    });

    return unsubscribe;
  }, [onGameOver]);

  const triggerGameOver = useCallback(
    (
      cause: 'boundary' | 'self',
      finalScore: number,
      collisionPosition?: Position,
      gameStats?: GameStatistics
    ) => {
      gameOverManagerRef.current.triggerGameOver(
        cause,
        finalScore,
        collisionPosition,
        gameStats
      );
    },
    []
  );

  const resetGameOver = useCallback(() => {
    gameOverManagerRef.current.resetGameOver();
    onRestart?.();
  }, [onRestart]);

  return {
    gameOverState,
    triggerGameOver,
    resetGameOver,
    isGameOver: gameOverState.isGameOver,
  };
};