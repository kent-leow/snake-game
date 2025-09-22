'use client';

import React from 'react';
import GameControls from './GameControls';
import GameStateIndicator from './GameStateIndicator';
import type { GameStateEnum } from '../../lib/game/gameState';

interface ControlsCardProps {
  currentState: GameStateEnum;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onGoToMenu: () => void;
  showKeyboardHints?: boolean;
  hideStartButton?: boolean;
  className?: string;
}

/**
 * Modern game controls card with sleek design
 */
export const ControlsCard: React.FC<ControlsCardProps> = ({
  currentState,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onRestartGame,
  onGoToMenu,
  showKeyboardHints = false,
  hideStartButton = true,
  className = ''
}) => {
  return (
    <div className={`controls-card ${className}`}>
      {/* Header with state indicator */}
      <div className="controls-card__header">
        <div className="controls-card__title-section">
          <div className="controls-card__icon">🎮</div>
          <h3 className="controls-card__title">Game Controls</h3>
        </div>
        <div className="controls-card__state">
          <GameStateIndicator currentState={currentState} />
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-card__content">
        <GameControls
          currentState={currentState}
          onStartGame={onStartGame}
          onPauseGame={onPauseGame}
          onResumeGame={onResumeGame}
          onRestartGame={onRestartGame}
          onGoToMenu={onGoToMenu}
          showKeyboardHints={showKeyboardHints}
          hideStartButton={hideStartButton}
          className="controls-card__game-controls"
        />
      </div>
    </div>
  );
};

export default ControlsCard;