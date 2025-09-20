'use client';

import React, { useState, useCallback } from 'react';
import type { Direction } from '@/lib/game/types';

interface SwipeGestureHandlerProps {
  onSwipe: (direction: Direction) => void;
  children: React.ReactNode;
  sensitivity?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Swipe gesture recognition component for mobile touch navigation
 * Detects swipe gestures and converts them to direction changes
 */
export const SwipeGestureHandler: React.FC<SwipeGestureHandlerProps> = React.memo(({
  onSwipe,
  children,
  sensitivity = 50,
  disabled = false,
  className = '',
}) => {
  const [startTouch, setStartTouch] = useState<{ x: number; y: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || e.touches.length !== 1) return;

    const touch = e.touches[0];
    setStartTouch({ x: touch.clientX, y: touch.clientY });
    setIsTracking(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTracking || !startTouch || e.touches.length !== 1) return;

    // Prevent scrolling during swipe
    e.preventDefault();
  }, [isTracking, startTouch]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isTracking || !startTouch || e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouch.x;
    const deltaY = touch.clientY - startTouch.y;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance >= sensitivity) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        onSwipe(deltaX > 0 ? 'RIGHT' : 'LEFT');
      } else {
        // Vertical swipe
        onSwipe(deltaY > 0 ? 'DOWN' : 'UP');
      }
    }

    setStartTouch(null);
    setIsTracking(false);
  }, [isTracking, startTouch, sensitivity, onSwipe]);

  const handleTouchCancel = useCallback(() => {
    setStartTouch(null);
    setIsTracking(false);
  }, []);

  return (
    <div
      className={`swipe-gesture-handler ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  );
});

export default SwipeGestureHandler;