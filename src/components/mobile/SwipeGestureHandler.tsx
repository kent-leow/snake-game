'use client';

import React, { useRef, useCallback } from 'react';
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
  const startTouchRef = useRef<{ x: number; y: number } | null>(null);
  const isTrackingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || e.touches.length !== 1) return;

    const touch = e.touches[0];
    startTouchRef.current = { x: touch.clientX, y: touch.clientY };
    isTrackingRef.current = true;
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTrackingRef.current || !startTouchRef.current || e.touches.length !== 1) return;

    // Prevent scrolling during swipe
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isTrackingRef.current || !startTouchRef.current || e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouchRef.current.x;
    const deltaY = touch.clientY - startTouchRef.current.y;

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

    startTouchRef.current = null;
    isTrackingRef.current = false;
  }, [sensitivity, onSwipe]);

  const handleTouchCancel = useCallback(() => {
    startTouchRef.current = null;
    isTrackingRef.current = false;
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

SwipeGestureHandler.displayName = 'SwipeGestureHandler';

export default SwipeGestureHandler;