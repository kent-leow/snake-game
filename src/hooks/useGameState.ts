'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, GameConfig, Direction } from '@/lib/game/types';

interface UseGameStateReturn {
  gameState: GameState;
  gameConfig: GameConfig;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  updateScore: (points: number) => void;
  changeDirection: (direction: Direction) => void;
  updateConfig: (config: Partial<GameConfig>) => void;
}

const initialGameState: GameState = {
  isPlaying: false,
  isPaused: false,
  score: 0,
  gameOver: false,
  level: 1,
};

const initialGameConfig: GameConfig = {
  gridSize: 20,
  gameSpeed: 150, // milliseconds between moves
  enableSound: true,
};

export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [gameConfig, setGameConfig] = useState<GameConfig>(initialGameConfig);
  
  // Refs for stable references in useEffect
  const gameStateRef = useRef(gameState);
  const gameConfigRef = useRef(gameConfig);
  
  // Update refs when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  useEffect(() => {
    gameConfigRef.current = gameConfig;
  }, [gameConfig]);

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      gameOver: false,
    }));
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      gameOver: true,
    }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(initialGameState);
  }, []);

  const updateScore = useCallback((points: number) => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
      level: Math.floor((prev.score + points) / 100) + 1,
    }));
  }, []);

  const changeDirection = useCallback((direction: Direction) => {
    // Direction change logic will be implemented with the actual game logic
    // For now, this is a placeholder that could trigger game updates
    console.log('Direction changed to:', direction);
  }, []);

  const updateConfig = useCallback((config: Partial<GameConfig>) => {
    setGameConfig(prev => ({
      ...prev,
      ...config,
    }));
  }, []);

  return {
    gameState,
    gameConfig,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    resetGame,
    updateScore,
    changeDirection,
    updateConfig,
  };
}