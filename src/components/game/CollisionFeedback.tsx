'use client';

import React, { useState, useEffect } from 'react';
import type { Position } from '@/lib/game/types';

/**
 * CollisionFeedback component properties
 */
export interface CollisionFeedbackProps {
  position?: Position;
  type: 'boundary' | 'self' | null;
  onAnimationComplete: () => void;
}

/**
 * Visual collision feedback component
 * Provides visual indication when collision occurs at specific position
 */
export const CollisionFeedback: React.FC<CollisionFeedbackProps> = ({
  position,
  type,
  onAnimationComplete
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationComplete();
    }, 500); // Animation duration

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  if (!position || !isVisible) return null;

  return (
    <div
      className={`collision-feedback collision-${type}`}
      style={{
        left: position.x,
        top: position.y,
        position: 'absolute',
        pointerEvents: 'none'
      }}
    >
      <div className="collision-ripple" />
      <div className="collision-flash" />
    </div>
  );
};

export default CollisionFeedback;