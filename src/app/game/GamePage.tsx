'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PageLayout, GameControls } from '@/components';
import { GameCanvas } from '@/components/game/GameCanvas';
import { MobileGameLayout } from '@/components/mobile';
import { useGameState, useResponsiveLayout } from '@/hooks';
import { GameEngine, type GameEngineConfig, type GameEngineCallbacks } from '@/lib/game/gameEngine';
import type { Direction } from '@/lib/game/types';

export function GamePage(): React.JSX.Element {
  const [score, setScore] = useState(0);
  const [isGameReady, setIsGameReady] = useState(false);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // Game state management
  const { currentState, actions } = useGameState();
  const { isMobile } = useResponsiveLayout();

  const handleGameReady = useCallback(() => {
    setIsGameReady(true);
  }, []);

  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  // Game control handlers
  const handleStartGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.start();
      actions.startGame();
    }
  }, [actions]);

  const handlePauseGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pause();
      actions.pauseGame();
    }
  }, [actions]);

  const handleResumeGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.start(); // Resume is the same as start
      actions.resumeGame();
    }
  }, [actions]);

  const handleRestartGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.reset();
      gameEngineRef.current.start();
      actions.restartGame();
      setScore(0); // Reset score display
    }
  }, [actions]);

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

  // Initialize game engine
  useEffect(() => {
    const config: GameEngineConfig = {
      canvasWidth: 800,
      canvasHeight: 600,
      gridSize: 20,
      initialScore: 0,
      foodSpawnDelay: 100,
    };

    const callbacks: GameEngineCallbacks = {
      onScoreChange: (score) => {
        handleScoreChange(score);
      },
      onFoodEaten: (food, newLength) => {
        console.log('Food eaten:', food, 'New length:', newLength);
      },
      onGameOver: (finalScore, _snake, cause, collisionPosition) => {
        console.log('Game over:', { finalScore, cause, collisionPosition });
        actions.endGame();
      },
    };

    gameEngineRef.current = new GameEngine(config, callbacks);
    handleGameReady();

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
    };
  }, [handleScoreChange, handleGameReady, actions]);

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
          <div className='flex flex-col items-center gap-6'>
            <div className='bg-gray-800 p-8 rounded-lg shadow-lg'>
              <GameCanvas
                gameEngine={gameEngineRef.current}
                gameConfig={{
                  gridSize: 20,
                  gameSpeed: 150,
                  enableSound: true,
                }}
                className='mb-4'
                enablePerformanceMonitoring={true}
                targetFPS={60}
                enableTouchControls={true}
                onDirectionChange={handleDirectionChange}
              />
              <div className='mt-4 flex justify-between items-center'>
                <div className='text-sm'>
                  <span className='text-gray-400'>Score: </span>
                  <span className='font-bold'>{score}</span>
                </div>
                <div className='text-sm text-gray-400'>
                  {isGameReady ? 'Game Ready - Swipe to play' : 'Loading game...'}
                </div>
              </div>
            </div>
          </div>
        </MobileGameLayout>
      ) : (
        <div className='flex flex-col items-center gap-6'>
          <div className='bg-gray-800 p-8 rounded-lg shadow-lg'>
            <GameCanvas
              gameEngine={gameEngineRef.current}
              gameConfig={{
                gridSize: 20,
                gameSpeed: 150,
                enableSound: true,
              }}
              className='mb-4'
              enablePerformanceMonitoring={true}
              targetFPS={60}
              enableTouchControls={false}
              onDirectionChange={handleDirectionChange}
            />
            <div className='mt-4 flex justify-between items-center'>
              <div className='text-sm'>
                <span className='text-gray-400'>Score: </span>
                <span className='font-bold'>{score}</span>
              </div>
              <div className='text-sm text-gray-400'>
                {isGameReady ? 'Game Ready - Use controls below to play' : 'Loading game...'}
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className='w-full max-w-md'>
            <GameControls
              currentState={currentState}
              onStartGame={handleStartGame}
              onPauseGame={handlePauseGame}
              onResumeGame={handleResumeGame}
              onRestartGame={handleRestartGame}
              onGoToMenu={handleGoToMenu}
              showKeyboardHints={true}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
}
