export * from './ui';
export * from './navigation';
export * from './mobile';

// Game components - temporarily commented out due to Vercel build issues
// These components have dependencies on @/lib/game which cause module resolution
// failures in Vercel deployment. Import these directly from @/components/game when needed.
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

