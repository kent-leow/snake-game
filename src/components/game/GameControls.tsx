'use client';

import React from 'react';
import { GameStateEnum } from '@/lib/game/gameState';
import { ControlButton } from './ControlButton';
import { GameStateIndicator } from './GameStateIndicator';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface GameControlsProps {
  currentState: GameStateEnum;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onGoToMenu: () => void;
  className?: string;
  showKeyboardHints?: boolean;
}

/**
 * Main game controls component with buttons and keyboard shortcuts
 */
export const GameControls: React.FC<GameControlsProps> = ({
  currentState,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onRestartGame,
  onGoToMenu,
  className = '',
  showKeyboardHints = true
}) => {
  const isPlaying = currentState === GameStateEnum.PLAYING;
  const isPaused = currentState === GameStateEnum.PAUSED;
  const isMenu = currentState === GameStateEnum.MENU;

  // Keyboard shortcuts with proper typing
  const keyboardShortcutOptions = {
    enabled: true,
    ...(isPlaying && { onPause: onPauseGame }),
    ...(isPaused && { onResume: onResumeGame }),
    ...(!isMenu && { onRestart: onRestartGame }),
    ...(!isMenu && { onMenu: onGoToMenu }),
  };

  useKeyboardShortcuts(keyboardShortcutOptions);

  const getControlButtons = () => {
    switch (currentState) {
      case GameStateEnum.MENU:
        return (
          <ControlButton
            onClick={onStartGame}
            variant="primary"
            size="large"
            icon="🎮"
          >
            Start Game
          </ControlButton>
        );

      case GameStateEnum.PLAYING:
        return (
          <>
            <ControlButton
              onClick={onPauseGame}
              variant="secondary"
              icon="⏸️"
              shortcut="Space"
            >
              Pause
            </ControlButton>
            <ControlButton
              onClick={onRestartGame}
              variant="outline"
              icon="🔄"
              shortcut="R"
            >
              Restart
            </ControlButton>
            <ControlButton
              onClick={onGoToMenu}
              variant="outline"
              icon="🏠"
            >
              Menu
            </ControlButton>
          </>
        );

      case GameStateEnum.PAUSED:
        return (
          <>
            <ControlButton
              onClick={onResumeGame}
              variant="primary"
              icon="▶️"
              shortcut="Space"
            >
              Resume
            </ControlButton>
            <ControlButton
              onClick={onRestartGame}
              variant="secondary"
              icon="🔄"
              shortcut="R"
            >
              Restart
            </ControlButton>
            <ControlButton
              onClick={onGoToMenu}
              variant="outline"
              icon="🏠"
            >
              Menu
            </ControlButton>
          </>
        );

      case GameStateEnum.GAME_OVER:
        return (
          <>
            <ControlButton
              onClick={onRestartGame}
              variant="primary"
              size="large"
              icon="🔄"
            >
              Play Again
            </ControlButton>
            <ControlButton
              onClick={onGoToMenu}
              variant="secondary"
              icon="🏠"
            >
              Main Menu
            </ControlButton>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`game-controls ${className}`}>
      <GameStateIndicator currentState={currentState} />

      <div className="controls-buttons">
        {getControlButtons()}
      </div>

      {showKeyboardHints && !isMenu && (
        <KeyboardShortcuts currentState={currentState} />
      )}
    </div>
  );
};

export default GameControls;