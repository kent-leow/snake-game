'use client';

import React from 'react';
import SpeedIndicator from './SpeedIndicator';
import type { SpeedData } from '../../hooks/useSpeedData';

interface GameStatsCardProps {
  score: number;
  isGameReady: boolean;
  speedData: SpeedData;
  className?: string;
}

/**
 * Modern game statistics card with glass morphism design
 */
export const GameStatsCard: React.FC<GameStatsCardProps> = ({
  score,
  isGameReady,
  speedData,
  className = ''
}) => {
  return (
    <div className={`game-stats-card ${className}`}>
      {/* Header with gradient */}
      <div className="game-stats-card__header">
        <div className="game-stats-card__icon">📊</div>
        <h3 className="game-stats-card__title">Game Stats</h3>
      </div>

      {/* Score - Primary metric */}
      <div className="game-stats-card__score">
        <div className="game-stats-card__score-label">Score</div>
        <div className="game-stats-card__score-value">{score.toLocaleString()}</div>
        <div className="game-stats-card__score-status">
          {isGameReady ? '🎮 Ready to play' : '⏳ Loading...'}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="game-stats-card__metrics">
        {/* Speed Metric */}
        <div className="game-stats-metric">
          <div className="game-stats-metric__header">
            <span className="game-stats-metric__icon">⚡</span>
            <span className="game-stats-metric__label">Speed Level</span>
          </div>
          <div className="game-stats-metric__content">
            <SpeedIndicator
              speedLevel={speedData.speedLevel}
              currentSpeed={speedData.currentSpeed}
              baseSpeed={speedData.baseSpeed}
              isTransitioning={speedData.isTransitioning}
              maxLevel={10}
              showDetails={false}
              className="game-stats-speed-indicator"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default GameStatsCard;