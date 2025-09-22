'use client';

import React from 'react';
import { ScoreEntryProps } from '../types/HighScore';
import { useResponsive } from '../hooks/useResponsive';
import styles from '../styles/responsive.module.css';

export function ScoreEntry({
  score,
  rank,
  isCurrentPlayer = false,
  layout,
}: ScoreEntryProps): React.JSX.Element {
  const { isTouch } = useResponsive();

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColorClass = (rank: number): string => {
    switch (rank) {
      case 1:
        return styles.rankGold;
      case 2:
        return styles.rankSilver;
      case 3:
        return styles.rankBronze;
      default:
        return styles.rankDefault;
    }
  };

  if (layout === 'table') {
    return (
      <div
        className={`${styles.tableRow} ${
          isCurrentPlayer ? styles.currentPlayer : ''
        }`}
      >
        <div className={`${styles.rankBadge} ${getRankColorClass(rank)}`}>
          {getRankIcon(rank)}
        </div>
        <div className={styles.playerName}>
          {score.playerName}
          {isCurrentPlayer && (
            <span className={styles.currentPlayerBadge}>YOU</span>
          )}
        </div>
        <div className={`${styles.scoreValue} font-bold`}>
          {score.score.toLocaleString()}
        </div>
        <div className={`${styles.comboValue} ${styles.metricValue}`}>
          {score.gameMetrics.longestCombo}x
        </div>
        <div className={`${styles.timeValue} ${styles.metricValue}`}>
          {formatTime(score.gameMetrics.gameTimeSeconds)}
        </div>
        <div className={styles.dateValue}>
          {formatDate(score.timestamp)}
        </div>
      </div>
    );
  }

  // Card layout for mobile/tablet
  return (
    <div
      className={`${styles.scoreCard} ${
        isCurrentPlayer ? styles.currentPlayer : ''
      } ${isTouch ? 'touch-optimized' : ''}`}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardPlayerInfo}>
          <span className={`${styles.rankBadge} ${getRankColorClass(rank)}`}>
            {getRankIcon(rank)}
          </span>
          <div>
            <div className={styles.playerName}>
              {score.playerName}
              {isCurrentPlayer && (
                <span className={styles.currentPlayerBadge}>YOU</span>
              )}
            </div>
            <div className={styles.dateValue}>
              {formatDate(score.timestamp)}
            </div>
          </div>
        </div>
        <div className={styles.cardScoreInfo}>
          <div className={`${styles.scoreValue} score-entry-value`}>
            {score.score.toLocaleString()}
          </div>
          <div className="score-entry-label">points</div>
        </div>
      </div>

      <div className={styles.cardMetrics}>
        <div className={styles.cardMetric}>
          <div className={`${styles.comboValue} ${styles.metricValue} score-entry-metric`}>
            {score.gameMetrics.longestCombo}x
          </div>
          <div className="score-entry-label">Best Combo</div>
        </div>
        <div className={styles.cardMetric}>
          <div className={`${styles.timeValue} ${styles.metricValue} score-entry-metric`}>
            {formatTime(score.gameMetrics.gameTimeSeconds)}
          </div>
          <div className="score-entry-label">Game Time</div>
        </div>
        <div className={styles.cardMetric}>
          <div className={`${styles.foodValue} ${styles.metricValue} score-entry-metric`}>
            {score.gameMetrics.totalFood}
          </div>
          <div className="score-entry-label">Food Eaten</div>
        </div>
      </div>
    </div>
  );
}