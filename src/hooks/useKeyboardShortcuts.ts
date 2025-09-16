'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onPause?: () => void;
  onResume?: () => void;
  onRestart?: () => void;
  onMenu?: () => void;
  enabled: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 */
export const useKeyboardShortcuts = ({
  onPause,
  onResume,
  onRestart,
  onMenu,
  enabled,
}: KeyboardShortcutsOptions): void => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent): void => {
      // Prevent shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ': // Spacebar
          event.preventDefault();
          if (onPause) {
            onPause();
          } else if (onResume) {
            onResume();
          }
          break;

        case 'r':
          if (event.ctrlKey || event.metaKey) return; // Don't interfere with browser refresh
          event.preventDefault();
          onRestart?.();
          break;

        case 'escape':
          event.preventDefault();
          onMenu?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return (): void => window.removeEventListener('keydown', handleKeyPress);
  }, [onPause, onResume, onRestart, onMenu, enabled]);
};

export default useKeyboardShortcuts;