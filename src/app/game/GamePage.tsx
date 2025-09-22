'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ScoreSubmissionModal from '../../components/ScoreSubmissionModal';
import PageLayout from '../../components/ui/PageLayout';
import MobileGameLayout from '../../components/mobile/MobileGameLayout';
import GameControls from '../../components/game/GameControls';
import SpeedIndicator from '../../components/game/SpeedIndicator';
import ComboProgress from '../../components/game/ComboProgress';
import GameStateIndicator from '../../components/game/GameStateIndicator';
import GameCanvas from '../../components/game/GameCanvas';
import GameStatsCard from '../../components/game/GameStatsCard';
import ControlsCard from '../../components/game/ControlsCard';
import { useGameState } from '../../hooks/useGameState';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useSpeedData } from '../../hooks/useSpeedData';
import { useComboData } from '../../hooks/useComboData';
import { GameEngine, type GameEngineConfig, type GameEngineCallbacks } from '../../lib/game/gameEngine';
import { GameStateEnum } from '../../lib/game/gameState';
import type { Direction } from '../../lib/game/types';
import type { ScoreSubmissionData, ScoreSubmissionResult } from '../../services/ScoreService';

// Import modern card styles
import '../../styles/gameCards.css';

export function GamePage(): React.JSX.Element {
  const [score, setScore] = useState(0);
  const [isGameReady, setIsGameReady] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [gameOverData, setGameOverData] = useState<{
    score: number;
    gameMetrics: ScoreSubmissionData['gameMetrics'];
    comboStats: ScoreSubmissionData['comboStats'];
  } | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // Game state management
  const { currentState, actions } = useGameState({
    initialState: GameStateEnum.MENU, // Start in menu state, then transition to playing
  });
  const { isMobile } = useResponsiveLayout();
  
  // Speed data for UI indicator
  const speedData = useSpeedData(gameEngineRef.current);
  
  // Combo data for UI indicator
  const comboData = useComboData(gameEngineRef.current);



  // Calculate canvas dimensions - FIXED SIZE aligned to grid
  const gridSize = 20;
  
  // Memoize canvas size to prevent flickering from frequent re-calculations
  const [actualSize] = useState(() => {
    // Use canvas sizes that are perfectly divisible by gridSize to ensure no overflow
    // Mobile: 320px (16 cells × 20px) or Desktop: 500px (25 cells × 20px) 
    if (typeof window !== 'undefined') {
      const isMobileWidth = window.innerWidth <= 768;
      return isMobileWidth ? 320 : 500;
    }
    return 500; // default for SSR
  });

  // Memoize game config to prevent unnecessary re-renders
  const gameConfig = useMemo(() => ({
    gridSize: gridSize, // This should be the cell size in pixels (20)
    gameSpeed: 150,
    enableSound: true,
    canvasWidth: actualSize,
    canvasHeight: actualSize,
  }), [actualSize]);

  const handleGameReady = useCallback((): void => {
    setIsGameReady(true);
  }, []);

  const handleScoreChange = useCallback((newScore: number): void => {
    setScore(newScore);
  }, []);

  /**
   * Handle game over and collect data for score submission
   */
  const handleGameOver = useCallback((finalScore: number, snake: any, cause?: 'boundary' | 'self', collisionPosition?: any) => {
    console.log('GamePage: handleGameOver called with:', { finalScore, cause, collisionPosition });
    
    if (!gameEngineRef.current) {
      console.error('GamePage: gameEngineRef.current is null in handleGameOver');
      return;
    }

    // Get game statistics and data
    const gameStats = gameEngineRef.current.getGameOverManager()?.getGameStatistics();
    const comboStats = gameEngineRef.current.getComboManager().getStatistics();
    const speedStats = gameEngineRef.current.getSpeedStatistics();
    
    console.log('GamePage: Game stats:', { gameStats, comboStats, speedStats });
    
    // Calculate game duration in seconds
    const gameTimeSeconds = gameStats?.duration || 0;
    
    // Prepare score submission data
    const scoreData = {
      score: finalScore,
      gameMetrics: {
        totalFood: gameStats?.foodConsumed || 0,
        totalCombos: comboStats.totalCombos,
        longestCombo: comboStats.longestSequence, // Use longestSequence from stats
        maxSpeedLevel: speedStats.maxLevelReached,
        gameTimeSeconds,
        finalSnakeLength: gameStats?.maxSnakeLength || snake?.segments?.length || 3,
      },
      comboStats: {
        totalComboPoints: comboStats.totalBonusPoints,
        basePoints: finalScore - comboStats.totalBonusPoints,
        comboEfficiency: comboStats.comboEfficiency,
        averageComboLength: comboStats.totalCombos > 0 ? 
          comboStats.totalFoodConsumed / comboStats.totalCombos : 0,
      },
    };

    console.log('GamePage: Setting game over data and showing modal:', scoreData);
    console.log('GamePage: About to set showScoreModal to true');
    setGameOverData(scoreData);
    setShowScoreModal(true);
    
    // Call the game state action
    actions.endGame();
    
    console.log('GamePage: Game over complete - modal should show');
  }, [actions]);

  // Utility function to focus the game canvas
  const focusCanvas = useCallback((): void => {
    setTimeout((): void => {
      const canvas = document.querySelector('.game-canvas') as HTMLCanvasElement;
      if (canvas) {
        canvas.focus();
        // No scrolling - just focus the canvas for keyboard input
      }
    }, 50);
  }, []);

  // Auto-focus canvas when game is ready and playing
  useEffect(() => {
    if (isGameReady && (currentState === GameStateEnum.PLAYING || currentState === GameStateEnum.PAUSED)) {
      focusCanvas();
    }
  }, [isGameReady, currentState, focusCanvas]);

  // Game control handlers
  const handleStartGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.start();
      actions.startGame();
      focusCanvas();
    }
  }, [actions, focusCanvas]);

  const handlePauseGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pause();
      actions.pauseGame();
      focusCanvas();
    }
  }, [actions, focusCanvas]);

  const handleResumeGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.start(); // Resume is the same as start
      actions.resumeGame();
      focusCanvas();
    }
  }, [actions, focusCanvas]);

  const handleRestartGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.reset();
      gameEngineRef.current.start();
      actions.restartGame();
      setScore(0); // Reset score display
      focusCanvas();
    }
  }, [actions, focusCanvas]);

  const handleGoToMenu = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.stop();
      actions.goToMenu();
    }
  }, [actions]);

  /**
   * Handle direction changes from mobile touch controls
   */
  const handleDirectionChange = useCallback((direction: Direction) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.changeDirection(direction);
    }
  }, []);

  /**
   * Handle clicks on the game area to maintain canvas focus
   */
  const handleGameAreaClick = useCallback(() => {
    focusCanvas();
  }, [focusCanvas]);

  /**
   * Handle score submission completion with error handling
   */
  const handleScoreSubmitted = useCallback((result: ScoreSubmissionResult) => {
    console.log('Score submitted:', result);
    if (!result.success) {
      // Don't crash the game on score submission failure - just log it
      console.warn('Score submission failed, but game continues:', result.error);
    }
  }, []);

  /**
   * Handle score modal close
   */
  const handleScoreModalClose = useCallback(() => {
    setShowScoreModal(false);
    setGameOverData(null);
  }, []);

  // Initialize game engine
  useEffect(() => {
    const config: GameEngineConfig = {
      canvasWidth: actualSize,
      canvasHeight: actualSize, // Make it square to match renderer
      gridSize: gridSize,
      gameSpeed: 150, // Snake moves every 150ms
      initialScore: 0,
    };

    const callbacks: GameEngineCallbacks = {
      onScoreChange: (score) => {
        handleScoreChange(score);
      },
      onFoodEaten: (food, newLength) => {
        console.log('Food eaten:', food, 'New length:', newLength);
      },
      onGameOver: handleGameOver,
    };

    gameEngineRef.current = new GameEngine(config, callbacks);
    
    handleGameReady();

    return (): void => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
    };
  }, [handleScoreChange, handleGameReady, handleGameOver]); // Fixed dependencies

  // Auto-start game when ready - proper state transition
  useEffect(() => {
    if (isGameReady && gameEngineRef.current && currentState === GameStateEnum.MENU) {
      // Only auto-start if in menu state to avoid double starts
      setTimeout(() => {
        if (gameEngineRef.current) {
          gameEngineRef.current.start();
          actions.startGame();
          focusCanvas();
        }
      }, 100); // Small delay to ensure proper initialization
    }
  }, [isGameReady, currentState, actions, focusCanvas]);

  if (!gameEngineRef.current) {
    return (
      <PageLayout title='Snake Game' showBackButton={true} scrollable={false} disableLaserEffects={true}>
        <div className='game-loading'>
          <div className='game-loading-text'>Loading game...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title='Snake Game' showBackButton={true} scrollable={false} disableLaserEffects={true}>
      {isMobile ? (
        <MobileGameLayout 
          gameState={currentState}
          showTouchControls={true}
          onDirectionChange={handleDirectionChange}
        >
          <div className='mobile-game-container'>
            <div className='mobile-game-canvas-wrapper'>
              <GameCanvas
                gameEngine={gameEngineRef.current}
                gameConfig={gameConfig}
                className='mobile-game-canvas'
                targetFPS={60}
                enableTouchControls={true}
                onDirectionChange={handleDirectionChange}
              />
              
              {/* Game Stats for Mobile */}
              <div className='mobile-game-stats'>
                <div className='mobile-score-row'>
                  <div>
                    <span className='score-label'>Score: </span>
                    <span className='score-value'>{score}</span>
                  </div>
                  <div className='speed-indicator-container'>
                    <SpeedIndicator
                      speedLevel={speedData.speedLevel}
                      currentSpeed={speedData.currentSpeed}
                      baseSpeed={speedData.baseSpeed}
                      isTransitioning={speedData.isTransitioning}
                      showDetails={false}
                      className='mobile-speed-indicator'
                    />
                    <GameStateIndicator currentState={currentState} />
                  </div>
                </div>
                
                {/* Combo Progress */}
                <div className='mobile-score-row'>
                  <ComboProgress
                    currentNumber={comboData.currentNumber}
                    expectedNext={comboData.expectedNext}
                    totalCombo={comboData.totalCombo}
                    isActive={comboData.isActive}
                    compact={true}
                    className='mobile-combo-progress'
                  />
                </div>
                

              </div>
            </div>
            
            {/* Mobile Controls */}
            <div className='mobile-controls-wrapper'>
              <GameControls
                currentState={currentState}
                onStartGame={handleStartGame}
                onPauseGame={handlePauseGame}
                onResumeGame={handleResumeGame}
                onRestartGame={handleRestartGame}
                onGoToMenu={handleGoToMenu}
                showKeyboardHints={false}
                hideStartButton={true}
              />
            </div>
          </div>
        </MobileGameLayout>
      ) : (
        <div className='desktop-game-container' onClick={handleGameAreaClick}>
          <div className='desktop-game-layout'>
            {/* Left Side Panel */}
            <div className='desktop-sidebar'>
              {/* Game Stats */}
              <GameStatsCard
                score={score}
                isGameReady={isGameReady}
                speedData={speedData}
              />
            </div>

            {/* Center - Game Canvas */}
            <div className='flex-shrink-0'>
              <div className='bg-gray-800 p-4 rounded-lg shadow-lg'>
                <GameCanvas
                  gameEngine={gameEngineRef.current}
                  gameConfig={gameConfig}
                  targetFPS={60}
                  enableTouchControls={false}
                  onDirectionChange={handleDirectionChange}
                />
              </div>
            </div>

            {/* Right Side Panel */}
            <div className='flex flex-col gap-4 w-64 flex-shrink-0'>
              {/* Game Controls */}
              <ControlsCard
                currentState={currentState}
                onStartGame={handleStartGame}
                onPauseGame={handlePauseGame}
                onResumeGame={handleResumeGame}
                onRestartGame={handleRestartGame}
                onGoToMenu={handleGoToMenu}
                showKeyboardHints={false}
                hideStartButton={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Score Submission Modal */}
      {showScoreModal && gameOverData && (
        <ScoreSubmissionModal
          isOpen={showScoreModal}
          scoreData={gameOverData}
          onClose={handleScoreModalClose}
          onSubmitted={handleScoreSubmitted}
          autoSubmit={false}
        />
      )}
    </PageLayout>
  );
}
