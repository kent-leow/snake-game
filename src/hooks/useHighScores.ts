import { useState, useEffect, useCallback } from 'react';
import { IScore } from '../types/Database';

/**
 * Error types for score loading
 */
export type ScoreError = 'NETWORK_ERROR' | 'SERVER_ERROR' | 'NO_DATA' | 'TIMEOUT';

/**
 * Error messages mapping
 */
export const ERROR_MESSAGES: Record<ScoreError, string> = {
  NETWORK_ERROR: 'Unable to connect to server',
  SERVER_ERROR: 'Server error occurred',
  NO_DATA: 'No high scores available yet',
  TIMEOUT: 'Request timed out',
};

/**
 * API Response Type for scores
 */
export interface ScoreApiResponse {
  success: boolean;
  data: IScore[];
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Hook interface for high scores management
 */
export interface UseHighScoresReturn {
  scores: IScore[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Options for fetching high scores
 */
export interface UseHighScoresOptions {
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  autoFetch?: boolean;
  timeout?: number;
}

/**
 * Custom hook for managing high score data with error handling and loading states
 */
export function useHighScores(options: UseHighScoresOptions = {}): UseHighScoresReturn {
  const {
    limit = 10,
    sortBy = 'score',
    order = 'desc',
    autoFetch = true,
    timeout = 5000,
  } = options;

  const [scores, setScores] = useState<IScore[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch scores from the API with proper error handling
   */
  const fetchScores = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Create abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        sortBy,
        order,
      });

      // Make API request
      const response = await fetch(`/api/scores?${params}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(ERROR_MESSAGES.SERVER_ERROR);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || ERROR_MESSAGES.NETWORK_ERROR);
        }
      }

      // Parse response
      const data: ScoreApiResponse = await response.json();

      // Handle API errors
      if (!data.success) {
        throw new Error(data.error || data.message || ERROR_MESSAGES.SERVER_ERROR);
      }

      // Handle empty data
      if (!data.data || data.data.length === 0) {
        setScores([]);
        setError(ERROR_MESSAGES.NO_DATA);
      } else {
        setScores(data.data);
        setError(null);
      }
    } catch (fetchError) {
      // Handle different error types
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          setError(ERROR_MESSAGES.TIMEOUT);
        } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          setError(ERROR_MESSAGES.NETWORK_ERROR);
        } else {
          setError(fetchError.message);
        }
      } else {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      // Set empty scores on error
      setScores([]);
      
      // Log error for debugging
      console.error('Error fetching high scores:', fetchError);
    } finally {
      setLoading(false);
    }
  }, [limit, sortBy, order, timeout]);

  /**
   * Refetch scores with loading state management
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchScores();
  }, [fetchScores]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      void fetchScores();
    }
  }, [fetchScores, autoFetch]);

  return {
    scores,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for fetching player-specific scores
 */
export function usePlayerScores(playerName: string, options: UseHighScoresOptions = {}): UseHighScoresReturn {
  const {
    limit = 10,
    autoFetch = true,
    timeout = 5000,
  } = options;

  const [scores, setScores] = useState<IScore[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerScores = useCallback(async (): Promise<void> => {
    if (!playerName || playerName.trim() === '') {
      setError('Player name is required');
      setLoading(false);
      setScores([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await fetch(`/api/scores/player/${encodeURIComponent(playerName)}?${params}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(ERROR_MESSAGES.SERVER_ERROR);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || ERROR_MESSAGES.NETWORK_ERROR);
        }
      }

      const data: ScoreApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || ERROR_MESSAGES.SERVER_ERROR);
      }

      if (!data.data || data.data.length === 0) {
        setScores([]);
        setError(`No scores found for player "${playerName}"`);
      } else {
        setScores(data.data);
        setError(null);
      }
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          setError(ERROR_MESSAGES.TIMEOUT);
        } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          setError(ERROR_MESSAGES.NETWORK_ERROR);
        } else {
          setError(fetchError.message);
        }
      } else {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      setScores([]);
      console.error('Error fetching player scores:', fetchError);
    } finally {
      setLoading(false);
    }
  }, [playerName, limit, timeout]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchPlayerScores();
  }, [fetchPlayerScores]);

  useEffect(() => {
    if (autoFetch && playerName && playerName.trim() !== '') {
      void fetchPlayerScores();
    } else if (autoFetch && (!playerName || playerName.trim() === '')) {
      setLoading(false);
      setError('Player name is required');
      setScores([]);
    }
  }, [fetchPlayerScores, autoFetch, playerName]);

  return {
    scores,
    loading,
    error,
    refetch,
  };
}