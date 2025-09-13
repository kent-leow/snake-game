# Task: Implement Client-Side Score Management

## Task Header

- **ID**: T-2.4.3
- **Title**: Implement Client-Side Score Management
- **Story ID**: US-2.4
- **Type**: frontend
- **Priority**: high
- **Effort Estimate**: 4-5 hours
- **Complexity**: moderate

## Objective

Create client-side score management functionality that handles score submission, local storage fallback, and provides a seamless user experience for score persistence.

## Description

Implement the frontend score management system that automatically saves scores on game over, provides local storage fallback for offline scenarios, and manages the user experience around score submission.

## Acceptance Criteria Covered

- GIVEN game over WHEN score achieved THEN score is automatically saved to database
- GIVEN database unavailable WHEN saving THEN score is stored locally as fallback
- GIVEN multiple sessions WHEN playing THEN scores persist across browser restarts

## Implementation Notes

- Integrate with game over events to trigger automatic saving
- Implement robust offline/online detection and fallback
- Provide clear user feedback during score submission
- Handle optional player name entry with validation

## Technical Specifications

### File Targets

#### New Files

- `src/hooks/useScoreSubmission.ts` - Score submission logic
- `src/services/ScoreService.ts` - Client-side score service
- `src/utils/localStorage.ts` - Local storage utilities
- `src/components/ScoreSubmissionModal.tsx` - Score submission UI

#### Modified Files

- `src/game/Game.ts` - Trigger score submission on game over
- `src/components/GameOverScreen.tsx` - Integrate score submission

### Score Service Implementation

```typescript
// src/services/ScoreService.ts
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
  error?: string;
  scoreId?: string;
}

export class ScoreService {
  private static readonly API_BASE = '/api/scores';
  private static readonly STORAGE_KEY = 'snake_game_pending_scores';
  private static readonly MAX_OFFLINE_SCORES = 10;

  async submitScore(
    scoreData: ScoreSubmissionData
  ): Promise<ScoreSubmissionResult> {
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
        this.syncPendingScores();

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

  private saveScoreOffline(scoreData: ScoreSubmissionData): boolean {
    try {
      const pendingScores = this.getPendingScores();

      // Add new score with offline metadata
      const offlineScore = {
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

  private getPendingScores(): any[] {
    try {
      const stored = localStorage.getItem(ScoreService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve pending scores:', error);
      return [];
    }
  }

  async syncPendingScores(): Promise<void> {
    const pendingScores = this.getPendingScores();

    if (pendingScores.length === 0) return;

    const synced: string[] = [];

    for (const score of pendingScores) {
      try {
        score.attempts = (score.attempts || 0) + 1;

        // Skip scores that have failed too many times
        if (score.attempts > 3) {
          synced.push(score.timestamp);
          continue;
        }

        const response = await fetch(ScoreService.API_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(score),
        });

        if (response.ok) {
          synced.push(score.timestamp);
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

  async getPlayerBestScores(playerName: string): Promise<any[]> {
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

  getPendingScoreCount(): number {
    return this.getPendingScores().length;
  }
}
```

### Score Submission Hook

```typescript
// src/hooks/useScoreSubmission.ts
import { useState, useCallback } from 'react';
import { ScoreService } from '@/services/ScoreService';

interface UseScoreSubmissionOptions {
  onSuccess?: (result: ScoreSubmissionResult) => void;
  onError?: (error: string) => void;
}

export const useScoreSubmission = (options: UseScoreSubmissionOptions = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<ScoreSubmissionResult | null>(
    null
  );

  const scoreService = new ScoreService();

  const submitScore = useCallback(
    async (scoreData: ScoreSubmissionData) => {
      setIsSubmitting(true);

      try {
        const result = await scoreService.submitScore(scoreData);
        setLastResult(result);

        if (result.success) {
          options.onSuccess?.(result);
        } else {
          options.onError?.(result.error || 'Failed to submit score');
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        options.onError?.(errorMessage);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [options]
  );

  const syncPendingScores = useCallback(async () => {
    try {
      await scoreService.syncPendingScores();
    } catch (error) {
      console.error('Failed to sync pending scores:', error);
    }
  }, [scoreService]);

  return {
    submitScore,
    syncPendingScores,
    isSubmitting,
    lastResult,
    pendingCount: scoreService.getPendingScoreCount(),
  };
};
```

