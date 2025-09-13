import Link from 'next/link';

export default function Home(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-8 text-green-400">Snake Game</h1>
        <p className="text-xl mb-12 text-gray-300">
          Classic Snake game built with Next.js and TypeScript
        </p>
        
        <div className="space-y-4">
          <Link
            href="/game"
            className="block w-64 mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Play Game
          </Link>
          
          <Link
            href="/scores"
            className="block w-64 mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            High Scores
          </Link>
          
          <Link
            href="/settings"
            className="block w-64 mx-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Settings
          </Link>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          Use arrow keys to control the snake
        </div>
      </div>
    </div>
  );
}
