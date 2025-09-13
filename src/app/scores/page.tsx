import type { Metadata } from 'next';
import { PageLayout } from '@/components';

export const metadata: Metadata = {
  title: 'Snake Game - High Scores',
  description: 'View the highest scores in Snake game',
};

export default function ScoresPage(): React.JSX.Element {
  // Placeholder data - will be replaced with real data later
  const mockScores = [
    { rank: 1, name: 'Player1', score: 1200 },
    { rank: 2, name: 'Player2', score: 980 },
    { rank: 3, name: 'Player3', score: 850 },
    { rank: 4, name: 'Player4', score: 720 },
    { rank: 5, name: 'Player5', score: 650 },
  ];

  return (
    <PageLayout title="High Scores" showBackButton={true}>
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Top Players
          </h2>
          <div className="space-y-3">
            {mockScores.map((score) => (
              <div
                key={score.rank}
                className="flex justify-between items-center p-3 bg-gray-700 rounded"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-yellow-400">
                    #{score.rank}
                  </span>
                  <span className="text-lg">{score.name}</span>
                </div>
                <span className="text-lg font-semibold text-green-400">
                  {score.score}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-700">
          <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded">
            Reset Scores
          </button>
        </div>
      </div>
    </PageLayout>
  );
}