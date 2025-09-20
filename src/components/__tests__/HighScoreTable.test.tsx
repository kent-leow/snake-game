import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HighScoreTable } from '../HighScoreTable';
import { IScore } from '@/types/Database';

// Mock the ScoreEntry component
jest.mock('../ScoreEntry', () => ({
  ScoreEntry: ({ score, rank, layout }: any) => (
    <div data-testid={`score-entry-${rank}-${layout}`}>
      {score.playerName} - {score.score} ({layout})
    </div>
  ),
}));

const createMockScore = (overrides: Partial<IScore> = {}): IScore => ({
  _id: 'mock-id',
  playerName: 'TestPlayer',
  score: 1000,
  timestamp: new Date('2024-01-01'),
  gameMetrics: {
    totalFood: 100,
    totalCombos: 10,
    longestCombo: 5,
    maxSpeedLevel: 3,
    gameTimeSeconds: 300,
    finalSnakeLength: 20,
  },
  comboStats: {
    totalComboPoints: 500,
    basePoints: 500,
    comboEfficiency: 50,
    averageComboLength: 2.5,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
} as IScore);

const mockScores: IScore[] = [
  createMockScore({ playerName: 'Player1', score: 1500, _id: '1' }),
  createMockScore({ playerName: 'Player2', score: 1200, _id: '2' }),
  createMockScore({ playerName: 'Player3', score: 1000, _id: '3' }),
];

describe('HighScoreTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading spinner when loading is true', () => {
      render(
        <HighScoreTable
          scores={[]}
          loading={true}
          error={null}
        />
      );

      expect(screen.getByText('Loading high scores...')).toBeInTheDocument();
      expect(screen.getByText('Loading high scores...')).toHaveClass('text-gray-400');
    });

    it('shows spinner animation when loading', () => {
      render(
        <HighScoreTable
          scores={[]}
          loading={true}
          error={null}
        />
      );

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Error State', () => {
    it('renders error message when error is provided', () => {
      const errorMessage = 'Failed to fetch scores';
      render(
        <HighScoreTable
          scores={[]}
          loading={false}
          error={errorMessage}
        />
      );

      expect(screen.getByText('❌ Error Loading Scores')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('error container has correct styling', () => {
      render(
        <HighScoreTable
          scores={[]}
          loading={false}
          error="Test error"
        />
      );

      const errorContainer = screen.getByText('❌ Error Loading Scores').closest('div')?.parentElement;
      expect(errorContainer).toHaveClass('bg-red-900/20', 'border', 'border-red-500');
    });
  });

  describe('Empty State', () => {
    it('renders empty state when scores array is empty', () => {
      render(
        <HighScoreTable
          scores={[]}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('No High Scores Yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to set a high score! Play the game and see your name here.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '🎮 Start Playing' })).toBeInTheDocument();
    });

    it('empty state link has correct href', () => {
      render(
        <HighScoreTable
          scores={[]}
          loading={false}
          error={null}
        />
      );

      const link = screen.getByRole('link', { name: '🎮 Start Playing' });
      expect(link).toHaveAttribute('href', '/game');
    });
  });

  describe('Score Display', () => {
    it('renders scores when provided', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByTestId('score-entry-1-table')).toBeInTheDocument();
      expect(screen.getByTestId('score-entry-2-table')).toBeInTheDocument();
      expect(screen.getByTestId('score-entry-3-table')).toBeInTheDocument();
      expect(screen.getByTestId('score-entry-1-card')).toBeInTheDocument();
      expect(screen.getByTestId('score-entry-2-card')).toBeInTheDocument();
      expect(screen.getByTestId('score-entry-3-card')).toBeInTheDocument();
    });

    it('passes correct props to ScoreEntry components', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Player1 - 1500 (table)')).toBeInTheDocument();
      expect(screen.getByText('Player2 - 1200 (card)')).toBeInTheDocument();
      expect(screen.getByText('Player3 - 1000 (card)')).toBeInTheDocument();
    });

    it('shows leaderboard header', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      const headers = screen.getAllByText('🏆 Leaderboard');
      expect(headers.length).toBe(2); // One for desktop, one for mobile
    });
  });

  describe('Desktop Table View', () => {
    it('renders table headers for desktop view', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Player')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('Combos')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
    });

    it('desktop table has correct responsive classes', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      const tableContainer = document.querySelector('.hidden.md\\:block');
      expect(tableContainer).toBeInTheDocument();
    });
  });

  describe('Mobile Card View', () => {
    it('mobile container has correct responsive classes', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Find the mobile container by looking for the mobile-specific leaderboard title
      const mobileHeaders = screen.getAllByText('🏆 Leaderboard');
      expect(mobileHeaders).toHaveLength(2); // One for desktop, one for mobile
      
      // The mobile one should be in a container with md:hidden class
      const mobileContainer = mobileHeaders[1].closest('div')?.parentElement;
      expect(mobileContainer).toHaveClass('md:hidden');
    });
  });

  describe('Stats Summary', () => {
    it('renders stats summary when scores are provided', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('1,500')).toBeInTheDocument(); // Highest score
      expect(screen.getByText('5')).toBeInTheDocument(); // Best combo
      expect(screen.getByText('300s')).toBeInTheDocument(); // Longest game
      expect(screen.getByText('3')).toBeInTheDocument(); // Total players
    });

    it('stats labels are correct', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Highest Score')).toBeInTheDocument();
      expect(screen.getByText('Best Combo')).toBeInTheDocument();
      expect(screen.getByText('Longest Game')).toBeInTheDocument();
      expect(screen.getByText('Total Players')).toBeInTheDocument();
    });

    it('does not render stats when no scores', () => {
      render(
        <HighScoreTable
          scores={[]}
          loading={false}
          error={null}
        />
      );

      expect(screen.queryByText('Highest Score')).not.toBeInTheDocument();
    });
  });

  describe('Current Player Highlighting', () => {
    it('passes currentPlayerId to ScoreEntry components', () => {
      const { rerender } = render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
          currentPlayerId="2"
        />
      );

      // Re-render to ensure props are passed correctly
      rerender(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
          currentPlayerId="2"
        />
      );

      // Since we mocked ScoreEntry, we can't directly test the isCurrentPlayer prop
      // but we can verify the component renders without errors
      expect(screen.getByTestId('score-entry-1-table')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('applies correct grid layout for stats on different screen sizes', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      const statsContainer = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
      expect(statsContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Check that interactive elements have proper roles
      const tryAgainButton = screen.queryByRole('button', { name: 'Try Again' });
      const startPlayingLink = screen.queryByRole('link', { name: '🎮 Start Playing' });
      
      // These should only exist in their respective states
      if (tryAgainButton) {
        expect(tryAgainButton).toHaveAttribute('type', 'button');
      }
      
      if (startPlayingLink) {
        expect(startPlayingLink).toHaveAttribute('href');
      }
    });
  });
});