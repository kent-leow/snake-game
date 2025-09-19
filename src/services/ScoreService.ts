/**
 * Client-side Score Service
 * Handles score submission with online/offline functionality and local storage fallback
 */

interface ScoreSubmissionData {
  playerName: string;
  score: number;
  gameMetrics: {
    totalFood: number;
    totalCombos: number;
    longestCombo: number;
    maxSpeedLevel: number;
    gameTimeSeconds: number;
    finalSnakeLength: number;
  };
  comboStats: {
    totalComboPoints: number;
    basePoints: number;
    comboEfficiency: number;
    averageComboLength: number;
  };
}

interface ScoreSubmissionResult {
  success: boolean;
  saved: 'online' | 'offline' | 'failed';
  error?: string | undefined;
  scoreId?: string | undefined;
}

interface OfflineScore extends ScoreSubmissionData {
  timestamp: string;
  offline: boolean;
  attempts: number;
}

/**
 * Client-side score service for handling score submission, offline storage, and sync
 */
export class ScoreService {
  private static readonly API_BASE = '/api/scores';
  private static readonly STORAGE_KEY = 'snake_game_pending_scores';
  private static readonly MAX_OFFLINE_SCORES = 10;
  private static readonly MAX_SYNC_ATTEMPTS = 3;

  /**
   * Submit a score with automatic online/offline fallback
   */
  async submitScore(scoreData: ScoreSubmissionData): Promise<ScoreSubmissionResult> {
    try {
      // Try online submission first
      const response = await fetch(ScoreService.API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...scoreData,
          timestamp: new Date(),
          metadata: {
            browserInfo: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            gameVersion: process.env.NEXT_PUBLIC_GAME_VERSION || '1.0.0',
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // If online submission successful, try to sync any pending offline scores
        this.syncPendingScores().catch(error => {
          console.warn('Failed to sync pending scores after successful submission:', error);
        });

        return {
          success: true,
          saved: 'online',
          scoreId: result.data._id,
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Online score submission failed:', error);

      // Fall back to local storage
      const offlineResult = this.saveScoreOffline(scoreData);

      return {
        success: offlineResult,
        saved: offlineResult ? 'offline' : 'failed',
        error: offlineResult ? undefined : 'Failed to save score locally',
      };
    }
  }

  /**
   * Save score to local storage for offline submission
   */
  private saveScoreOffline(scoreData: ScoreSubmissionData): boolean {
    try {
      const pendingScores = this.getPendingScores();

      // Add new score with offline metadata
      const offlineScore: OfflineScore = {
        ...scoreData,
        timestamp: new Date().toISOString(),
        offline: true,
        attempts: 0,
      };

      pendingScores.push(offlineScore);

      // Keep only the most recent scores to prevent storage bloat
      if (pendingScores.length > ScoreService.MAX_OFFLINE_SCORES) {
        pendingScores.splice(
          0,
          pendingScores.length - ScoreService.MAX_OFFLINE_SCORES
        );
      }

      localStorage.setItem(
        ScoreService.STORAGE_KEY,
        JSON.stringify(pendingScores)
      );
      return true;
    } catch (error) {
      console.error('Failed to save score offline:', error);
      return false;
    }
  }

  /**
   * Get pending scores from localStorage
   */
  private getPendingScores(): OfflineScore[] {
    try {
      const stored = localStorage.getItem(ScoreService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve pending scores:', error);
      return [];
    }
  }

  /**
   * Sync pending offline scores to the server
   */
  async syncPendingScores(): Promise<void> {
    const pendingScores = this.getPendingScores();

    if (pendingScores.length === 0) return;

    const synced: string[] = [];

    for (const score of pendingScores) {
      try {
        score.attempts = (score.attempts || 0) + 1;

        // Skip scores that have failed too many times
        if (score.attempts > ScoreService.MAX_SYNC_ATTEMPTS) {
          synced.push(score.timestamp);
          console.warn(`Abandoning score sync after ${ScoreService.MAX_SYNC_ATTEMPTS} attempts:`, score.timestamp);
          continue;
        }

        const response = await fetch(ScoreService.API_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...score,
            metadata: {
              browserInfo: navigator.userAgent,
              screenResolution: `${screen.width}x${screen.height}`,
              gameVersion: process.env.NEXT_PUBLIC_GAME_VERSION || '1.0.0',
              syncAttempt: score.attempts,
            },
          }),
        });

        if (response.ok) {
          synced.push(score.timestamp);
          console.log('Successfully synced offline score:', score.timestamp);
        } else {
          console.warn(`Failed to sync score (attempt ${score.attempts}):`, response.status);
        }
      } catch (error) {
        console.warn('Failed to sync score:', error);
      }
    }

    // Remove successfully synced scores
    if (synced.length > 0) {
      const remainingScores = pendingScores.filter(
        score => !synced.includes(score.timestamp)
      );
      localStorage.setItem(
        ScoreService.STORAGE_KEY,
        JSON.stringify(remainingScores)
      );
    }
  }

  /**
   * Get player's best scores from the server
   */
  async getPlayerBestScores(playerName: string): Promise<unknown[]> {
    try {
      const response = await fetch(
        `${ScoreService.API_BASE}/player/${encodeURIComponent(playerName)}`
      );

      if (response.ok) {
        const result = await response.json();
        return result.data.scores || [];
      }
    } catch (error) {
      console.error('Failed to fetch player scores:', error);
    }

    return [];
  }

  /**
   * Get count of pending offline scores
   */
  getPendingScoreCount(): number {
    return this.getPendingScores().length;
  }

  /**
   * Clear all pending offline scores (for testing/reset purposes)
   */
  clearPendingScores(): void {
    try {
      localStorage.removeItem(ScoreService.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear pending scores:', error);
    }
  }

  /**
   * Check if online (basic connectivity check)
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get all pending scores for display/debugging
   */
  getPendingScoresForDisplay(): OfflineScore[] {
    return this.getPendingScores();
  }
}

export type { ScoreSubmissionData, ScoreSubmissionResult, OfflineScore };