'use client';

import { useState, useCallback } from 'react';
import { PageLayout } from '@/components';
import { GameCanvas } from '@/components/game/GameCanvas';
import { SnakeGame } from '@/lib/game/snake';

export function GamePage(): React.JSX.Element {
  const [gameInstance, setGameInstance] = useState<SnakeGame | null>(null);
  const [score] = useState(0);
  const [isGameReady, setIsGameReady] = useState(false);

  const handleGameReady = useCallback((game: SnakeGame) => {
    setGameInstance(game);
    setIsGameReady(true);
  }, []);

  const handleStartGame = useCallback(() => {
    if (gameInstance) {
      // Game start logic will be implemented in future tasks
      console.log('Game starting...', gameInstance);
    }
  }, [gameInstance]);

  return (
    <PageLayout title='Snake Game' showBackButton={true}>
      <div className='flex flex-col items-center'>
        <div className='bg-gray-800 p-8 rounded-lg shadow-lg'>
          <GameCanvas
            width={800}
            height={600}
            onGameReady={handleGameReady}
            className='mb-4'
          />
          <div className='mt-4 flex justify-between items-center'>
            <div className='text-sm'>
              <span className='text-gray-400'>Score: </span>
              <span className='font-bold'>{score}</span>
            </div>
            <button
              className='bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50'
              onClick={handleStartGame}
              disabled={!isGameReady}
            >
              {isGameReady ? 'Start Game' : 'Loading...'}
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
