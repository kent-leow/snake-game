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
      <div className='scores-content'>
        {/* Animated background elements */}
        <div className="scores-bg-element scores-bg-1"></div>
        <div className="scores-bg-element scores-bg-2"></div>
        
        <div className='scores-container'>
          {/* Page Header */}
          <div className="scores-header">
            <h1 className="scores-title">
              <span className="text-neon-yellow">🏆</span>
              <span className="text-neon-green">Hall of Fame</span>
            </h1>
            <p className="scores-subtitle">
              The greatest snake masters of all time
            </p>
            
            {/* Stats Cards */}
            <div className="scores-stats">
              <div className="stats-card">
                <div className="stats-value text-neon-green">{scores.length}</div>
                <div className="stats-label">Total Scores</div>
              </div>
              <div className="stats-card">
                <div className="stats-value text-neon-cyan">
                  {scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0}
                </div>
                <div className="stats-label">Highest Score</div>
              </div>
              <div className="stats-card">
                <div className="stats-value text-neon-pink">
                  {scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0}
                </div>
                <div className="stats-label">Average Score</div>
              </div>
            </div>
          </div>
          
          {/* High Score Table */}
          <div className="scores-table-card">
            <HighScoreTable
              scores={scores}
              loading={loading}
              error={error}
              onRetry={refetch}
            />
          </div>
          
          {/* Call to Action */}
          {scores.length === 0 && !loading && !error && (
            <div className="scores-cta">
              <div className="scores-cta-card">
                <div className="scores-cta-icon">🐍</div>
                <h3 className="scores-cta-title text-neon-green">No scores yet!</h3>
                <p className="scores-cta-description">Be the first to make it to the leaderboard</p>
                <a
                  href="/game"
                  className="scores-cta-button"
                >
                  <span className="scores-cta-button-content">
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
