'use client';

import React from 'react';
import { ScoreEntry } from '@/components';
import { HighScoreTableProps } from '@/types/HighScore';
import { useResponsive } from '@/hooks';
import styles from '@/styles/responsive.module.css';

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
      <div className={styles.loadingContainer}>
        <div className={`${styles.spinner} ${prefersReducedMotion ? '' : 'animate-spin'}`}></div>
        <p className="text-gray-400">Loading high scores...</p>
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
      <div className={styles.errorContainer}>
        <div className="text-red-400 text-lg mb-2">❌ Error Loading Scores</div>
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">
          No High Scores Yet
        </h3>
        <p className="text-gray-400 mb-6">
          Be the first to set a high score! Play the game and see your name here.
        </p>
        <a
          href="/game"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          🎮 Start Playing
        </a>
      </div>
    );
  }

  return (
    <div className={styles.scoreContainer}>
      {/* Desktop Table View */}
      <div className={styles.scoreTable}>
        <div className="bg-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-green-400">🏆 Leaderboard</h2>
        </div>
        
        {/* Table Header */}
        <div className={styles.tableHeader}>
          <div>Rank</div>
          <div>Player</div>
          <div>Score</div>
          <div>Combos</div>
          <div>Time</div>
          <div>Date</div>
        </div>
        
        {/* Table Body */}
        <div>
          {scores.map((score, index) => (
            <ScoreEntry
              key={`table-${score.playerName}-${score.score}-${index}`}
              score={score}
              rank={index + 1}
              isCurrentPlayer={currentPlayerId === String(score._id)}
              layout="table"
            />
          ))}
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className={styles.scoreCards}>
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-green-400 text-center">🏆 Leaderboard</h2>
        </div>
        
        {scores.map((score, index) => (
          <ScoreEntry
            key={`card-${score.playerName}-${score.score}-${index}`}
            score={score}
            rank={index + 1}
            isCurrentPlayer={currentPlayerId === String(score._id)}
            layout="card"
          />
        ))}
      </div>

      {/* Stats Summary */}
      {scores.length > 0 && (
        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} text-green-400`}>
                {Math.max(...scores.map(s => s.score)).toLocaleString()}
              </div>
              <div className={styles.statLabel}>Highest Score</div>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} text-blue-400`}>
                {Math.max(...scores.map(s => s.gameMetrics.longestCombo))}
              </div>
              <div className={styles.statLabel}>Best Combo</div>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} text-purple-400`}>
                {Math.max(...scores.map(s => s.gameMetrics.gameTimeSeconds))}s
              </div>
              <div className={styles.statLabel}>Longest Game</div>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} text-yellow-400`}>
                {scores.length}
              </div>
              <div className={styles.statLabel}>Total Players</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}