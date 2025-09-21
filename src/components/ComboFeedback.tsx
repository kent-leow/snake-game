/**
 * ComboFeedback component for displaying combo events and animations
 * Provides visual feedback for combo starts, progress, completions, and breaks
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { ComboEvent } from '../types/Combo';

export interface ComboFeedbackProps {
  /** Current combo event to display */
  event: ComboEvent | null;
  /** Callback when animation completes */
  onAnimationComplete: () => void;
  /** Optional className for custom styling */
  className?: string;
  /** Whether to enable debug mode */
  debug?: boolean;
}

/**
 * Animation configuration for different event types
 */
const ANIMATION_CONFIG = {
  started: {
    duration: 1500,
    text: 'Combo Started!',
    color: '#2196f3',
    scale: 1.2,
    glow: 'rgba(33, 150, 243, 0.5)',
  },
  progress: {
    duration: 1000,
    text: 'Good!',
    color: '#4caf50',
    scale: 1.1,
    glow: 'rgba(76, 175, 80, 0.4)',
  },
  completed: {
    duration: 2500,
    text: 'COMBO COMPLETE!',
    color: '#ffd700',
    scale: 1.5,
    glow: 'rgba(255, 215, 0, 0.6)',
  },
  broken: {
    duration: 1200,
    text: 'Combo Broken',
    color: '#f44336',
    scale: 1.0,
    glow: 'rgba(244, 67, 54, 0.4)',
  },
} as const;

/**
 * Floating text animation component
 */
interface FloatingTextProps {
  text: string;
  color: string;
  scale: number;
  duration: number;
  glow: string;
  onComplete: () => void;
}