### Score Submission Modal Component

```typescript
// src/components/ScoreSubmissionModal.tsx
import React, { useState, useEffect } from 'react';
import { useScoreSubmission } from '@/hooks/useScoreSubmission';

interface ScoreSubmissionModalProps {
  isOpen: boolean;
  scoreData: Omit<ScoreSubmissionData, 'playerName'>;
  onClose: () => void;
  onSubmitted: (result: ScoreSubmissionResult) => void;
}

export const ScoreSubmissionModal: React.FC<ScoreSubmissionModalProps> = ({
  isOpen,
  scoreData,
  onClose,
  onSubmitted
}) => {
  const [playerName, setPlayerName] = useState('');
  const [submitMode, setSubmitMode] = useState<'automatic' | 'manual'>('automatic');

  const { submitScore, isSubmitting, lastResult } = useScoreSubmission({
    onSuccess: (result) => {
      onSubmitted(result);
      if (submitMode === 'automatic') {
        onClose();
      }
    },
    onError: (error) => {
      console.error('Score submission failed:', error);
    }
  });

  useEffect(() => {
    if (isOpen) {
      // Load saved player name from localStorage
      const savedName = localStorage.getItem('snake_game_player_name') || '';
      setPlayerName(savedName);

      // Auto-submit if player name is already set
      if (savedName && submitMode === 'automatic') {
        handleSubmit(savedName);
      }
    }
  }, [isOpen, submitMode]);

  const handleSubmit = async (name?: string) => {
    const finalName = name || playerName || 'Anonymous';

    // Save player name for future use
    if (finalName !== 'Anonymous') {
      localStorage.setItem('snake_game_player_name', finalName);
    }

    await submitScore({
      ...scoreData,
      playerName: finalName
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Game Over!</h2>
        <div className="score-display">
          <p>Your Score: <strong>{scoreData.score}</strong></p>
          <p>Combos: {scoreData.gameMetrics.totalCombos}</p>
          <p>Max Speed: Level {scoreData.gameMetrics.maxSpeedLevel}</p>
        </div>

        {lastResult?.saved === 'offline' && (
          <div className="offline-notice">
            <p>⚠️ Score saved offline. It will sync when connection is restored.</p>
          </div>
        )}

        <div className="player-name-section">
          <label htmlFor="playerName">Player Name (optional):</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            placeholder="Enter your name"
            disabled={isSubmitting}
          />
        </div>

        <div className="modal-actions">
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Saving...' : 'Save Score'}
          </button>
          <button onClick={onClose} className="cancel-button">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Testing Requirements

### Unit Tests

- Test score service online/offline functionality
- Test local storage fallback and sync
- Test score submission hook behavior
- Test modal component interactions

### Integration Tests

- Test integration with game over events
- Test automatic score submission flow
- Test offline/online sync behavior

### E2E Scenarios

- Complete game and verify automatic score submission
- Test offline functionality by disabling network
- Verify sync when connection is restored

## Dependencies

### Prerequisite Tasks

- T-2.4.2 (Score API Endpoints)
- T-2.2.1 (Combo State Management)

### Blocking Tasks

None

### External Dependencies

- Browser localStorage API
- Fetch API for HTTP requests
- Game state for score data

## Risks and Considerations

### Technical Risks

- **Browser Storage Limits**: LocalStorage quota exceeded
- **Sync Conflicts**: Multiple tabs syncing simultaneously

### Implementation Challenges

- **Network Reliability**: Handling intermittent connectivity
- **User Experience**: Balancing automation with user control

### Mitigation Strategies

- Implement storage quota monitoring and cleanup
- Use request deduplication for sync operations
- Provide clear feedback for all submission states
- Test thoroughly on mobile networks with poor connectivity
- Implement retry logic with exponential backoff

---

_This task creates a robust client-side score management system that provides seamless user experience while handling various network and storage scenarios._
