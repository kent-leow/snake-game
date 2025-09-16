'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import type { GameStatistics } from '@/lib/game/gameOverState';

/**
 * GameOverModal component properties
 */
export interface GameOverModalProps {
  isVisible: boolean;
  finalScore: number;
  cause: 'boundary' | 'self' | null;
  gameStats?: GameStatistics;
  onRestart: () => void;
  onMainMenu: () => void;
  className?: string;
}

/**
 * Game Over Modal component
 * Displays game over information, final score, and provides restart/menu navigation
 */
export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVisible,
  finalScore,
  cause,
  gameStats,
  onRestart,
  onMainMenu,
  className
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const getCauseMessage = (cause: 'boundary' | 'self' | null): string => {
    switch (cause) {
      case 'boundary':
        return 'You hit the wall!';
      case 'self':
        return 'You hit yourself!';
      default:
        return 'Game Over!';
    }
  };

  const handleRestart = (): void => {
    setIsAnimating(false);
    setTimeout(onRestart, 150); // Small delay for animation
  };

  const handleMainMenu = (): void => {
    setIsAnimating(false);
    setTimeout(onMainMenu, 150);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className={`game-over-overlay ${isAnimating ? 'animate-in' : ''}`}>
      <div className={`game-over-modal ${className || ''}`}>
        <div className="game-over-header">
          <h2 className="game-over-title">Game Over!</h2>
          <p className="game-over-cause">{getCauseMessage(cause)}</p>
        </div>

        <div className="game-over-score">
          <div className="final-score">
            <span className="score-label">Final Score</span>
            <span className="score-value">{finalScore.toLocaleString()}</span>
          </div>
        </div>

        {gameStats && (
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-label">Duration</span>
              <span className="stat-value">{formatDuration(gameStats.duration)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Food Eaten</span>
              <span className="stat-value">{gameStats.foodConsumed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max Length</span>
              <span className="stat-value">{gameStats.maxSnakeLength}</span>
            </div>
          </div>
        )}

        <div className="game-over-actions">
          <button
            className="btn btn-primary"
            onClick={handleRestart}
            autoFocus
          >
            Play Again
          </button>
          <Button
            variant="secondary"
            onClick={handleMainMenu}
          >
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;