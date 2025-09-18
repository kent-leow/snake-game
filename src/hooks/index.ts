export { useCanvas } from './useCanvas';
export { useGameState, useGameStateLegacy } from './useGameState';
export { useGamePersistence, usePauseStatePersistence, useCheckpointPersistence } from './useGamePersistence';
export { useKeyboardNavigation } from './useKeyboardNavigation';
export { useMediaQuery } from './useMediaQuery';
export { useKeyboardInput } from './useKeyboardInput';
export { useGameLoop, useGameLoopCallbacks, useAdaptiveTiming, useGameTiming } from './useGameLoop';
export { usePerformanceMonitor } from './usePerformanceMonitor';
export { useScore, useFoodScore, useScoreDisplay } from './useScore';
export { 
  useCollisionDetection, 
  useCollisionChecker, 
  useAdvancedCollisionDetection 
} from './useCollisionDetection';
export { useGameOver } from './useGameOver';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useSpeedData } from './useSpeedData';

// Mobile-specific hooks
export { useResponsiveLayout } from './useResponsiveLayout';
export { useDeviceOrientation } from './useDeviceOrientation';
export { useTouchControls } from './useTouchControls';
