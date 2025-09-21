export * from './ui';
export * from './navigation';
export * from './mobile';

// Game components - these depend on @/lib/game
// Only import these in game-related pages to avoid bringing
// game dependencies into non-game pages
export * from './game';

// Score components
export { ScoreSubmissionModal } from './ScoreSubmissionModal';
export { HighScoreTable } from './HighScoreTable';
export { ScoreEntry } from './ScoreEntry';

// Combo components
export { ComboProgressIndicator, useComboProgressProps } from './ComboProgressIndicator';
export { default as ComboFeedback } from './ComboFeedback';

// Explicitly export PageLayout for easy access
export { default as PageLayout } from './ui/PageLayout';

