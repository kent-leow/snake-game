'use client';

import { useCallback, useEffect, useState } from 'react';
import { useResponsiveLayout } from './useResponsiveLayout';
import type { Direction } from '../lib/game/types';

interface TouchControlsOptions {
  onDirectionChange: (direction: Direction) => void;
  swipeSensitivity?: number;
  enableHapticFeedback?: boolean;
  preventScrolling?: boolean;
}

/**
 * Hook for managing touch controls behavior and state
 * Provides touch input handling with validation and feedback
 */
export const useTouchControls = ({
  onDirectionChange,
  swipeSensitivity = 50,
  enableHapticFeedback = true,
  preventScrolling = true,
}: TouchControlsOptions) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastDirection, setLastDirection] = useState<Direction | null>(null);

  const { isMobile } = useResponsiveLayout();

  useEffect(() => {
    setIsEnabled(isMobile);
  }, [isMobile]);

  const handleDirectionChange = useCallback(
    (direction: Direction) => {
      // Prevent rapid direction changes
      if (lastDirection === direction) return;

      setLastDirection(direction);
      onDirectionChange(direction);

      // Haptic feedback
      if (enableHapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Reset direction tracking after a delay
      const timeoutId = setTimeout(() => setLastDirection(null), 200);
      return () => clearTimeout(timeoutId);
    },
    [lastDirection, onDirectionChange, enableHapticFeedback]
  );

  useEffect(() => {
    if (!preventScrolling || !isEnabled) return;

    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, [preventScrolling, isEnabled]);

  return {
    isEnabled,
    handleDirectionChange,
    swipeSensitivity,
  };
};

export default useTouchControls;