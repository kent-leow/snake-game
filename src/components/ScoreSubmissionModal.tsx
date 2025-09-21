'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useScoreSubmission } from '../hooks/useScoreSubmission';
import { GameStorageUtils } from '../utils/localStorage';
import Button from './ui/Button';
import type { ScoreSubmissionData, ScoreSubmissionResult } from '../services/ScoreService';

/**
 * Props for the ScoreSubmissionModal component
 */
interface ScoreSubmissionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Score data to submit (without player name) */
  scoreData: Omit<ScoreSubmissionData, 'playerName'>;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when score is successfully submitted */
  onSubmitted: (result: ScoreSubmissionResult) => void;
  /** Whether to auto-submit if player name is already saved */
  autoSubmit?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Score Submission Modal Component
 * Handles score submission with player name entry and offline support
 */
export const ScoreSubmissionModal: React.FC<ScoreSubmissionModalProps> = ({
  isOpen,
  scoreData,
  onClose,
  onSubmitted,
  autoSubmit = true,
  className,
}) => {
  // Local state
  const [playerName, setPlayerName] = useState('');
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Score submission hook
  const {
    submitScore,
    isSubmitting,
    lastResult,
    pendingCount,
    isOnline,
    error: submissionError,
  } = useScoreSubmission({
    onSuccess: (result) => {
      setShowSuccess(true);
      onSubmitted(result);
      
      // Auto-close after success if it was an automatic submission
      if (hasAutoSubmitted) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    },
    onError: (error) => {
      console.error('Score submission failed:', error);
    },
  });

  /**
   * Validate player name input
   */
  const validatePlayerName = useCallback((name: string): string | null => {
    if (name.length > 20) {
      return 'Player name must be 20 characters or less';
    }
    if (name.trim().length === 0) {
      return null; // Empty is allowed (will use 'Anonymous')
    }
    // Check for invalid characters (basic validation)
    if (!/^[a-zA-Z0-9\s\-_.]+$/.test(name)) {
      return 'Player name contains invalid characters';
    }
    return null;
  }, []);

  /**
   * Handle player name changes with validation
   */
  const handleNameChange = useCallback((value: string) => {
    setPlayerName(value);
    const error = validatePlayerName(value);
    setValidationError(error);
  }, [validatePlayerName]);

  /**
   * Submit score with player name
   */
  const handleSubmit = useCallback(async (name?: string) => {
    const finalName = (name || playerName || 'Anonymous').trim();
    
    // Validate final name
    const validationError = validatePlayerName(finalName);
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    // Save player name for future use (if not anonymous)
    if (finalName !== 'Anonymous' && finalName.length > 0) {
      GameStorageUtils.savePlayerName(finalName);
    }

    await submitScore({
      ...scoreData,
      playerName: finalName,
    });
  }, [playerName, scoreData, submitScore, validatePlayerName]);

  /**
   * Handle form submission
   */
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitting && !validationError) {
      handleSubmit();
    }
  }, [handleSubmit, isSubmitting, validationError]);

  /**
   * Load saved player name and handle auto-submission
   */
  useEffect(() => {
    if (isOpen && !hasAutoSubmitted) {
      const savedName = GameStorageUtils.getPlayerName();
      setPlayerName(savedName);
      
      // Auto-submit if we have a saved name and auto-submit is enabled
      if (autoSubmit && savedName && savedName.trim().length > 0) {
        setHasAutoSubmitted(true);
        handleSubmit(savedName);
      }
    }
  }, [isOpen, hasAutoSubmitted, autoSubmit, handleSubmit]);

  /**
   * Reset state when modal closes
   */
  useEffect(() => {
    if (!isOpen) {
      setHasAutoSubmitted(false);
      setShowSuccess(false);
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className || ''}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold text-center">Game Over!</h2>
          <div className="text-center mt-2">
            <span className="text-3xl font-bold">{scoreData.score.toLocaleString()}</span>
            <span className="text-sm ml-2">points</span>
          </div>
        </div>

        {/* Game Statistics */}
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-600">Combos</div>
              <div className="text-lg font-bold text-blue-600">
                {scoreData.gameMetrics.totalCombos}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">Max Speed</div>
              <div className="text-lg font-bold text-purple-600">
                Level {scoreData.gameMetrics.maxSpeedLevel}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">Food Eaten</div>
              <div className="text-lg font-bold text-green-600">
                {scoreData.gameMetrics.totalFood}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">Final Length</div>
              <div className="text-lg font-bold text-orange-600">
                {scoreData.gameMetrics.finalSnakeLength}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success message */}
          {showSuccess && lastResult && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 border border-green-200">
              <div className="flex items-center text-green-800">
                <span className="text-sm font-medium">
                  {lastResult.saved === 'online' ? 
                    '✅ Score saved successfully!' :
                    '💾 Score saved offline - will sync when online'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Offline notification */}
          {!isOnline && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-100 border border-yellow-200">
              <div className="flex items-center text-yellow-800">
                <span className="text-sm">
                  📶 You&apos;re offline. Score will be saved locally and synced later.
                </span>
              </div>
            </div>
          )}

          {/* Pending scores notification */}
          {pendingCount > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-blue-100 border border-blue-200">
              <div className="flex items-center text-blue-800">
                <span className="text-sm">
                  📥 {pendingCount} score{pendingCount !== 1 ? 's' : ''} pending sync
                </span>
              </div>
            </div>
          )}

          {/* Submission error */}
          {submissionError && !showSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-200">
              <div className="flex items-center text-red-800">
                <span className="text-sm">❌ {submissionError}</span>
              </div>
            </div>
          )}

          {/* Player name form */}
          {!hasAutoSubmitted && !showSuccess && (
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Player Name (optional)
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  maxLength={20}
                  placeholder="Enter your name or leave empty for Anonymous"
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationError ? 'border-red-300' : 'border-gray-300'
                  } ${isSubmitting ? 'bg-gray-100' : 'bg-white'}`}
                />
                {validationError && (
                  <p className="mt-1 text-sm text-red-600">{validationError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  onClick={() => {}} // Form submission handled by onSubmit
                  disabled={isSubmitting || !!validationError}
                  className="flex-1"
                  variant="primary"
                >
                  {isSubmitting ? 'Saving...' : 'Save Score'}
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  variant="secondary"
                >
                  Skip
                </Button>
              </div>
            </form>
          )}

          {/* Auto-submit status */}
          {hasAutoSubmitted && !showSuccess && (
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-800">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                Saving score for {playerName || 'Anonymous'}...
              </div>
            </div>
          )}

          {/* Success actions */}
          {showSuccess && (
            <div className="flex gap-3 mt-4">
              <Button
                onClick={onClose}
                className="flex-1"
                variant="primary"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreSubmissionModal;