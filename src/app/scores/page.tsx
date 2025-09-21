'use client';

import React from 'react';
import PageLayout from '../../components/ui/PageLayout';
import { HighScoreTable } from '../../components/HighScoreTable';
import { useHighScores } from '../../hooks/useHighScores';

export default function ScoresPage(): React.JSX.Element {
  const { scores, loading, error, refetch } = useHighScores({
    limit: 10,
    sortBy: 'score',
    order: 'desc',
    autoFetch: true,
    timeout: 3000, // 3 second timeout to meet performance requirement
  });

  return (
    <PageLayout title='High Scores' showBackButton={true} scrollable={true}>
      <div className='flex-1 overflow-auto p-6 relative'>
        {/* Animated background elements */}
        <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 animate-floating"></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-floating animate-delay-3"></div>
        
        <div className='max-w-4xl mx-auto relative z-10'>
          {/* Page Header */}
          <div className="text-center mb-8 animate-slide-in-down">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-neon-yellow">🏆</span>
              <span className="text-neon-green ml-3">Hall of Fame</span>
            </h1>
            <p className="text-lg text-gray-300 mb-6 animate-fade-in animate-delay-1">
              The greatest snake masters of all time
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slide-in-up animate-delay-2">
              <div className="glass-effect rounded-lg p-4 border border-white/10 hover-glow">
                <div className="text-2xl font-bold text-neon-green">{scores.length}</div>
                <div className="text-sm text-gray-400">Total Scores</div>
              </div>
              <div className="glass-effect rounded-lg p-4 border border-white/10 hover-glow">
                <div className="text-2xl font-bold text-neon-cyan">
                  {scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0}
                </div>
                <div className="text-sm text-gray-400">Highest Score</div>
              </div>
              <div className="glass-effect rounded-lg p-4 border border-white/10 hover-glow">
                <div className="text-2xl font-bold text-neon-pink">
                  {scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0}
                </div>
                <div className="text-sm text-gray-400">Average Score</div>
              </div>
            </div>
          </div>
          
          {/* High Score Table */}
          <div className="game-card p-6 animate-scale-in animate-delay-3">
            <HighScoreTable
              scores={scores}
              loading={loading}
              error={error}
              onRetry={refetch}
            />
          </div>
          
          {/* Call to Action */}
          {scores.length === 0 && !loading && !error && (
            <div className="text-center mt-8 animate-fade-in animate-delay-4">
              <div className="glass-effect rounded-lg p-8 border border-white/10">
                <div className="text-6xl mb-4 animate-floating">🐍</div>
                <h3 className="text-xl font-semibold text-neon-green mb-2">No scores yet!</h3>
                <p className="text-gray-400 mb-4">Be the first to make it to the leaderboard</p>
                <a
                  href="/game"
                  className="inline-block bg-gradient-to-r from-green-600 to-cyan-500 hover:from-green-500 hover:to-cyan-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-2 border-transparent hover:border-green-400"
                >
                  <span className="flex items-center space-x-2">
                    <span>🎮</span>
                    <span>Start Playing</span>
                  </span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
