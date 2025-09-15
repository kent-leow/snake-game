'use client';

import React, { useState, useCallback } from 'react';
import type { Direction } from '@/lib/game/types';

interface TouchControlsProps {
  onDirectionChange: (direction: Direction) => void;
  disabled?: boolean;
  showDirectional?: boolean;
  className?: string;
}

/**
 * Touch controls component for mobile gameplay
 * Provides directional buttons with haptic feedback
 */
export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirectionChange,
  disabled = false,
  showDirectional = true,
  className = '',
}) => {
  const [activeDirection, setActiveDirection] = useState<Direction | null>(null);

  const handleDirectionPress = useCallback((direction: Direction) => {
    if (disabled) return;

    setActiveDirection(direction);
    onDirectionChange(direction);

    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [disabled, onDirectionChange]);

  const handleDirectionRelease = useCallback(() => {
    setActiveDirection(null);
  }, []);

  const getDirectionIcon = useCallback((direction: Direction): string => {
    switch (direction) {
      case 'UP':
        return '⬆️';
      case 'DOWN':
        return '⬇️';
      case 'LEFT':
        return '⬅️';
      case 'RIGHT':
        return '➡️';
    }
  }, []);

  if (!showDirectional) {
    return null;
  }

  return (
    <div className={`touch-controls ${className}`}>
      <div className="touch-controls__grid">
        {/* Top row */}
        <div className="touch-controls__spacer"></div>
        <button
          type="button"
          className={`touch-control touch-control--up ${
            activeDirection === 'UP' ? 'touch-control--active' : ''
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress('UP');
          }}
          onTouchEnd={handleDirectionRelease}
          onMouseDown={() => handleDirectionPress('UP')}
          onMouseUp={handleDirectionRelease}
          disabled={disabled}
          aria-label="Move up"
        >
          {getDirectionIcon('UP')}
        </button>
        <div className="touch-controls__spacer"></div>

        {/* Middle row */}
        <button
          type="button"
          className={`touch-control touch-control--left ${
            activeDirection === 'LEFT' ? 'touch-control--active' : ''
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress('LEFT');
          }}
          onTouchEnd={handleDirectionRelease}
          onMouseDown={() => handleDirectionPress('LEFT')}
          onMouseUp={handleDirectionRelease}
          disabled={disabled}
          aria-label="Move left"
        >
          {getDirectionIcon('LEFT')}
        </button>
        <div className="touch-controls__center"></div>
        <button
          type="button"
          className={`touch-control touch-control--right ${
            activeDirection === 'RIGHT' ? 'touch-control--active' : ''
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress('RIGHT');
          }}
          onTouchEnd={handleDirectionRelease}
          onMouseDown={() => handleDirectionPress('RIGHT')}
          onMouseUp={handleDirectionRelease}
          disabled={disabled}
          aria-label="Move right"
        >
          {getDirectionIcon('RIGHT')}
        </button>

        {/* Bottom row */}
        <div className="touch-controls__spacer"></div>
        <button
          type="button"
          className={`touch-control touch-control--down ${
            activeDirection === 'DOWN' ? 'touch-control--active' : ''
          }`}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDirectionPress('DOWN');
          }}
          onTouchEnd={handleDirectionRelease}
          onMouseDown={() => handleDirectionPress('DOWN')}
          onMouseUp={handleDirectionRelease}
          disabled={disabled}
          aria-label="Move down"
        >
          {getDirectionIcon('DOWN')}
        </button>
        <div className="touch-controls__spacer"></div>
      </div>
    </div>
  );
};

export default TouchControls;