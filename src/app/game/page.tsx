import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Snake Game - Play',
  description: 'Play the classic Snake game',
};

export default function GamePage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Snake Game</h1>
        <div className="flex flex-col items-center">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="w-96 h-96 bg-black border-2 border-gray-600 relative">
              {/* Game canvas will be implemented later */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-400">Game canvas coming soon...</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm">
                <span className="text-gray-400">Score: </span>
                <span className="font-bold">0</span>
              </div>
              <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                Start Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}