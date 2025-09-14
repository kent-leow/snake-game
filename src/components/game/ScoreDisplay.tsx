'use client';

import React, { useEffect, useState } from 'react';

/**
 * Score display component properties
 */
export interface ScoreDisplayProps {
  score: number;
  className?: string;
  showAnimation?: boolean;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark' | 'game';
}

/**
 * Score display component with animated score changes
 * Provides real-time score updates with smooth animations and visual feedback
 */
export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  className = '',
  showAnimation = true,
  size = 'medium',
  theme = 'game',
}) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * Animate score changes with smooth transitions
   */
  useEffect(() => {
    if (score !== displayScore && showAnimation) {
      setIsAnimating(true);

      // Animation configuration
      const animationDuration = 300;
      const startTime = Date.now();
      const startScore = displayScore;
      const scoreDiff = score - startScore;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Easing function for smooth animation (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentScore = Math.round(startScore + (scoreDiff * easeOut));

        setDisplayScore(currentScore);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    } else if (!showAnimation) {
      setDisplayScore(score);
    }
  }, [score, displayScore, showAnimation]);

  /**
   * Get size classes based on size prop
   */
  const getSizeClasses = (): string => {
    switch (size) {
      case 'small':
        return 'text-lg';
      case 'large':
        return 'text-4xl md:text-5xl';
      case 'medium':
      default:
        return 'text-2xl md:text-3xl';
    }
  };

  /**
   * Get theme classes based on theme prop
   */
  const getThemeClasses = (): string => {
    switch (theme) {
      case 'light':
        return 'text-gray-800 bg-white border-gray-300';
      case 'dark':
        return 'text-white bg-gray-800 border-gray-600';
      case 'game':
      default:
        return 'text-green-400 bg-gray-900 border-green-500';
    }
  };

  /**
   * Format score for display
   */
  const formatScore = (value: number): string => {
    return value.toLocaleString();
  };

  return (
    <div 
      className={`
        score-display flex flex-col items-center justify-center
        p-4 border-2 rounded-lg font-mono font-bold
        transition-all duration-200
        ${getSizeClasses()}
        ${getThemeClasses()}
        ${isAnimating ? 'scale-105 glow-effect' : 'scale-100'}
        ${className}
      `}
    >
      <div className="score-label text-sm opacity-75 mb-1">
        SCORE
      </div>
      <div 
        className={`
          score-value tabular-nums
          ${isAnimating ? 'animate-pulse' : ''}
        `}
      >
        {formatScore(displayScore)}
      </div>
    </div>
  );
};

/**
 * Compact score display for in-game overlay
 */
export const CompactScoreDisplay: React.FC<{
  score: number;
  className?: string;
}> = ({ score, className = '' }) => {
  return (
    <div 
      className={`
        inline-flex items-center space-x-2 px-3 py-1
        bg-black bg-opacity-75 text-green-400 rounded
        font-mono text-lg font-bold
        ${className}
      `}
    >
      <span className="text-xs opacity-75">SCORE:</span>
      <span className="tabular-nums">{score.toLocaleString()}</span>
    </div>
  );
};

export default ScoreDisplay;