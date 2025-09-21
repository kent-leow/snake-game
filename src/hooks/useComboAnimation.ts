/**
 * useComboAnimation hook for managing combo animation state and transitions
 * Provides animation control and state management for combo visual feedback
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ComboEvent } from '../types/Combo';

/**
 * Animation types for different combo events
 */
export type AnimationType = 'progress' | 'complete' | 'break' | 'started' | null;

/**
 * Animation state interface
 */
export interface AnimationState {
  /** Whether an animation is currently playing */
  isAnimating: boolean;
  /** Current animation type */
  animationType: AnimationType;
  /** Current event being animated */
  currentEvent: ComboEvent | null;
  /** Animation progress (0-1) */
  progress: number;
  /** Whether animation is paused */
  isPaused: boolean;
}

/**
 * Animation control interface
 */
export interface AnimationControls {
  /** Trigger a new animation */
  triggerAnimation: (event: ComboEvent) => void;
  /** Clear current animation */
  clearAnimation: () => void;
  /** Pause current animation */
  pauseAnimation: () => void;
  /** Resume paused animation */
  resumeAnimation: () => void;
  /** Skip current animation */
  skipAnimation: () => void;
  /** Check if animation queue is empty */
  isQueueEmpty: () => boolean;
  /** Get queue length */
  getQueueLength: () => number;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Maximum number of queued animations */
  maxQueueSize: number;
  /** Whether to auto-clear completed animations */
  autoClear: boolean;
  /** Default animation duration in milliseconds */
  defaultDuration: number;
  /** Whether to allow animation interruption */
  allowInterruption: boolean;
  /** Debug mode for logging */
  debug: boolean;
}

/**
 * Default animation configuration
 */
const DEFAULT_CONFIG: AnimationConfig = {
  maxQueueSize: 5,
  autoClear: true,
  defaultDuration: 2000,
  allowInterruption: false,
  debug: false,
};

/**
 * Animation duration mapping for different event types
 */
const ANIMATION_DURATIONS: Record<ComboEvent['type'], number> = {
  started: 1500,
  progress: 1000,
  completed: 2500,
  broken: 1200,
};

/**
 * Map ComboEvent type to AnimationType
 */
const mapEventTypeToAnimationType = (eventType: ComboEvent['type']): AnimationType => {
  switch (eventType) {
    case 'started':
      return 'started';
    case 'progress':
      return 'progress';
    case 'completed':
      return 'complete';
    case 'broken':
      return 'break';
    default:
      return null;
  }
};

/**
 * Custom hook for managing combo animations
 */
