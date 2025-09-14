'use client';

import { useEffect, useCallback } from 'react';
import type { Direction } from '@/lib/game/types';

/**
 * Configuration options for keyboard input handling
 */
interface KeyboardInputOptions {
  onDirectionChange: (direction: Direction) => void;
  enabled: boolean;
  preventDefaultKeys?: boolean;
}

/**
 * Keyboard input hook for handling arrow keys and WASD controls
 * Provides responsive snake movement controls with input validation
 */
export const useKeyboardInput = ({
  onDirectionChange,
  enabled,
  preventDefaultKeys = true,
}: KeyboardInputOptions): {
  isValidGameKey: (key: string) => boolean;
  getDirectionFromKey: (key: string) => Direction | null;
} => {
  /**
   * Handle keyboard input events
   */
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const validKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'w',
        'W',
        'a',
        'A',
        's',
        'S',
        'd',
        'D',
      ];

      // Prevent default browser behavior for game keys
      if (preventDefaultKeys && validKeys.includes(event.key)) {
        event.preventDefault();
      }

      // Map key presses to directions
      switch (event.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          onDirectionChange('UP');
          break;
        case 'arrowdown':
        case 's':
          onDirectionChange('DOWN');
          break;
        case 'arrowleft':
        case 'a':
          onDirectionChange('LEFT');
          break;
        case 'arrowright':
        case 'd':
          onDirectionChange('RIGHT');
          break;
        default:
          // Ignore other keys
          break;
      }
    },
    [onDirectionChange, enabled, preventDefaultKeys]
  );

  /**
   * Set up and clean up keyboard event listeners
   */
  useEffect(() => {
    if (!enabled) return;

    // Use keydown for more responsive input
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, enabled]);

  // Return utility functions for external control
  return {
    /**
     * Check if a key corresponds to a valid game input
     */
    isValidGameKey: useCallback((key: string): boolean => {
      const validKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'w',
        'W',
        'a',
        'A',
        's',
        'S',
        'd',
        'D',
      ];
      return validKeys.includes(key);
    }, []),

    /**
     * Get direction from key input
     */
    getDirectionFromKey: useCallback((key: string): Direction | null => {
      switch (key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          return 'UP';
        case 'arrowdown':
        case 's':
          return 'DOWN';
        case 'arrowleft':
        case 'a':
          return 'LEFT';
        case 'arrowright':
        case 'd':
          return 'RIGHT';
        default:
          return null;
      }
    }, []),
  };
};

export default useKeyboardInput;