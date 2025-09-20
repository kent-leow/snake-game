'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ScoreService, type ScoreSubmissionData, type ScoreSubmissionResult } from '@/services/ScoreService';

/**
 * Options for the useScoreSubmission hook
 */
interface UseScoreSubmissionOptions {
  /** Callback when score submission succeeds */
  onSuccess?: (result: ScoreSubmissionResult) => void;
  /** Callback when score submission fails */
  onError?: (error: string) => void;
  /** Whether to auto-sync pending scores on mount */
  autoSync?: boolean;
  /** Interval for periodic sync checks (ms) */
  syncInterval?: number;
}

/**
 * Return interface for useScoreSubmission hook
 */
interface UseScoreSubmissionReturn {
  /** Submit a new score */
  submitScore: (scoreData: ScoreSubmissionData) => Promise<ScoreSubmissionResult>;
  /** Manually trigger sync of pending scores */
  syncPendingScores: () => Promise<void>;
  /** Clear all pending scores */
  clearPendingScores: () => void;
  /** Whether a submission is currently in progress */
  isSubmitting: boolean;
  /** Result of the last submission attempt */
  lastResult: ScoreSubmissionResult | null;
  /** Number of scores pending offline sync */
  pendingCount: number;
  /** Whether the user is currently online */
  isOnline: boolean;
  /** Error message from last operation */
  error: string | null;
  /** Whether sync is currently in progress */
  isSyncing: boolean;
}

/**
 * Custom hook for managing score submission with offline support
 */
export const useScoreSubmission = (options: UseScoreSubmissionOptions = {}): UseScoreSubmissionReturn => {
  const {
    onSuccess,
    onError,
    autoSync = true,
    syncInterval = 30000, // 30 seconds
  } = options;

  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<ScoreSubmissionResult | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize with actual navigator.onLine value
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // fallback for SSR
  });
  const [error, setError] = useState<string | null>(null);

  // Service instance
  const scoreServiceRef = useRef<ScoreService>(new ScoreService());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update pending count from service
   */
  const updatePendingCount = useCallback(() => {
    const count = scoreServiceRef.current.getPendingScoreCount();
    setPendingCount(count);
  }, []);

  /**
   * Submit a score with error handling and state management
   */
  const submitScore = useCallback(
    async (scoreData: ScoreSubmissionData): Promise<ScoreSubmissionResult> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await scoreServiceRef.current.submitScore(scoreData);
        setLastResult(result);
        updatePendingCount();

        if (result.success) {
          onSuccess?.(result);
        } else {
          const errorMessage = result.error || 'Failed to submit score';
          setError(errorMessage);
          onError?.(errorMessage);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        onError?.(errorMessage);
        
        const failureResult: ScoreSubmissionResult = {
          success: false,
          saved: 'failed',
          error: errorMessage,
        };
        setLastResult(failureResult);
        return failureResult;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSuccess, onError, updatePendingCount]
  );

  /**
   * Sync pending scores with error handling
   */
  const syncPendingScores = useCallback(async (): Promise<void> => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    setError(null);

    try {
      await scoreServiceRef.current.syncPendingScores();
      updatePendingCount();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setError(errorMessage);
      console.warn('Score sync failed:', errorMessage);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, updatePendingCount]);

  /**
   * Clear all pending scores
   */
  const clearPendingScores = useCallback(() => {
    scoreServiceRef.current.clearPendingScores();
    updatePendingCount();
  }, [updatePendingCount]);

  /**
   * Handle online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        syncPendingScores().catch(console.warn);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for connectivity changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, syncPendingScores]);

  /**
   * Set up periodic sync
   */
  useEffect(() => {
    if (!autoSync || syncInterval <= 0) return;

    syncIntervalRef.current = setInterval(() => {
      if (isOnline && !isSyncing && pendingCount > 0) {
        syncPendingScores().catch(console.warn);
      }
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [autoSync, syncInterval, isOnline, isSyncing, pendingCount, syncPendingScores]);

  /**
   * Initialize pending count on mount and auto-sync if enabled
   */
  useEffect(() => {
    updatePendingCount();
    
    if (autoSync && isOnline) {
      syncPendingScores().catch(console.warn);
    }
  }, [autoSync, isOnline, updatePendingCount, syncPendingScores]);

  return {
    submitScore,
    syncPendingScores,
    clearPendingScores,
    isSubmitting,
    lastResult,
    pendingCount,
    isOnline,
    error,
    isSyncing,
  };
};

export default useScoreSubmission;