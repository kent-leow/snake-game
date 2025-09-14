'use client';

import { useEffect } from 'react';

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  disabled?: boolean;
}

/**
 * Custom hook for keyboard navigation
 * Handles common keyboard interactions for navigation components
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions): void {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowKeys,
    disabled = false,
  } = options;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case ' ': // Space key
          if (onSpace) {
            event.preventDefault();
            onSpace();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'ArrowUp':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('up');
          }
          break;
        case 'ArrowDown':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('down');
          }
          break;
        case 'ArrowLeft':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('left');
          }
          break;
        case 'ArrowRight':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('right');
          }
          break;
        default:
          // No action for other keys
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return (): void => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEnter, onSpace, onEscape, onArrowKeys, disabled]);
}

export default useKeyboardNavigation;