export const useComboAnimation = (
  config: Partial<AnimationConfig> = {}
): AnimationState & AnimationControls => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<AnimationType>(null);
  const [currentEvent, setCurrentEvent] = useState<ComboEvent | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Animation management refs
  const animationQueue = useRef<ComboEvent[]>([]);
  const animationTimer = useRef<NodeJS.Timeout | null>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);
  const pausedTime = useRef<number>(0);

  /**
   * Log debug information
   */
  const debugLog = useCallback((message: string, data?: unknown): void => {
    if (fullConfig.debug) {
      console.log(`[useComboAnimation] ${message}`, data || '');
    }
  }, [fullConfig.debug]);

  /**
   * Clear all timers
   */
  const clearTimers = useCallback((): void => {
    if (animationTimer.current) {
      clearTimeout(animationTimer.current);
      animationTimer.current = null;
    }
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }, []);

  /**
   * Update animation progress
   */
  const updateProgress = useCallback((duration: number): void => {
    startTime.current = Date.now();
    pausedTime.current = 0;

    progressTimer.current = setInterval(() => {
      if (isPaused) return;

      const elapsed = Date.now() - startTime.current - pausedTime.current;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      if (newProgress >= 1) {
        if (progressTimer.current) {
          clearInterval(progressTimer.current);
          progressTimer.current = null;
        }
      }
    }, 16); // ~60fps updates
  }, [isPaused]);

  /**
   * Complete current animation
   */
  const completeAnimation = useCallback((): void => {
    debugLog('Completing animation', { currentEvent, animationType });
    
    clearTimers();
    setProgress(1);
    
    if (fullConfig.autoClear) {
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType(null);
        setCurrentEvent(null);
        setProgress(0);
        setIsPaused(false);
      }, 100);
    }
  }, [debugLog, currentEvent, animationType, fullConfig.autoClear, clearTimers]);

  /**
   * Start animation for an event
   */
  const startAnimation = useCallback((event: ComboEvent): void => {
    debugLog('Starting animation', { event });
    
    const duration = ANIMATION_DURATIONS[event.type] || fullConfig.defaultDuration;
    
    setIsAnimating(true);
    setAnimationType(mapEventTypeToAnimationType(event.type));
    setCurrentEvent(event);
    setProgress(0);
    setIsPaused(false);
    
    // Start progress tracking
    updateProgress(duration);
    
    // Set completion timer with queue processing
    animationTimer.current = setTimeout(() => {
      completeAnimation();
      // Process queue after completion
      setTimeout(() => {
        if (animationQueue.current.length > 0) {
          const nextEvent = animationQueue.current.shift();
          if (nextEvent) {
            startAnimation(nextEvent);
          }
        }
      }, 50);
    }, duration);
    
  }, [debugLog, fullConfig.defaultDuration, updateProgress, completeAnimation]);

  /**
   * Trigger a new animation
   */
  const triggerAnimation = useCallback((event: ComboEvent): void => {
    debugLog('Triggering animation', { event, isAnimating, queueLength: animationQueue.current.length });
    
    // If interruption is not allowed and currently animating, queue the event
    if (isAnimating && !fullConfig.allowInterruption) {
      if (animationQueue.current.length < fullConfig.maxQueueSize) {
        animationQueue.current.push(event);
        debugLog('Animation queued', { queueLength: animationQueue.current.length });
      } else {
        debugLog('Animation queue full, dropping event', { event });
      }
      return;
    }
    
    // If interruption is allowed or not currently animating, start immediately
    if (isAnimating && fullConfig.allowInterruption) {
      debugLog('Interrupting current animation');
      clearTimers();
    }
    
    startAnimation(event);
  }, [isAnimating, fullConfig.allowInterruption, fullConfig.maxQueueSize, startAnimation, clearTimers, debugLog]);

  /**
   * Clear current animation
   */
  const clearAnimation = useCallback((): void => {
    debugLog('Clearing animation');
    
    clearTimers();
    setIsAnimating(false);
    setAnimationType(null);
    setCurrentEvent(null);
    setProgress(0);
    setIsPaused(false);
    
    // Clear queue
    animationQueue.current = [];
  }, [clearTimers, debugLog]);

  /**
   * Pause current animation
   */
  const pauseAnimation = useCallback((): void => {
    if (!isAnimating || isPaused) return;
    
    debugLog('Pausing animation');
    
    setIsPaused(true);
    pausedTime.current += Date.now() - startTime.current;
    
    if (animationTimer.current) {
      clearTimeout(animationTimer.current);
      const remainingTime = ANIMATION_DURATIONS[currentEvent?.type || 'progress'] - (Date.now() - startTime.current);
      
      animationTimer.current = setTimeout(() => {
        completeAnimation();
      }, remainingTime);
    }
  }, [isAnimating, isPaused, currentEvent, completeAnimation, debugLog]);

  /**
   * Resume paused animation
   */
  const resumeAnimation = useCallback((): void => {
    if (!isAnimating || !isPaused) return;
    
    debugLog('Resuming animation');
    
    setIsPaused(false);
    startTime.current = Date.now() - pausedTime.current;
  }, [isAnimating, isPaused, debugLog]);

  /**
   * Skip current animation
   */
  const skipAnimation = useCallback((): void => {
    if (!isAnimating) return;
    
    debugLog('Skipping animation');
    
    completeAnimation();
  }, [isAnimating, completeAnimation, debugLog]);

  /**
   * Check if animation queue is empty
   */
  const isQueueEmpty = useCallback((): boolean => {
    return animationQueue.current.length === 0;
  }, []);

  /**
   * Get queue length
   */
  const getQueueLength = useCallback((): number => {
    return animationQueue.current.length;
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return (): void => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    // State
    isAnimating,
    animationType,
    currentEvent,
    progress,
    isPaused,
    
    // Controls
    triggerAnimation,
    clearAnimation,
    pauseAnimation,
    resumeAnimation,
    skipAnimation,
    isQueueEmpty,
    getQueueLength,
  };
};

/**
 * Simplified hook for basic combo animation needs
 */
export const useSimpleComboAnimation = (): {
  currentEvent: ComboEvent | null;
  isAnimating: boolean;
  animationType: AnimationType;
  showEvent: (event: ComboEvent) => void;
  hideEvent: () => void;
} => {
  const [currentEvent, setCurrentEvent] = useState<ComboEvent | null>(null);
  
  const {
    isAnimating,
    animationType,
    triggerAnimation,
    clearAnimation,
  } = useComboAnimation({
    autoClear: true,
    allowInterruption: false,
    debug: false,
  });

  const showEvent = useCallback((event: ComboEvent): void => {
    setCurrentEvent(event);
    triggerAnimation(event);
  }, [triggerAnimation]);

  const hideEvent = useCallback((): void => {
    setCurrentEvent(null);
    clearAnimation();
  }, [clearAnimation]);

  return {
    currentEvent,
    isAnimating,
    animationType,
    showEvent,
    hideEvent,
  };
};

export default useComboAnimation;