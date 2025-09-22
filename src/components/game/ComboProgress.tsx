'use client';

import React from 'react';

/**
 * Props for ComboProgress component
 */
export interface ComboProgressProps {
  /** Current number in sequence (1, 2, 3, 4, 5, 6, 7, 8, etc.) */
  currentNumber: number;
  /** Next number expected in sequence */
  expectedNext: number;
  /** Total combo count (foods eaten consecutively) */
  totalCombo: number;
  /** Whether combo is currently active */
  isActive: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show compact version */
  compact?: boolean;
}

/**
 * ComboProgress component
 * Shows current combo progress with visual indicators
 */
export const ComboProgress: React.FC<ComboProgressProps> = ({
  currentNumber,
  expectedNext,
  totalCombo,
  isActive,
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <div className={`combo-progress-compact ${className}`}>
        <div className="combo-info">
          <span className="combo-label">Number:</span>
          <span className="combo-progress-text">{currentNumber}</span>
          <span className="combo-label">Combo:</span>
          <span className="combo-progress-text">{totalCombo}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`combo-progress ${isActive ? 'active' : 'inactive'} ${className}`}
      role="group"
      aria-label="Combo progress indicator"
    >
      {/* Combo Info */}
      <div className="combo-info">
        <div className="combo-main">
          <span className="combo-label">Current Number:</span>
          <span className="combo-progress-text">{currentNumber}</span>
          {isActive && (
            <span className="combo-next">Next: {expectedNext}</span>
          )}
        </div>
        <div className="combo-total">
          <span className="combo-label">Combo Count:</span>
          <span className="combo-total-text">{totalCombo}</span>
        </div>
      </div>
    </div>
  );
};

export default ComboProgress;