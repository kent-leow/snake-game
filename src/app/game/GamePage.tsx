'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PageLayout, GameControls, SpeedIndicator, ScoreSubmissionModal } from '@/components';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameStateIndicator } from '@/components/game/GameStateIndicator';
import { MobileGameLayout } from '@/components/mobile';
import { useGameState, useResponsiveLayout, useSpeedData } from '@/hooks';
import { GameEngine, type GameEngineConfig, type GameEngineCallbacks } from '@/lib/game/gameEngine';
import type { Direction } from '@/lib/game/types';
import type { ScoreSubmissionData, ScoreSubmissionResult } from '@/services/ScoreService';
import { ComboProgressIndicator, useComboProgressProps } from '@/components/ComboProgressIndicator';

export function GamePage(): React.JSX.Element {
  const [score, setScore] = useState(0);
  const [isGameReady, setIsGameReady] = useState(false);
  const [canvasSize, setCanvasSize] = useState(400); // Default size
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [gameOverData, setGameOverData] = useState<{
    score: number;
    gameMetrics: ScoreSubmissionData['gameMetrics'];
    comboStats: ScoreSubmissionData['comboStats'];
  } | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // Game state management
  const { currentState, actions } = useGameState();
  const { isMobile } = useResponsiveLayout();
  
  // Speed data for UI indicator
  const speedData = useSpeedData(gameEngineRef.current);

  // Combo progress data
  const comboProgressProps = useComboProgressProps(
    gameEngineRef.current?.getComboManager()?.getCurrentState() || {
      currentSequence: [],
      expectedNext: 1,
      comboProgress: 0,
      totalCombos: 0,
      isComboActive: false,
    }
  );

  // Calculate canvas dimensions
  const gridSize = 20;
  
  // Update canvas size based on viewport
  useEffect(() => {
    const updateCanvasSize = (): void => {
      const maxAvailableWidth = window.innerWidth - 600; // Reserve space for side panels
      const maxAvailableHeight = window.innerHeight - 200; // Reserve space for header and padding
      
      const availableSize = Math.min(
        800, // Desired max width
        600, // Desired max height
        maxAvailableWidth,
        maxAvailableHeight,
        500 // Maximum canvas size for optimal experience
      );
      const cellSize = Math.floor(availableSize / gridSize);
      const actualSize = cellSize * gridSize;
      setCanvasSize(actualSize);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const actualSize = canvasSize;

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
    if (!gameEngineRef.current) return;

    // Get game statistics and data
    const gameStats = gameEngineRef.current.getGameOverManager()?.getGameStatistics();
    const comboStats = gameEngineRef.current.getComboManager().getStatistics();
    const speedStats = gameEngineRef.current.getSpeedStatistics();
    
    // Calculate game duration in seconds
    const gameTimeSeconds = gameStats?.duration || 0;
    
    // Prepare score submission data
    const scoreData = {
      score: finalScore,
      gameMetrics: {
        totalFood: gameStats?.foodConsumed || 0,
        totalCombos: comboStats.totalCombos,
        longestCombo: Math.max(...[1, 2, 3, 4, 5].map((_, idx) => 
          comboStats.currentProgress >= idx + 1 ? idx + 1 : 0
        )), // Simple approximation
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

    setGameOverData(scoreData);
    setShowScoreModal(true);
    
    // Call the game state action
    actions.endGame();
    
    console.log('Game over:', { finalScore, cause, collisionPosition, scoreData });
  }, [actions]);

  // Utility function to focus the game canvas
  const focusCanvas = useCallback((): void => {
    setTimeout((): void => {
      const canvas = document.querySelector('.game-canvas') as HTMLCanvasElement;
      if (canvas) {
        canvas.focus();
        // Ensure the canvas is in view if needed
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }, []);

  // Auto-focus canvas when game is ready and playing
  useEffect(() => {
    if (isGameReady && (currentState === 'playing' || currentState === 'paused')) {
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
   * Handle score submission completion
   */
  const handleScoreSubmitted = useCallback((result: ScoreSubmissionResult) => {
    console.log('Score submitted:', result);
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
    if (actualSize === 0) return; // Wait for canvas size calculation
    
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
  }, [handleScoreChange, handleGameReady, actions, actualSize]);

  if (!gameEngineRef.current) {
    return (
      <PageLayout title='Snake Game' showBackButton={true}>
        <div className='flex flex-col items-center gap-6'>
          <div className='text-center'>Loading game...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title='Snake Game' showBackButton={true}>
      {isMobile ? (
        <MobileGameLayout 
          gameState={currentState}
          showTouchControls={true}
          onDirectionChange={handleDirectionChange}
        >
          <div className='h-full flex flex-col p-3 gap-3'>
            <div className='bg-gray-800 p-3 rounded-lg shadow-lg flex-1 flex flex-col'>
              <GameCanvas
                gameEngine={gameEngineRef.current}
                gameConfig={{
                  gridSize: gridSize,
                  gameSpeed: 150,
                  enableSound: true,
                  canvasWidth: actualSize,
                  canvasHeight: actualSize,
                }}
                className='flex-1'
                enablePerformanceMonitoring={true}
                targetFPS={60}
                enableTouchControls={true}
                onDirectionChange={handleDirectionChange}
                enableComboVisuals={true}
              />
              <div className='mt-2 flex justify-between items-center text-sm'>
                <div>
                  <span className='text-gray-400'>Score: </span>
                  <span className='font-bold text-green-400'>{score}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <SpeedIndicator
                    speedLevel={speedData.speedLevel}
                    currentSpeed={speedData.currentSpeed}
                    baseSpeed={speedData.baseSpeed}
                    isTransitioning={speedData.isTransitioning}
                    showDetails={false}
                    className='text-xs'
                  />
                  <GameStateIndicator currentState={currentState} />
                </div>
              </div>
              
              {/* Combo Progress for Mobile */}
              <div className='mt-2'>
                <ComboProgressIndicator {...comboProgressProps} />
              </div>
            </div>
            
            {/* Mobile Controls */}
            <div className='bg-gray-800 p-3 rounded-lg shadow-lg flex-shrink-0'>
              <GameControls
                currentState={currentState}
                onStartGame={handleStartGame}
                onPauseGame={handlePauseGame}
                onResumeGame={handleResumeGame}
                onRestartGame={handleRestartGame}
                onGoToMenu={handleGoToMenu}
                showKeyboardHints={false}
              />
            </div>
          </div>
        </MobileGameLayout>
      ) : (
        <div className='h-full flex items-center justify-center p-4' onClick={handleGameAreaClick}>
          <div className='flex items-center justify-center gap-6 max-w-7xl w-full'>
            {/* Left Side Panel */}
            <div className='flex flex-col gap-4 w-64 flex-shrink-0'>
              {/* Game Controls */}
              <div className='bg-gray-800 p-4 rounded-lg shadow-lg'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-base font-semibold text-white'>Controls</h3>
                  <GameStateIndicator currentState={currentState} />
                </div>
                <GameControls
                  currentState={currentState}
                  onStartGame={handleStartGame}
                  onPauseGame={handlePauseGame}
                  onResumeGame={handleResumeGame}
                  onRestartGame={handleRestartGame}
                  onGoToMenu={handleGoToMenu}
                  showKeyboardHints={false}
                />
              </div>

              {/* Score Display */}
              <div className='bg-gray-800 p-4 rounded-lg shadow-lg'>
                <h3 className='text-base font-semibold mb-2 text-white'>Score</h3>
                <div className='text-2xl font-bold text-green-400'>{score}</div>
                <div className='text-xs text-gray-400 mt-1'>
                  {isGameReady ? 'Ready to play' : 'Loading...'}
                </div>
              </div>

              {/* Game Stats & Speed */}
              <div className='bg-gray-800 p-4 rounded-lg shadow-lg'>
                <h3 className='text-base font-semibold mb-3 text-white'>Game Stats</h3>
                <div className='space-y-4'>
                  {/* Combo Progress */}
                  <div>
                    <div className='text-sm text-gray-300 mb-2'>Combo Progress</div>
                    <ComboProgressIndicator {...comboProgressProps} />
                  </div>
                  
                  {/* Speed Indicator */}
                  <div>
                    <div className='text-sm text-gray-300 mb-2'>Speed</div>
                    <SpeedIndicator
                      speedLevel={speedData.speedLevel}
                      currentSpeed={speedData.currentSpeed}
                      baseSpeed={speedData.baseSpeed}
                      isTransitioning={speedData.isTransitioning}
                      maxLevel={10}
                      showDetails={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Game Canvas */}
            <div className='flex-shrink-0'>
              <div className='bg-gray-800 p-4 rounded-lg shadow-lg'>
                <GameCanvas
                  gameEngine={gameEngineRef.current}
                  gameConfig={{
                    gridSize: gridSize,
                    gameSpeed: 150,
                    enableSound: true,
                    canvasWidth: actualSize,
                    canvasHeight: actualSize,
                  }}
                  enablePerformanceMonitoring={true}
                  targetFPS={60}
                  enableTouchControls={false}
                  onDirectionChange={handleDirectionChange}
                  enableComboVisuals={true}
                />
              </div>
            </div>

            {/* Right Side Panel */}
            <div className='flex flex-col gap-4 w-64 flex-shrink-0'>
              {/* Keyboard Instructions */}
              <div className='bg-gray-800 p-4 rounded-lg shadow-lg'>
                <h3 className='text-base font-semibold mb-3 text-white'>How to Play</h3>
                <div className='space-y-2 text-xs text-gray-300'>
                  <div className='flex items-center gap-2'>
                    <div className='flex gap-1'>
                      <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>↑</kbd>
                      <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>W</kbd>
                    </div>
                    <span>Move Up</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex gap-1'>
                      <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>↓</kbd>
                      <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>S</kbd>
                    </div>
                    <span>Move Down</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex gap-1'>
                      <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>←</kbd>
                      <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>A</kbd>
                    </div>
                    <span>Move Left</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex gap-1'>
                      <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>→</kbd>
                      <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>D</kbd>
                    </div>
                    <span>Move Right</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>Space</kbd>
                    <span>Pause</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <kbd className='px-2 py-1 bg-gray-700 rounded text-xs'>R</kbd>
                    <span>Restart</span>
                  </div>
                </div>
              </div>

              {/* Game Tips */}
              <div className='bg-gray-800 p-4 rounded-lg shadow-lg'>
                <h3 className='text-base font-semibold mb-3 text-white'>Tips</h3>
                <ul className='space-y-1 text-xs text-gray-300'>
                  <li>• Eat red food to grow</li>
                  <li>• Avoid walls and body</li>
                  <li>• Plan moves ahead</li>
                  <li>• Speed increases with size</li>
                </ul>
              </div>
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
          autoSubmit={true}
        />
      )}
    </PageLayout>
  );
}
