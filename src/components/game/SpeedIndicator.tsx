'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/speed-indicator.module.css';

/**
 * Props interface for SpeedIndicator component
 */
export interface SpeedIndicatorProps {
  /** Current speed level (number of combos completed) */
  speedLevel: number;
  /** Current movement speed (ms between moves) */
  currentSpeed: number;
  /** Base/initial movement speed (ms between moves) */
  baseSpeed: number;
  /** Whether speed is currently transitioning */
  isTransitioning: boolean;
  /** Maximum speed level for progress calculation */
  maxLevel?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show detailed speed information */
  showDetails?: boolean;
}

/**
 * Hook for managing speed change animations and feedback
 */
const useSpeedAnimation = (speedLevel: number): { showChange: boolean; isIncreasing: boolean } => {
  const [previousLevel, setPreviousLevel] = useState(speedLevel);
  const [showChange, setShowChange] = useState(false);

  useEffect(() => {
    if (speedLevel !== previousLevel) {
      setShowChange(true);
      setPreviousLevel(speedLevel);

      const timer = setTimeout((): void => {
        setShowChange(false);
      }, 1000);

      return (): void => clearTimeout(timer);
    }
  }, [speedLevel, previousLevel]);

  return { 
    showChange, 
    isIncreasing: speedLevel > previousLevel 
  };
};

/**
 * SpeedIndicator component that displays current speed level with visual feedback
 * Shows speed progression and provides animation feedback when speed changes occur
 */
export const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({
  speedLevel,
  currentSpeed,
  baseSpeed,
  isTransitioning,
  maxLevel = 10,
  className = '',
  showDetails = true
}) => {
  const { showChange, isIncreasing } = useSpeedAnimation(speedLevel);
  
  // Calculate speed percentage for progress bar
  const speedPercentage = Math.min(
    ((baseSpeed - currentSpeed) / baseSpeed) * 100, 
    100
  );
  
  // Calculate speed multiplier for display
  const speedMultiplier = Math.round((baseSpeed / currentSpeed) * 100);

  return (
    <div 
      className={`${styles.speedIndicator} ${className}`}
      role="status"
      aria-label={`Speed level ${speedLevel}, ${speedMultiplier}% speed`}
    >
      {/* Speed Level Label */}
      <div className={styles.speedLabel}>
        <span className={styles.labelText}>Speed Level:</span>
        <span 
          className={`${styles.levelValue} ${showChange ? styles.changing : ''} ${isIncreasing ? styles.increasing : styles.decreasing}`}
        >
          {speedLevel}
        </span>
        {speedLevel >= maxLevel && (
          <span className={styles.maxIndicator} title="Maximum speed reached">
            ⚡
          </span>
        )}
      </div>

      {/* Speed Progress Bar */}
      <div className={styles.speedBar} role="progressbar" aria-valuenow={speedPercentage} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`${styles.speedFill} ${isTransitioning ? styles.transitioning : ''}`}
          style={{ width: `${Math.min(speedPercentage, 100)}%` }}
        />
        {/* Level markers for visual reference */}
        {maxLevel > 1 && (
          <div className={styles.levelMarkers}>
            {Array.from({ length: maxLevel - 1 }, (_, i) => (
              <div
                key={i}
                className={styles.levelMarker}
                style={{ left: `${((i + 1) / maxLevel) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Speed Details */}
      {showDetails && (
        <div className={styles.speedDetails}>
          <div className={styles.speedValue}>
            {speedMultiplier}% speed
          </div>
          {isTransitioning && (
            <div className={styles.transitionIndicator} aria-live="polite">
              Adjusting...
            </div>
          )}
        </div>
      )}

      {/* Change Animation Overlay */}
      {showChange && (
        <div 
          className={`${styles.changeOverlay} ${isIncreasing ? styles.increaseOverlay : styles.decreaseOverlay}`}
          aria-hidden="true"
        >
          {isIncreasing ? '+1' : 'RESET'}
        </div>
      )}
    </div>
  );
};

export default SpeedIndicator;