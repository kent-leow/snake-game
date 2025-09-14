'use client';

import React, { useEffect, useState } from 'react';
import type { ScoreAnimation } from '@/hooks/useScore';

/**
 * Score animation component properties
 */
export interface ScoreAnimationProps {
  animation: ScoreAnimation;
  position?: { x: number; y: number };
  className?: string;
  onComplete?: () => void;
}

/**
 * Floating score animation component
 * Shows animated score increases with visual effects
 */
export const FloatingScoreAnimation: React.FC<ScoreAnimationProps> = ({
  animation,
  position = { x: 50, y: 50 },
  className = '',
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'appear' | 'float' | 'fade'>('appear');

  useEffect(() => {
    const phases = [
      { phase: 'appear', duration: 100 },
      { phase: 'float', duration: 1000 },
      { phase: 'fade', duration: 500 },
    ] as const;

    let currentTimeout: NodeJS.Timeout;
    let phaseIndex = 0;

    const nextPhase = () => {
      if (phaseIndex < phases.length) {
        const { phase, duration } = phases[phaseIndex];
        setAnimationPhase(phase);
        
        currentTimeout = setTimeout(() => {
          phaseIndex++;
          if (phaseIndex < phases.length) {
            nextPhase();
          } else {
            setIsVisible(false);
            onComplete?.();
          }
        }, duration);
      }
    };

    nextPhase();

    return () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, [onComplete]);

  if (!isVisible) return null;

  /**
   * Get animation classes based on current phase
   */
  const getAnimationClasses = (): string => {
    const baseClasses = 'transition-all duration-300 ease-out';
    
    switch (animationPhase) {
      case 'appear':
        return `${baseClasses} scale-150 opacity-100`;
      case 'float':
        return `${baseClasses} scale-100 opacity-90 transform -translate-y-8`;
      case 'fade':
        return `${baseClasses} scale-75 opacity-0 transform -translate-y-12`;
      default:
        return baseClasses;
    }
  };

  /**
   * Get score type styling
   */
  const getTypeClasses = (): string => {
    switch (animation.type) {
      case 'food':
        return 'text-green-400';
      case 'combo':
        return 'text-yellow-400';
      case 'bonus':
        return 'text-purple-400';
      default:
        return 'text-white';
    }
  };

  /**
   * Format points for display
   */
  const formatPoints = (): string => {
    const prefix = animation.points > 0 ? '+' : '';
    return `${prefix}${animation.points}`;
  };

  return (
    <div
      className={`
        floating-score-animation absolute pointer-events-none
        font-bold text-xl font-mono z-50
        ${getAnimationClasses()}
        ${getTypeClasses()}
        ${className}
      `}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="flex items-center space-x-1">
        <span>{formatPoints()}</span>
        {animation.type === 'combo' && (
          <span className="text-sm opacity-75">COMBO!</span>
        )}
        {animation.type === 'bonus' && (
          <span className="text-sm opacity-75">BONUS!</span>
        )}
      </div>
    </div>
  );
};

/**
 * Score animation manager component
 * Manages multiple floating score animations
 */
export interface ScoreAnimationManagerProps {
  animations: ScoreAnimation[];
  onAnimationComplete?: (animationId: string) => void;
  className?: string;
}

export const ScoreAnimationManager: React.FC<ScoreAnimationManagerProps> = ({
  animations,
  onAnimationComplete,
  className = '',
}) => {
  const [activeAnimations, setActiveAnimations] = useState<ScoreAnimation[]>([]);

  useEffect(() => {
    setActiveAnimations(animations);
  }, [animations]);

  const handleAnimationComplete = (animation: ScoreAnimation) => {
    setActiveAnimations(prev => prev.filter(anim => anim.id !== animation.id));
    onAnimationComplete?.(animation.id);
  };

  return (
    <div className={`score-animation-manager relative ${className}`}>
      {activeAnimations.map((animation, index) => (
        <FloatingScoreAnimation
          key={animation.id}
          animation={animation}
          position={{
            x: 50 + (index % 3 - 1) * 15, // Spread horizontally
            y: 50 + Math.floor(index / 3) * 10, // Stack vertically
          }}
          onComplete={() => handleAnimationComplete(animation)}
        />
      ))}
    </div>
  );
};

/**
 * Combo display component
 * Shows current combo count with pulsing animation
 */
export interface ComboDisplayProps {
  comboCount: number;
  showThreshold?: number;
  className?: string;
}

export const ComboDisplay: React.FC<ComboDisplayProps> = ({
  comboCount,
  showThreshold = 2,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const shouldShow = comboCount >= showThreshold;
    setIsVisible(shouldShow);

    if (shouldShow) {
      setIsPulsing(true);
      const timeout = setTimeout(() => setIsPulsing(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [comboCount, showThreshold]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        combo-display inline-flex items-center space-x-2
        px-3 py-1 bg-yellow-500 bg-opacity-90 text-black rounded-full
        font-bold text-sm transition-all duration-200
        ${isPulsing ? 'scale-110 animate-pulse' : 'scale-100'}
        ${className}
      `}
    >
      <span>🔥</span>
      <span>{comboCount}x COMBO</span>
    </div>
  );
};

/**
 * Score feedback component that combines display and animations
 */
export interface ScoreFeedbackProps {
  score: number;
  animations: ScoreAnimation[];
  comboCount?: number;
  className?: string;
  compact?: boolean;
}

export const ScoreFeedback: React.FC<ScoreFeedbackProps> = ({
  score,
  animations,
  comboCount = 0,
  className = '',
  compact = false,
}) => {
  return (
    <div className={`score-feedback relative ${className}`}>
      {/* Score Display */}
      <div className="score-container">
        {compact ? (
          <div className="text-lg font-mono font-bold text-green-400">
            {score.toLocaleString()}
          </div>
        ) : (
          <div className="text-2xl font-mono font-bold text-green-400">
            SCORE: {score.toLocaleString()}
          </div>
        )}
      </div>

      {/* Combo Display */}
      {comboCount > 1 && (
        <div className="mt-2">
          <ComboDisplay comboCount={comboCount} />
        </div>
      )}

      {/* Floating Animations */}
      <ScoreAnimationManager animations={animations} />
    </div>
  );
};

export default FloatingScoreAnimation;