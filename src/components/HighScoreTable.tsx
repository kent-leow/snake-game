'use client';

import React from 'react';
import { ScoreEntry } from '@/components';
import { HighScoreTableProps } from '@/types/HighScore';
import { useResponsive } from '@/hooks';

export function HighScoreTable({
  scores,
  loading,
  error,
  currentPlayerId,
  onRetry,
}: HighScoreTableProps): React.JSX.Element {
  const { prefersReducedMotion } = useResponsive();

  if (loading) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="relative inline-block">
          <div className={`w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full ${prefersReducedMotion ? '' : 'animate-spin'} mx-auto mb-4`}></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-neon-cyan border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="text-gray-400 text-lg animate-neon-pulse">Loading high scores...</p>
        <div className="mt-2 text-sm text-gray-500 animate-fade-in animate-delay-1">
          Fetching the hall of fame...
        </div>
      </div>
    );
  }

  if (error) {
    const handleRetry = (): void => {
      if (onRetry) {
        void onRetry();
      } else {
        window.location.reload();
      }
    };

    return (
      <div className="text-center py-12 animate-scale-in">
        <div className="glass-effect rounded-lg p-8 border border-red-500/30 error-glow">
          <div className="text-6xl mb-4 animate-bounce">⚠️</div>
          <div className="text-neon-pink text-xl mb-4">Error Loading Scores</div>
          <p className="text-red-300 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="btn-danger transform hover:scale-105 transition-all duration-300"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="text-center py-12 animate-scale-in">
        <div className="glass-effect rounded-lg p-8 border border-white/10">
          <div className="text-6xl mb-4 animate-floating">🏆</div>
          <h3 className="text-2xl font-semibold text-neon-green mb-4">
            No High Scores Yet
          </h3>
          <p className="text-gray-400 mb-8 text-lg">
            Be the first to set a high score! Play the game and see your name here.
          </p>
          <a
            href="/game"
            className="inline-block bg-gradient-to-r from-green-600 to-cyan-500 hover:from-green-500 hover:to-cyan-400 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-2 border-transparent hover:border-green-400"
          >
            <span className="flex items-center space-x-2">
              <span>🎮</span>
              <span>Start Playing</span>
            </span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center animate-slide-in-down">
        <h2 className="text-3xl font-bold text-neon-green mb-2 animate-neon-pulse">
          🏆 Hall of Fame
        </h2>
        <p className="text-gray-400">The greatest snake masters</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block animate-fade-in animate-delay-1">
        <div className="game-card overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-white/10">
            <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-neon-cyan">
              <div className="text-center">Rank</div>
              <div>Player</div>
              <div className="text-center">Score</div>
              <div className="text-center">Combos</div>
              <div className="text-center">Time</div>
              <div className="text-center">Date</div>
            </div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {scores.map((score, index) => (
              <div 
                key={`table-${score.playerName}-${score.score}-${index}`}
                className={`animate-slide-in-left hover-glow transition-all duration-300 ${
                  currentPlayerId === String(score._id) 
                    ? 'bg-gradient-to-r from-green-900/50 to-cyan-900/50 border-l-4 border-neon-green' 
                    : 'hover:bg-white/5'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ScoreEntry
                  score={score}
                  rank={index + 1}
                  isCurrentPlayer={currentPlayerId === String(score._id)}
                  layout="table"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4 animate-fade-in animate-delay-1">
        {scores.map((score, index) => (
          <div 
            key={`card-${score.playerName}-${score.score}-${index}`}
            className="animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <ScoreEntry
              score={score}
              rank={index + 1}
              isCurrentPlayer={currentPlayerId === String(score._id)}
              layout="card"
            />
          </div>
        ))}
      </div>

      {/* Enhanced Stats Summary */}
      {scores.length > 0 && (
        <div className="animate-slide-in-up animate-delay-2">
          <div className="game-card p-6">
            <h3 className="text-xl font-bold text-neon-purple mb-4 text-center animate-neon-pulse">
              📊 Leaderboard Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center glass-effect rounded-lg p-4 border border-white/10 hover-glow">
                <div className="text-2xl md:text-3xl font-bold text-neon-green animate-neon-pulse">
                  {Math.max(...scores.map(s => s.score)).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400 mt-1">Highest Score</div>
              </div>
              <div className="text-center glass-effect rounded-lg p-4 border border-white/10 hover-glow">
                <div className="text-2xl md:text-3xl font-bold text-neon-cyan animate-neon-pulse">
                  {Math.max(...scores.map(s => s.gameMetrics.longestCombo))}
                </div>
                <div className="text-sm text-gray-400 mt-1">Best Combo</div>
              </div>
              <div className="text-center glass-effect rounded-lg p-4 border border-white/10 hover-glow">
                <div className="text-2xl md:text-3xl font-bold text-neon-pink animate-neon-pulse">
                  {Math.max(...scores.map(s => s.gameMetrics.gameTimeSeconds))}s
                </div>
                <div className="text-sm text-gray-400 mt-1">Longest Game</div>
              </div>
              <div className="text-center glass-effect rounded-lg p-4 border border-white/10 hover-glow">
                <div className="text-2xl md:text-3xl font-bold text-neon-yellow animate-neon-pulse">
                  {scores.length}
                </div>
                <div className="text-sm text-gray-400 mt-1">Total Entries</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Badges */}
      {scores.length > 0 && (
        <div className="animate-fade-in animate-delay-3">
          <div className="game-card p-6">
            <h3 className="text-xl font-bold text-neon-orange mb-4 text-center animate-neon-pulse">
              🏅 Top Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Speed Demon */}
              <div className="glass-effect rounded-lg p-4 border border-white/10 hover-glow text-center">
                <div className="text-3xl mb-2 animate-bounce">🚀</div>
                <div className="text-sm font-semibold text-neon-green">Speed Demon</div>
                <div className="text-xs text-gray-400 mt-1">
                  Fastest Score: {scores.length > 0 ? Math.min(...scores.map(s => s.gameMetrics.gameTimeSeconds)) : 0}s
                </div>
              </div>
              
              {/* Combo Master */}
              <div className="glass-effect rounded-lg p-4 border border-white/10 hover-glow text-center">
                <div className="text-3xl mb-2 animate-bounce" style={{ animationDelay: '0.1s' }}>🎯</div>
                <div className="text-sm font-semibold text-neon-cyan">Combo Master</div>
                <div className="text-xs text-gray-400 mt-1">
                  Max Combo: {scores.length > 0 ? Math.max(...scores.map(s => s.gameMetrics.longestCombo)) : 0}
                </div>
              </div>
              
              {/* Endurance King */}
              <div className="glass-effect rounded-lg p-4 border border-white/10 hover-glow text-center">
                <div className="text-3xl mb-2 animate-bounce" style={{ animationDelay: '0.2s' }}>👑</div>
                <div className="text-sm font-semibold text-neon-pink">Endurance King</div>
                <div className="text-xs text-gray-400 mt-1">
                  Longest: {scores.length > 0 ? Math.max(...scores.map(s => s.gameMetrics.gameTimeSeconds)) : 0}s
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}