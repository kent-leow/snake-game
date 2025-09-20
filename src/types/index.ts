/**
 * Type exports for the Snake Game application
 */

// Database and core types
export * from './Database';

// Game-specific types
export * from './Combo';
export * from './Speed';

// High score display types
export * from './HighScore';

// Re-export commonly used types with aliases for convenience
export type { IScore as Score } from './Database';
export type { HighScoreTableProps, ScoreEntryProps, ScoresPageState } from './HighScore';

// Export hook types and utilities
export type { 
  ScoreApiResponse,
  UseHighScoresReturn,
  UseHighScoresOptions,
  ScoreError,
} from '../hooks/useHighScores';

export type {
  FormattedScoreEntry,
} from '../utils/scoreFormatter';