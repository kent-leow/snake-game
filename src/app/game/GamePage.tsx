'use client';

import { useState, useCallback } from 'react';
import { PageLayout, GameControls } from '@/components';
import { GameCanvas } from '@/components/game/GameCanvasIntegrated';
import { useGameState } from '@/hooks';

export function GamePage(): React.JSX.Element {
  const [score, setScore] = useState(0);
  const [isGameReady, setIsGameReady] = useState(false);

  // Game state management
  const { currentState, actions } = useGameState();

  const handleGameReady = useCallback(() => {
    setIsGameReady(true);
  }, []);

  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  return (
    <PageLayout title='Snake Game' showBackButton={true}>
      <div className='flex flex-col items-center gap-6'>
        <div className='bg-gray-800 p-8 rounded-lg shadow-lg'>
          <GameCanvas
            width={800}
            height={600}
            onGameReady={handleGameReady}
            onScoreChange={handleScoreChange}
            className='mb-4'
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
            onStartGame={actions.startGame}
            onPauseGame={actions.pauseGame}
            onResumeGame={actions.resumeGame}
            onRestartGame={actions.restartGame}
            onGoToMenu={actions.goToMenu}
            showKeyboardHints={true}
          />
        </div>
      </div>
    </PageLayout>
  );
}
