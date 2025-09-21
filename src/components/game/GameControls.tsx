'use client';

import React from 'react';
import { GameStateEnum } from '../../lib/game/gameState';
import ControlButton from './ControlButton';
import KeyboardShortcuts from './KeyboardShortcuts';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface GameControlsProps {
  currentState: GameStateEnum;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onGoToMenu: () => void;
  className?: string;
  showKeyboardHints?: boolean;
  hideStartButton?: boolean; // New prop to hide start button in game page
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
  showKeyboardHints = true,
  hideStartButton = false // Default to false for backward compatibility
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

  const getControlButtons = (): React.JSX.Element | null => {
    switch (currentState) {
      case GameStateEnum.MENU:
        // Don't show Start Game button if hideStartButton is true (game page context)
        if (hideStartButton) {
          return null;
        }
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
              Pause Game
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
              shortcut="R"
            >
              Restart Game
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