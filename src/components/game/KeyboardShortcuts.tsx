'use client';

import React from 'react';
import { GameStateEnum } from '../../lib/game/gameState';

interface KeyboardShortcutsProps {
  currentState: GameStateEnum;
  className?: string;
}

/**
 * Component to display keyboard shortcuts to user
 */
export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  currentState,
  className = '',
}) => {
  const getShortcuts = (state: GameStateEnum): Array<{ key: string; action: string }> => {
    const shortcuts = [];

    if (state === GameStateEnum.PLAYING) {
      shortcuts.push({ key: 'Space', action: 'Pause' });
    } else if (state === GameStateEnum.PAUSED) {
      shortcuts.push({ key: 'Space', action: 'Resume' });
    }

    if (state !== GameStateEnum.MENU) {
      shortcuts.push({ key: 'R', action: 'Restart' });
      shortcuts.push({ key: 'Esc', action: 'Menu' });
    }

    return shortcuts;
  };

  const shortcuts = getShortcuts(currentState);

  if (shortcuts.length === 0) return null;

  return (
    <div className={`keyboard-shortcuts ${className}`}>
      <span className="keyboard-shortcuts__label">Shortcuts:</span>
      <div className="keyboard-shortcuts__list">
        {shortcuts.map(({ key, action }) => (
          <span key={key} className="keyboard-shortcut">
            <kbd className="keyboard-shortcut__key">{key}</kbd>
            <span className="keyboard-shortcut__action">{action}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default KeyboardShortcuts;