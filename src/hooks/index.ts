export { useCanvas } from './useCanvas';
export { useGameState, useGameStateLegacy } from './useGameState';
export { useGamePersistence, usePauseStatePersistence, useCheckpointPersistence } from './useGamePersistence';
export { useKeyboardNavigation } from './useKeyboardNavigation';
export { useMediaQuery } from './useMediaQuery';
export { useKeyboardInput } from './useKeyboardInput';
export { useGameLoop, useGameLoopCallbacks, useAdaptiveTiming, useGameTiming } from './useGameLoop';
export { useScore, useFoodScore, useScoreDisplay } from './useScore';
export { 
  useCollisionDetection, 
  useCollisionChecker, 
  useAdvancedCollisionDetection 
} from './useCollisionDetection';
export { useGameOver } from './useGameOver';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useSpeedData } from './useSpeedData';
export { useHighScores, usePlayerScores } from './useHighScores';

// Mobile-specific hooks
export { useResponsiveLayout } from './useResponsiveLayout';
export { useDeviceOrientation } from './useDeviceOrientation';
export { useTouchControls } from './useTouchControls';
export { useResponsive, useBreakpoint, useMinBreakpoint, useResponsiveClasses } from './useResponsive';

// Performance and monitoring hooks
export { useCanvasPerformance } from './useCanvasPerformance';
export { usePerformanceMonitor } from './usePerformanceMonitor';
export { useComboAnimation } from './useComboAnimation';
export { useScoreSubmission } from './useScoreSubmission';
