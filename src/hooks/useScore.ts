import { useState, useEffect, useRef, useCallback } from 'react';
import { ScoringSystem, type ScoreEvent } from '@/lib/game/scoring';

/**
 * Options for the useScore hook
 */
export interface UseScoreOptions {
  initialScore?: number;
  onScoreChange?: (score: number, event: ScoreEvent) => void;
  onMilestone?: (milestone: number) => void;
  milestones?: number[];
}

/**
 * Score animation state interface
 */
export interface ScoreAnimation {
  points: number;
  type: ScoreEvent['type'];
  timestamp: number;
  id: string;
}

/**
 * Return type for the useScore hook
 */
export interface UseScoreReturn {
  score: number;
  formattedScore: string;
  recentEvents: ScoreEvent[];
  comboCount: number;
  statistics: ReturnType<ScoringSystem['getStatistics']>;
  animations: ScoreAnimation[];
  addScore: (event: Omit<ScoreEvent, 'timestamp'>) => number;
  addFoodScore: (points: number, position?: { x: number; y: number }) => number;
  addBonusScore: (points: number, position?: { x: number; y: number }) => number;
  resetScore: () => void;
  getStatistics: () => ReturnType<ScoringSystem['getStatistics']>;
  exportData: () => ReturnType<ScoringSystem['exportData']>;
  importData: (data: Parameters<ScoringSystem['importData']>[0]) => void;
}

/**
 * React hook for managing game score with animations and statistics
 * Provides comprehensive score management with real-time updates and visual feedback
 */
export const useScore = ({
  initialScore = 0,
  onScoreChange,
  onMilestone,
  milestones = [100, 500, 1000, 2500, 5000, 10000],
}: UseScoreOptions = {}): UseScoreReturn => {
  // Core state
  const [score, setScore] = useState(initialScore);
  const [recentEvents, setRecentEvents] = useState<ScoreEvent[]>([]);
  const [comboCount, setComboCount] = useState(0);
  const [animations, setAnimations] = useState<ScoreAnimation[]>([]);

  // Refs for persistent instances
  const scoringSystemRef = useRef<ScoringSystem>(new ScoringSystem(initialScore));
  const animationIdRef = useRef(0);

  /**
   * Handle score changes from the scoring system
   */
  const handleScoreChange = useCallback(
    (newScore: number, event: ScoreEvent) => {
      setScore(newScore);
      setRecentEvents(prev => [...prev.slice(-4), event]); // Keep last 5 events
      setComboCount(scoringSystemRef.current.getCurrentCombo());

      // Create score animation
      const animation: ScoreAnimation = {
        points: event.points,
        type: event.type,
        timestamp: event.timestamp,
        id: `score-${animationIdRef.current++}`,
      };
      
      setAnimations(prev => [...prev, animation]);

      // Remove animation after duration
      setTimeout(() => {
        setAnimations(prev => prev.filter(anim => anim.id !== animation.id));
      }, 2000); // 2 second animation duration

      // Check for milestones
      if (milestones.length > 0) {
        const milestone = scoringSystemRef.current.checkMilestone(milestones);
        if (milestone && onMilestone) {
          onMilestone(milestone);
        }
      }

      // Call external score change handler
      onScoreChange?.(newScore, event);
    },
    [onScoreChange, onMilestone, milestones]
  );

  /**
   * Set up scoring system subscription
   */
  useEffect(() => {
    const unsubscribe = scoringSystemRef.current.subscribeToScoreChanges(handleScoreChange);
    
    // Initialize with current state
    setScore(scoringSystemRef.current.getCurrentScore());
    setRecentEvents(scoringSystemRef.current.getRecentEvents(5));
    setComboCount(scoringSystemRef.current.getCurrentCombo());

    return unsubscribe;
  }, [handleScoreChange]);

  /**
   * Add score with generic event
   */
  const addScore = useCallback((event: Omit<ScoreEvent, 'timestamp'>) => {
    return scoringSystemRef.current.addScore(event);
  }, []);

  /**
   * Add score for food consumption (convenience method)
   */
  const addFoodScore = useCallback((points: number, position?: { x: number; y: number }) => {
    const event: Omit<ScoreEvent, 'timestamp'> = {
      type: 'food',
      points,
    };
    
    if (position) {
      event.position = position;
    }
    
    return scoringSystemRef.current.addScore(event);
  }, []);

  /**
   * Add bonus score (convenience method)
   */
  const addBonusScore = useCallback((points: number, position?: { x: number; y: number }) => {
    return scoringSystemRef.current.addBonusScore(points, position);
  }, []);

  /**
   * Reset score to initial state
   */
  const resetScore = useCallback(() => {
    scoringSystemRef.current.resetScore();
    setScore(0);
    setRecentEvents([]);
    setComboCount(0);
    setAnimations([]);
  }, []);

  /**
   * Get comprehensive statistics
   */
  const getStatistics = useCallback(() => {
    return scoringSystemRef.current.getStatistics();
  }, []);

  /**
   * Export score data for persistence
   */
  const exportData = useCallback(() => {
    return scoringSystemRef.current.exportData();
  }, []);

  /**
   * Import score data from persistence
   */
  const importData = useCallback((data: Parameters<ScoringSystem['importData']>[0]) => {
    scoringSystemRef.current.importData(data);
    setScore(scoringSystemRef.current.getCurrentScore());
    setRecentEvents(scoringSystemRef.current.getRecentEvents(5));
    setComboCount(scoringSystemRef.current.getCurrentCombo());
  }, []);

  /**
   * Get formatted score for display
   */
  const formattedScore = scoringSystemRef.current.getFormattedScore();

  /**
   * Get current statistics
   */
  const statistics = scoringSystemRef.current.getStatistics();

  // Cleanup on unmount
  useEffect(() => {
    const scoringSystem = scoringSystemRef.current;
    return (): void => {
      scoringSystem.clearSubscribers();
    };
  }, []);

  return {
    score,
    formattedScore,
    recentEvents,
    comboCount,
    statistics,
    animations,
    addScore,
    addFoodScore,
    addBonusScore,
    resetScore,
    getStatistics,
    exportData,
    importData,
  };
};

/**
 * Hook for simplified food scoring (commonly used pattern)
 */
export const useFoodScore = (onScoreChange?: (score: number) => void): {
  score: number;
  addFoodPoints: (foodValue?: number) => number;
  resetScore: () => void;
} => {
  const options: UseScoreOptions = {};
  
  if (onScoreChange) {
    options.onScoreChange = (score): void => onScoreChange(score);
  }
  
  const { score, addFoodScore, resetScore } = useScore(options);

  const addFoodPoints = useCallback((foodValue: number = 10): number => {
    return addFoodScore(foodValue);
  }, [addFoodScore]);

  return {
    score,
    addFoodPoints,
    resetScore,
  };
};

/**
 * Hook for score display with animations
 */
export const useScoreDisplay = () => {
  const {
    score,
    formattedScore,
    animations,
    comboCount,
    recentEvents,
  } = useScore();

  // Calculate if we should show combo indicator
  const showCombo = comboCount > 1;
  
  // Get latest score animation for display
  const latestAnimation = animations[animations.length - 1];

  return {
    score,
    formattedScore,
    showCombo,
    comboCount,
    latestAnimation,
    recentEvents,
    hasRecentScore: recentEvents.length > 0,
  };
};

export default useScore;