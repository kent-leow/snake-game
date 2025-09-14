'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  GameStateManager, 
  GameStateEnum, 
  type GameStateData
} from '@/lib/game/gameState';
import { 
  StateTransitionManager, 
  StateTransitionAction, 
  type StateTransitionResult 
} from '@/lib/game/stateTransitions';
import type { GameConfig, Direction } from '@/lib/game/types';

/**
 * Hook options for game state management
 */
interface UseGameStateOptions {
  onStateChange?: (state: GameStateEnum, data: GameStateData) => void;
  onTransition?: (from: GameStateEnum, to: GameStateEnum) => void;
  onTransitionResult?: (result: StateTransitionResult) => void;
  autoSave?: boolean;
}

/**
 * Enhanced game state hook return interface
 */
interface UseGameStateReturn {
  // Current state and data
  currentState: GameStateEnum;
  gameData: GameStateData | null;
  
  // State actions
  actions: {
    startGame: () => StateTransitionResult;
    pauseGame: () => StateTransitionResult;
    resumeGame: () => StateTransitionResult;
    endGame: () => StateTransitionResult;
    restartGame: () => StateTransitionResult;
    goToMenu: () => StateTransitionResult;
    loadGame: () => StateTransitionResult;
  };
  
  // State selectors
  selectors: {
    isPlaying: boolean;
    isPaused: boolean;
    isGameOver: boolean;
    isMenu: boolean;
    isLoading: boolean;
    canPause: boolean;
    canResume: boolean;
    availableActions: StateTransitionAction[];
  };
  
  // State managers (for advanced usage)
  stateManager: GameStateManager;
  transitionManager: StateTransitionManager;
  
  // Game statistics and info
  gameInfo: {
    score: number;
    duration: number;
    snakeLength: number;
    foodConsumed: number;
  };
}

/**
 * Enhanced useGameState hook with comprehensive state management
 */
export const useGameState = ({
  onStateChange,
  onTransition,
  onTransitionResult,
}: UseGameStateOptions = {}): UseGameStateReturn => {
  const [currentState, setCurrentState] = useState<GameStateEnum>(GameStateEnum.MENU);
  const [gameData, setGameData] = useState<GameStateData | null>(null);
  
  // Create stable manager instances
  const stateManagerRef = useRef<GameStateManager>(new GameStateManager());
  const transitionManagerRef = useRef<StateTransitionManager>(
    new StateTransitionManager(stateManagerRef.current)
  );

  // Set up state change subscriptions
  useEffect(() => {
    const stateManager = stateManagerRef.current;

    // Subscribe to all state changes
    const unsubscribers = Object.values(GameStateEnum).map(state =>
      stateManager.onStateChange(state, (data) => {
        setCurrentState(data.state);
        setGameData(data);
        onStateChange?.(data.state, data);
      })
    );

    // Subscribe to transitions
    const transitionUnsubscriber = stateManager.onStateTransition(
      (from, to) => {
        onTransition?.(from, to);
      }
    );

    // Initialize with current state
    setCurrentState(stateManager.getCurrentState());
    setGameData(stateManager.getGameData());

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      transitionUnsubscriber();
    };
  }, [onStateChange, onTransition]);

  // Action creators with transition management
  const actions = useMemo(() => {
    const transitionManager = transitionManagerRef.current;
    
    const createAction = (action: StateTransitionAction) => {
      return () => {
        const result = transitionManager.executeAction(action);
        onTransitionResult?.(result);
        
        if (!result.success && result.error) {
          console.warn(`Game state action failed: ${result.error}`);
        }
        
        return result;
      };
    };

    return {
      startGame: createAction(StateTransitionAction.START_GAME),
      pauseGame: createAction(StateTransitionAction.PAUSE_GAME),
      resumeGame: createAction(StateTransitionAction.RESUME_GAME),
      endGame: createAction(StateTransitionAction.END_GAME),
      restartGame: createAction(StateTransitionAction.RESTART_GAME),
      goToMenu: createAction(StateTransitionAction.GO_TO_MENU),
      loadGame: createAction(StateTransitionAction.LOAD_GAME),
    };
  }, [onTransitionResult]);

  // State selectors
  const selectors = useMemo(() => {
    const transitionManager = transitionManagerRef.current;
    
    return {
      isPlaying: currentState === GameStateEnum.PLAYING,
      isPaused: currentState === GameStateEnum.PAUSED,
      isGameOver: currentState === GameStateEnum.GAME_OVER,
      isMenu: currentState === GameStateEnum.MENU,
      isLoading: currentState === GameStateEnum.LOADING,
      canPause: stateManagerRef.current.canPause(),
      canResume: stateManagerRef.current.canResume(),
      availableActions: transitionManager.getAvailableActions(),
    };
  }, [currentState]);

  // Game info selectors
  const gameInfo = useMemo(() => {
    if (!gameData) {
      return {
        score: 0,
        duration: 0,
        snakeLength: 3,
        foodConsumed: 0,
      };
    }

    return {
      score: gameData.score,
      duration: stateManagerRef.current.getGameDuration(),
      snakeLength: gameData.snake.segments.length,
      foodConsumed: gameData.gameStats.foodConsumed,
    };
  }, [gameData]);

  return {
    currentState,
    gameData,
    actions,
    selectors,
    stateManager: stateManagerRef.current,
    transitionManager: transitionManagerRef.current,
    gameInfo,
  };
};

/**
 * Legacy interface for backward compatibility
 */
interface UseGameStateLegacyReturn {
  gameState: {
    isPlaying: boolean;
    isPaused: boolean;
    score: number;
    gameOver: boolean;
    level: number;
  };
  gameConfig: GameConfig;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  updateScore: (points: number) => void;
  changeDirection: (direction: Direction) => void;
  updateConfig: (config: Partial<GameConfig>) => void;
}

const initialGameConfig: GameConfig = {
  gridSize: 20,
  gameSpeed: 150,
  enableSound: true,
};

/**
 * Legacy useGameState for backward compatibility
 * @deprecated Use the new useGameState hook instead
 */
export function useGameStateLegacy(): UseGameStateLegacyReturn {
  const [gameConfig, setGameConfig] = useState<GameConfig>(initialGameConfig);
  
  const {
    gameData,
    actions,
    selectors,
    stateManager,
  } = useGameState();

  // Convert new state to legacy format
  const legacyGameState = useMemo(() => ({
    isPlaying: selectors.isPlaying,
    isPaused: selectors.isPaused,
    score: gameData?.score || 0,
    gameOver: selectors.isGameOver,
    level: Math.floor((gameData?.score || 0) / 100) + 1,
  }), [gameData, selectors]);

  const updateScore = useCallback((points: number) => {
    if (gameData) {
      stateManager.updateGameData({
        ...gameData,
        score: gameData.score + points,
      });
    }
  }, [gameData, stateManager]);

  const changeDirection = useCallback((direction: Direction) => {
    console.log('Direction changed to:', direction);
  }, []);

  const updateConfig = useCallback((config: Partial<GameConfig>) => {
    setGameConfig(prev => ({ ...prev, ...config }));
  }, []);

  // Convert new actions to legacy format
  const legacyActions = useMemo(() => ({
    startGame: () => { actions.startGame(); },
    pauseGame: () => { actions.pauseGame(); },
    resumeGame: () => { actions.resumeGame(); },
    endGame: () => { actions.endGame(); },
    resetGame: () => { actions.restartGame(); },
  }), [actions]);

  return {
    gameState: legacyGameState,
    gameConfig,
    ...legacyActions,
    updateScore,
    changeDirection,
    updateConfig,
  };
}

export default useGameState;
