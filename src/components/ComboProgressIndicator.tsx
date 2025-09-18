/**
 * ComboProgressIndicator component for visualizing combo progress
 * Shows current progress through the 1→2→3→4→5 sequence with visual feedback
 */

'use client';

import React from 'react';
import type { ComboState } from '@/types/Combo';
import { COMBO_SEQUENCE } from '@/constants/ComboConfig';

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
 * Individual step indicator in the combo sequence
 */
interface ComboStepProps {
  number: 1 | 2 | 3 | 4 | 5;
  status: 'completed' | 'current' | 'pending';
  isActive: boolean;
}

const ComboStep: React.FC<ComboStepProps> = ({ number, status, isActive }) => {
  const getStepClassName = (): string => {
    const base = 'combo-step';
    const statusClass = `combo-step--${status}`;
    const activeClass = isActive ? 'combo-step--active' : '';
    
    return [base, statusClass, activeClass].filter(Boolean).join(' ');
  };

  const getStepStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      border: '2px solid transparent',
    };

    switch (status) {
      case 'completed':
        return {
          ...baseStyle,
          background: '#4caf50',
          color: 'white',
          transform: 'scale(1.1)',
          boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)',
        };
      case 'current':
        return {
          ...baseStyle,
          background: '#2196f3',
          color: 'white',
          border: '2px solid #64b5f6',
        };
      case 'pending':
        return {
          ...baseStyle,
          background: '#666',
          color: '#ccc',
          opacity: isActive ? 0.8 : 0.5,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div
      className={getStepClassName()}
      style={getStepStyle()}
      role="progressbar"
      aria-valuenow={status === 'completed' ? 100 : status === 'current' ? 50 : 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Step ${number}: ${status}`}
    >
      {number}
    </div>
  );
};

/**
 * Main ComboProgressIndicator component
 */
export const ComboProgressIndicator: React.FC<ComboProgressProps> = ({
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

  /**
   * Get container style based on active state
   */
  const getContainerStyle = (): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: isActive 
      ? 'rgba(33, 150, 243, 0.1)' 
      : 'rgba(0, 0, 0, 0.8)',
    border: isActive 
      ? '1px solid rgba(33, 150, 243, 0.3)' 
      : '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '12px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(4px)',
    minWidth: '280px',
  });

  /**
   * Get progress percentage for accessibility
   */
  const getProgressPercentage = (): number => {
    return Math.round((currentProgress / COMBO_SEQUENCE.length) * 100);
  };

  return (
    <div
      className={`combo-progress-indicator ${className}`}
      style={getContainerStyle()}
      role="group"
      aria-label="Combo progress indicator"
    >
      {/* Progress bar with steps */}
      <div 
        className="combo-steps"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        role="progressbar"
        aria-valuenow={getProgressPercentage()}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Combo progress: ${currentProgress} of ${COMBO_SEQUENCE.length} steps completed`}
      >
        {COMBO_SEQUENCE.map((number, index) => (
          <React.Fragment key={number}>
            <ComboStep
              number={number}
              status={getStepStatus(index)}
              isActive={isActive}
            />
            {/* Arrow connector between steps */}
            {index < COMBO_SEQUENCE.length - 1 && (
              <div
                className="combo-arrow"
                style={{
                  color: isActive && index < currentProgress ? '#4caf50' : '#666',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: 'color 0.3s ease',
                }}
                aria-hidden="true"
              >
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Status text */}
      <div
        className="combo-status"
        style={{
          marginLeft: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          minWidth: '80px',
        }}
      >
        {isActive ? (
          <>
            <div style={{ color: '#2196f3', fontWeight: 'bold' }}>
              Next: {expectedNext}
            </div>
            <div style={{ color: '#888', fontSize: '10px' }}>
              Progress: {currentProgress}/5
            </div>
          </>
        ) : (
          <>
            <div style={{ color: '#ccc' }}>
              Combos: {totalCombos}
            </div>
            <div style={{ color: '#888', fontSize: '10px' }}>
              Start with 1
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Hook to convert ComboState to ComboProgressProps
 */
export const useComboProgressProps = (comboState: ComboState): ComboProgressProps => {
  return {
    currentProgress: comboState.comboProgress,
    expectedNext: comboState.expectedNext,
    totalCombos: comboState.totalCombos,
    isActive: comboState.isComboActive,
  };
};

export default ComboProgressIndicator;