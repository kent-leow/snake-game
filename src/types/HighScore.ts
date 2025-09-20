/**
 * High Score Display Types
 * 
 * Types specific to high score page and component display functionality
 */

import { IScore } from './Database';

/**
 * Props for the HighScoreTable component
 */
export interface HighScoreTableProps {
  scores: IScore[];
  loading: boolean;
  error?: string | null;
  currentPlayerId?: string;
  onRetry?: () => void | Promise<void>;
}

/**
 * Props for the ScoreEntry component
 */
export interface ScoreEntryProps {
  score: IScore;
  rank: number;
  isCurrentPlayer?: boolean;
  layout: 'table' | 'card';
}

/**
 * State interface for the scores page
 */
export interface ScoresPageState {
  scores: IScore[];
  loading: boolean;
  error: string | null;
}

/**
 * High score display format options
 */
export type ScoreDisplayLayout = 'table' | 'card' | 'compact';

/**
 * Score ranking display configuration
 */
export interface RankDisplayConfig {
  showIcons: boolean;
  highlightTop3: boolean;
  showRankNumber: boolean;
}

/**
 * Leaderboard view options
 */
export interface LeaderboardViewOptions {
  period: 'daily' | 'weekly' | 'monthly' | 'all';
  layout: ScoreDisplayLayout;
  limit: number;
  showStats: boolean;
  highlightCurrentPlayer: boolean;
}

/**
 * Score statistics for display
 */
export interface ScoreStatistics {
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  totalScores: number;
  bestCombo: number;
  longestGame: number;
  shortestGame: number;
}

/**
 * Error states for score loading
 */
export interface ScoreLoadingError {
  type: 'network' | 'server' | 'validation' | 'unknown';
  message: string;
  retryable: boolean;
  statusCode?: number;
}

/**
 * Score entry display formatting options
 */
export interface ScoreEntryFormatting {
  showPlayerName: boolean;
  showTimestamp: boolean;
  showGameMetrics: boolean;
  showComboStats: boolean;
  dateFormat: 'short' | 'long' | 'relative';
  scoreFormat: 'number' | 'abbreviated';
}

/**
 * High score page configuration
 */
export interface HighScorePageConfig {
  title: string;
  subtitle?: string;
  defaultLimit: number;
  enableFiltering: boolean;
  enableSorting: boolean;
  showNavigation: boolean;
  viewOptions: LeaderboardViewOptions;
  formatting: ScoreEntryFormatting;
}

/**
 * Score filter and sort options
 */
export interface ScoreQueryOptions {
  sortBy: 'score' | 'timestamp' | 'playerName' | 'gameTime' | 'combos';
  sortOrder: 'asc' | 'desc';
  filterBy?: {
    playerName?: string;
    minScore?: number;
    maxScore?: number;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  pagination: {
    limit: number;
    offset: number;
  };
}

/**
 * Result interface for paginated score queries
 */
export interface PaginatedScoreResult {
  scores: IScore[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * High score API response format
 */
export interface HighScoreApiResponse {
  success: boolean;
  data: IScore[] | PaginatedScoreResult;
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 * Loading state configuration
 */
export interface LoadingStateConfig {
  showSpinner: boolean;
  showSkeleton: boolean;
  showProgressBar: boolean;
  loadingText: string;
  minimumLoadingTime?: number;
}

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  title: string;
  subtitle: string;
  icon: string;
  actionText?: string;
  actionHref?: string;
  showCallToAction: boolean;
}