const FloatingText: React.FC<FloatingTextProps> = ({
  text,
  color,
  scale,
  duration,
  glow,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const enterDuration = duration * 0.2;
    const holdDuration = duration * 0.6;

    const enterTimer = setTimeout(() => {
      setPhase('hold');
    }, enterDuration);

    const holdTimer = setTimeout(() => {
      setPhase('exit');
    }, enterDuration + holdDuration);

    const exitTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [duration, onComplete]);

  const getAnimationStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: `${16 * scale}px`,
      fontWeight: 'bold',
      color,
      textShadow: `0 0 10px ${glow}`,
      pointerEvents: 'none',
      userSelect: 'none',
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
      zIndex: 1000,
    };

    switch (phase) {
      case 'enter':
        return {
          ...baseStyle,
          opacity: 0,
          transform: `translate(-50%, -50%) scale(0.5) translateY(20px)`,
          transition: `all ${duration * 0.2}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
        };
      case 'hold':
        return {
          ...baseStyle,
          opacity: 1,
          transform: `translate(-50%, -50%) scale(${scale}) translateY(0)`,
          transition: `all ${duration * 0.2}ms ease-out`,
        };
      case 'exit':
        return {
          ...baseStyle,
          opacity: 0,
          transform: `translate(-50%, -50%) scale(${scale * 0.8}) translateY(-20px)`,
          transition: `all ${duration * 0.2}ms ease-in`,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div
      className="floating-text"
      style={getAnimationStyle()}
      aria-label={text}
      aria-live="polite"
    >
      {text}
    </div>
  );
};

/**
 * Points animation component for showing score increases
 */
interface PointsAnimationProps {
  points: number;
  onComplete: () => void;
}

const PointsAnimation: React.FC<PointsAnimationProps> = ({ points, onComplete }) => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (points <= 0) {
      // No animation for zero points, complete immediately
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(onComplete, 300);
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete, points]);

  const getAnimationStyle = (): React.CSSProperties => ({
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%) translateY(-30px)',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffd700',
    textShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily: 'monospace',
    opacity,
    transition: 'all 1100ms ease-out',
    zIndex: 999,
  });

  if (points <= 0) {
    return null;
  }

  return (
    <div
      className="points-animation"
      style={getAnimationStyle()}
      aria-label={`Plus ${points} points`}
      aria-live="polite"
    >
      +{points}
    </div>
  );
};

/**
 * Sequence visualization component
 */
interface SequenceVisualizationProps {
  sequence: number[];
  eventType: ComboEvent['type'];
  onComplete: () => void;
}

const SequenceVisualization: React.FC<SequenceVisualizationProps> = ({
  sequence,
  eventType,
  onComplete,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (sequence.length === 0) {
      onComplete();
      return;
    }

    // Animate sequence appearance
    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev >= sequence.length) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [sequence, onComplete]);

  const getSequenceStyle = (): React.CSSProperties => ({
    position: 'absolute',
    top: '70%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily: 'monospace',
    fontSize: '16px',
    zIndex: 998,
  });

  const getNumberStyle = (index: number): React.CSSProperties => {
    const isVisible = index < visibleCount;
    const color = eventType === 'completed' ? '#4caf50' : 
                  eventType === 'broken' ? '#f44336' : '#2196f3';

    return {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: color,
      color: 'white',
      fontWeight: 'bold',
      opacity: isVisible ? 1 : 0,
      transform: `scale(${isVisible ? 1 : 0.5})`,
      transition: 'all 300ms ease-out',
      boxShadow: isVisible ? `0 0 8px ${color}40` : 'none',
    };
  };

  if (sequence.length === 0) return null;

  return (
    <div
      className="sequence-visualization"
      style={getSequenceStyle()}
      role="presentation"
      aria-hidden="true"
    >
      {sequence.map((number, index) => (
        <React.Fragment key={index}>
          <div style={getNumberStyle(index)}>
            {number}
          </div>
          {index < sequence.length - 1 && (
            <div 
              style={{ 
                color: '#888', 
                opacity: index < visibleCount - 1 ? 1 : 0,
                transition: 'opacity 300ms ease-out',
              }}
            >
              →
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Main ComboFeedback component
 */
export const ComboFeedback: React.FC<ComboFeedbackProps> = ({
  event,
  onAnimationComplete,
  className = '',
  debug = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ComboEvent | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'text' | 'points' | 'sequence' | 'complete'>('text');

  /**
   * Handle new event
   */
  useEffect(() => {
    if (event && !isAnimating) {
      setActiveEvent(event);
      setIsAnimating(true);
      setAnimationPhase('text');
    }
  }, [event, isAnimating]);

  /**
   * Handle animation phase transitions
   */
  const handlePhaseComplete = useCallback(() => {
    switch (animationPhase) {
      case 'text':
        // Skip points phase if no points
        if (activeEvent && activeEvent.totalPoints > 0) {
          setAnimationPhase('points');
        } else {
          setAnimationPhase('sequence');
        }
        break;
      case 'points':
        // Skip sequence phase if no sequence items
        if (activeEvent && activeEvent.sequence.length > 0) {
          setAnimationPhase('sequence');
        } else {
          setAnimationPhase('complete');
        }
        break;
      case 'sequence':
        setAnimationPhase('complete');
        break;
      case 'complete':
        setIsAnimating(false);
        setActiveEvent(null);
        setAnimationPhase('text');
        onAnimationComplete();
        break;
    }
  }, [animationPhase, activeEvent, onAnimationComplete]);

  /**
   * Get animation config for current event
   */
  const getAnimationConfig = (): typeof ANIMATION_CONFIG[keyof typeof ANIMATION_CONFIG] | null => {
    if (!activeEvent) return null;
    return ANIMATION_CONFIG[activeEvent.type];
  };

  /**
   * Get container style
   */
  const getContainerStyle = (): React.CSSProperties => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 1000,
    display: isAnimating ? 'block' : 'none',
  });

  const config = getAnimationConfig();

  return (
    <div
      className={`combo-feedback ${className}`}
      style={getContainerStyle()}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {debug && activeEvent && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 1001,
          }}
        >
          <div>Event: {activeEvent.type}</div>
          <div>Phase: {animationPhase}</div>
          <div>Points: {activeEvent.totalPoints}</div>
          <div>Progress: {activeEvent.progress}</div>
        </div>
      )}

      {/* Main text animation */}
      {isAnimating && activeEvent && config && animationPhase === 'text' && (
        <FloatingText
          text={config.text}
          color={config.color}
          scale={config.scale}
          duration={config.duration}
          glow={config.glow}
          onComplete={handlePhaseComplete}
        />
      )}

      {/* Points animation */}
      {isAnimating && activeEvent && activeEvent.totalPoints > 0 && animationPhase === 'points' && (
        <PointsAnimation
          points={activeEvent.totalPoints}
          onComplete={handlePhaseComplete}
        />
      )}

      {/* Sequence visualization */}
      {isAnimating && activeEvent && activeEvent.sequence.length > 0 && animationPhase === 'sequence' && (
        <SequenceVisualization
          sequence={activeEvent.sequence}
          eventType={activeEvent.type}
          onComplete={handlePhaseComplete}
        />
      )}
    </div>
  );
};

export default ComboFeedback;