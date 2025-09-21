'use client';

import React from 'react';
import { GameStateEnum } from '@/lib/game/gameState';

interface GameStateIndicatorProps {
  currentState: GameStateEnum;
  className?: string;
}

/**
 * Visual game state indicator component
 */
export const GameStateIndicator: React.FC<GameStateIndicatorProps> = React.memo(({
  currentState,
  className = '',
}) => {
  const getStateInfo = (state: GameStateEnum): { label: string; icon: string; color: string } => {
    switch (state) {
      case GameStateEnum.MENU:
        return {
          label: 'Ready to Play',
          icon: '🎮',
          color: 'blue'
        };
      case GameStateEnum.PLAYING:
        return {
          label: 'Game Active',
          icon: '🐍',
          color: 'green'
        };
      case GameStateEnum.PAUSED:
        return {
          label: 'Game Paused',
          icon: '⏸️',
          color: 'yellow'
        };
      case GameStateEnum.GAME_OVER:
        return {
          label: 'Game Over',
          icon: '💀',
          color: 'red'
        };
      case GameStateEnum.LOADING:
        return {
          label: 'Loading',
          icon: '⏳',
          color: 'gray'
        };
      default:
        return {
          label: 'Unknown',
          icon: '❓',
          color: 'gray'
        };
    }
  };

  const stateInfo = getStateInfo(currentState);

  return (
    <div className={`game-state-indicator game-state-indicator--${stateInfo.color} ${className}`}>
      <span className="game-state-indicator__icon">{stateInfo.icon}</span>
      <span className="game-state-indicator__label">{stateInfo.label}</span>
    </div>
  );
});

GameStateIndicator.displayName = 'GameStateIndicator';

export default GameStateIndicator;