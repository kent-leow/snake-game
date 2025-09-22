'use client';

import React from 'react';

interface KeyboardInstruction {
  keys: string[];
  action: string;
  icon?: string;
}

interface HowToPlayCardProps {
  className?: string;
}

/**
 * Modern "How to Play" card with improved keyboard instruction design
 */
export const HowToPlayCard: React.FC<HowToPlayCardProps> = ({
  className = ''
}) => {
  const instructions: KeyboardInstruction[] = [
    {
      keys: ['↑', 'W'],
      action: 'Move Up',
      icon: '⬆️'
    },
    {
      keys: ['↓', 'S'],
      action: 'Move Down',
      icon: '⬇️'
    },
    {
      keys: ['←', 'A'],
      action: 'Move Left',
      icon: '⬅️'
    },
    {
      keys: ['→', 'D'],
      action: 'Move Right',
      icon: '➡️'
    },
    {
      keys: ['Space'],
      action: 'Pause Game',
      icon: '⏸️'
    },
    {
      keys: ['R'],
      action: 'Restart Game',
      icon: '🔄'
    }
  ];

  return (
    <div className={`how-to-play-card ${className}`}>
      {/* Header */}
      <div className="how-to-play-card__header">
        <div className="how-to-play-card__icon">📖</div>
        <h3 className="how-to-play-card__title">How to Play</h3>
      </div>

      {/* Instructions Grid */}
      <div className="how-to-play-card__content">
        <div className="how-to-play-instructions">
          {instructions.map((instruction, index) => (
            <div key={index} className="keyboard-instruction">
              <div className="keyboard-instruction__keys">
                {instruction.keys.map((key, keyIndex) => (
                  <kbd key={keyIndex} className="keyboard-key">
                    {key}
                  </kbd>
                ))}
              </div>
              <div className="keyboard-instruction__action">
                {instruction.icon && (
                  <span className="keyboard-instruction__icon">{instruction.icon}</span>
                )}
                <span className="keyboard-instruction__text">{instruction.action}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Game Tips */}
        <div className="how-to-play-tips">
          <div className="how-to-play-tips__header">
            <span className="how-to-play-tips__icon">💡</span>
            <span className="how-to-play-tips__title">Pro Tips</span>
          </div>
          <ul className="how-to-play-tips__list">
            <li>Eat food to grow and increase your score</li>
            <li>Avoid hitting walls or your own body</li>
            <li>Create combos for bonus points</li>
            <li>Speed increases as you progress</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HowToPlayCard;