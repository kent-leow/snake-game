export * from './ui';
export * from './navigation';
export * from './mobile';

// Game components - only import when needed
// Note: These components depend on @/lib/game and should be imported 
// specifically from '@/components/game' when needed to avoid
// bringing in game dependencies for non-game pages
// export * from './game';

// Score components
export { ScoreSubmissionModal } from './ScoreSubmissionModal';
export { HighScoreTable } from './HighScoreTable';
export { ScoreEntry } from './ScoreEntry';

// Combo components
export { ComboProgressIndicator, useComboProgressProps } from './ComboProgressIndicator';
export { default as ComboFeedback } from './ComboFeedback';

// Explicitly export PageLayout for easy access
export { default as PageLayout } from './ui/PageLayout';

