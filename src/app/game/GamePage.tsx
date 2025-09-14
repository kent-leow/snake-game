'use client';

import { useState, useCallback } from 'react';
import { PageLayout } from '@/components';
import { GameCanvas } from '@/components/game/GameCanvasIntegrated';

export function GamePage(): React.JSX.Element {
  const [score, setScore] = useState(0);
  const [isGameReady, setIsGameReady] = useState(false);

  const handleGameReady = useCallback(() => {
    setIsGameReady(true);
  }, []);

  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  return (
    <PageLayout title='Snake Game' showBackButton={true}>
      <div className='flex flex-col items-center'>
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
              {isGameReady ? 'Game Ready - Click Start Game to begin' : 'Loading game...'}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
