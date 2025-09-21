/**
 * ComboProgressIndicator component for visualizing combo progress
 * Shows current progress through the 1→2→3→4→5 sequence with visual feedback
 */

'use client';

import React, { useMemo } from 'react';
import type { ComboState } from '../types/Combo';
import { COMBO_SEQUENCE } from '../constants/ComboConfig';

export interface ComboProgressProps {
  /** Current progress in the combo sequence (0-5) */
  currentProgress: 0 | 1 | 2 | 3 | 4 | 5;
  /** Next number expected in the sequence (1-5) */
  expectedNext: 1 | 2 | 3 | 4 | 5;
  /** Total combos completed this game */
  totalCombos: number;
  /** Whether combo sequence is currently active */
  isActive: boolean;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * Main ComboProgressIndicator component
 */
export const ComboProgressIndicator: React.FC<ComboProgressProps> = React.memo(({
  currentProgress,
  expectedNext,
  totalCombos,
  isActive,
  className = '',
}) => {
  /**
   * Determine the status of each step in the sequence
   */
  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' => {
    if (stepIndex < currentProgress) {
      return 'completed';
    } else if (stepIndex === currentProgress && isActive) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  return (
    <div
      className={`combo-progress-indicator ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '6px 8px',
        background: isActive 
          ? 'rgba(33, 150, 243, 0.15)' 
          : 'rgba(0, 0, 0, 0.6)',
        border: isActive 
          ? '1px solid rgba(33, 150, 243, 0.4)' 
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '10px',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(4px)',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
      role="group"
      aria-label="Combo progress indicator"
    >
      {/* Progress bar with steps */}
      <div 
        className="combo-steps"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          justifyContent: 'center',
        }}
        role="progressbar"
        aria-valuenow={Math.round((currentProgress / COMBO_SEQUENCE.length) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Combo progress: ${currentProgress} of ${COMBO_SEQUENCE.length} steps completed`}
      >
        {COMBO_SEQUENCE.map((number, index) => {
          const status = getStepStatus(index);
          return (
            <React.Fragment key={number}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '9px',
                  transition: 'all 0.3s ease',
                  border: '1px solid transparent',
                  background: status === 'completed'
                    ? '#4caf50'
                    : status === 'current'
                    ? '#2196f3'
                    : '#666',
                  color: status === 'completed' || status === 'current'
                    ? 'white'
                    : '#ccc',
                  transform: status === 'completed' ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: status === 'completed' 
                    ? '0 0 4px rgba(76, 175, 80, 0.6)'
                    : status === 'current'
                    ? '0 0 4px rgba(33, 150, 243, 0.6)'
                    : 'none',
                }}
                role="progressbar"
                aria-valuenow={status === 'completed' ? 100 : status === 'current' ? 50 : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Step ${number}: ${status}`}
              >
                {number}
              </div>
              {/* Arrow connector between steps */}
              {index < COMBO_SEQUENCE.length - 1 && (
                <div
                  style={{
                    color: isActive && index < currentProgress ? '#4caf50' : '#666',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    transition: 'color 0.3s ease',
                  }}
                  aria-hidden="true"
                >
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Vertical status text */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '9px',
          lineHeight: '1.2',
        }}
      >
        {isActive ? (
          <>
            <div style={{ color: '#2196f3', fontWeight: 'bold' }}>
              Next: {expectedNext}
            </div>
            <div style={{ color: '#888' }}>
              {currentProgress}/5
            </div>
          </>
        ) : (
          <>
            <div style={{ color: '#ccc' }}>
              {totalCombos} combos
            </div>
            <div style={{ color: '#888' }}>
              Start: 1
            </div>
          </>
        )}
      </div>
    </div>
  );
});

ComboProgressIndicator.displayName = 'ComboProgressIndicator';

/**
 * Hook to convert ComboState to ComboProgressProps
 */
export const useComboProgressProps = (comboState: ComboState): ComboProgressProps => {
  return useMemo(() => ({
    currentProgress: comboState.comboProgress,
    expectedNext: comboState.expectedNext,
    totalCombos: comboState.totalCombos,
    isActive: comboState.isComboActive,
  }), [comboState.comboProgress, comboState.expectedNext, comboState.totalCombos, comboState.isComboActive]);
};

export default ComboProgressIndicator;