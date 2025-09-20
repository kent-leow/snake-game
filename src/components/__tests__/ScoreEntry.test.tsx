import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScoreEntry } from '../ScoreEntry';
import { IScore } from '@/types/Database';

const createMockScore = (overrides: Partial<IScore> = {}): IScore => ({
  _id: 'mock-id-1',
  playerName: 'TestPlayer',
  score: 1000,
  timestamp: new Date('2024-01-15T10:30:00Z'),
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
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
  ...overrides,
} as IScore);

describe('ScoreEntry', () => {
  const mockScore = createMockScore();

  describe('Table Layout', () => {
    it('renders table layout correctly', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('TestPlayer')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('5x')).toBeInTheDocument();
      expect(screen.getByText('5:00')).toBeInTheDocument();
    });

    it('applies correct grid layout for table', () => {
      const { container } = render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          layout="table"
        />
      );

      const tableRow = container.firstChild as HTMLElement;
      expect(tableRow).toHaveClass('grid', 'grid-cols-6', 'gap-4');
    });

    it('highlights current player in table layout', () => {
      const { container } = render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={true}
          layout="table"
        />
      );

      const tableRow = container.firstChild as HTMLElement;
      expect(tableRow).toHaveClass('bg-green-900/30', 'border-l-4', 'border-green-400');
      expect(screen.getByText('YOU')).toBeInTheDocument();
    });

    it('does not highlight non-current player in table layout', () => {
      const { container } = render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={false}
          layout="table"
        />
      );

      const tableRow = container.firstChild as HTMLElement;
      expect(tableRow).not.toHaveClass('bg-green-900/30');
      expect(screen.queryByText('YOU')).not.toBeInTheDocument();
    });
  });

  describe('Card Layout', () => {
    it('renders card layout correctly', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          layout="card"
        />
      );

      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('TestPlayer')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('points')).toBeInTheDocument();
    });

    it('displays game metrics in card layout', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          layout="card"
        />
      );

      expect(screen.getByText('5x')).toBeInTheDocument();
      expect(screen.getByText('Best Combo')).toBeInTheDocument();
      expect(screen.getByText('5:00')).toBeInTheDocument();
      expect(screen.getByText('Game Time')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Food Eaten')).toBeInTheDocument();
    });

    it('highlights current player in card layout', () => {
      const { container } = render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={true}
          layout="card"
        />
      );

      const cardContainer = container.firstChild as HTMLElement;
      expect(cardContainer).toHaveClass('border-2', 'border-green-400');
      expect(screen.getByText('YOU')).toBeInTheDocument();
    });

    it('does not highlight non-current player in card layout', () => {
      const { container } = render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={false}
          layout="card"
        />
      );

      const cardContainer = container.firstChild as HTMLElement;
      expect(cardContainer).toHaveClass('border', 'border-gray-700');
      expect(cardContainer).not.toHaveClass('border-2', 'border-green-400');
      expect(screen.queryByText('YOU')).not.toBeInTheDocument();
    });
  });

  describe('Rank Display', () => {
    it('displays first place icon and color', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          layout="table"
        />
      );

      const rankElement = screen.getByText('🥇');
      expect(rankElement).toHaveClass('text-yellow-400');
    });

    it('displays second place icon and color', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={2}
          layout="table"
        />
      );

      const rankElement = screen.getByText('🥈');
      expect(rankElement).toHaveClass('text-gray-300');
    });

    it('displays third place icon and color', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={3}
          layout="table"
        />
      );

      const rankElement = screen.getByText('🥉');
      expect(rankElement).toHaveClass('text-amber-600');
    });

    it('displays rank number for positions below 3', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={4}
          layout="table"
        />
      );

      const rankElement = screen.getByText('#4');
      expect(rankElement).toHaveClass('text-gray-400');
    });
  });

  describe('Score Formatting', () => {
    it('formats large scores with thousands separator', () => {
      const highScoreMock = createMockScore({ score: 123456 });
      render(
        <ScoreEntry
          score={highScoreMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('123,456')).toBeInTheDocument();
    });

    it('formats small scores without separator', () => {
      const lowScoreMock = createMockScore({ score: 123 });
      render(
        <ScoreEntry
          score={lowScoreMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('formats time correctly with minutes and seconds', () => {
      const timeMock = createMockScore({
        gameMetrics: {
          ...mockScore.gameMetrics,
          gameTimeSeconds: 125, // 2:05
        },
      });

      render(
        <ScoreEntry
          score={timeMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('2:05')).toBeInTheDocument();
    });

    it('pads seconds with zero when needed', () => {
      const timeMock = createMockScore({
        gameMetrics: {
          ...mockScore.gameMetrics,
          gameTimeSeconds: 67, // 1:07
        },
      });

      render(
        <ScoreEntry
          score={timeMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('1:07')).toBeInTheDocument();
    });

    it('handles large time values correctly', () => {
      const timeMock = createMockScore({
        gameMetrics: {
          ...mockScore.gameMetrics,
          gameTimeSeconds: 3661, // 61:01
        },
      });

      render(
        <ScoreEntry
          score={timeMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('61:01')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats date correctly', () => {
      const dateMock = createMockScore({
        timestamp: new Date('2024-12-25T15:30:00Z'),
      });

      render(
        <ScoreEntry
          score={dateMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('Dec 25, 2024')).toBeInTheDocument();
    });

    it('handles different date formats', () => {
      const dateMock = createMockScore({
        timestamp: new Date('2024-01-01T00:00:00Z'),
      });

      render(
        <ScoreEntry
          score={dateMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    });
  });

  describe('Player Name Display', () => {
    it('displays player name correctly', () => {
      const playerMock = createMockScore({ playerName: 'SuperPlayer123' });
      render(
        <ScoreEntry
          score={playerMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('SuperPlayer123')).toBeInTheDocument();
    });

    it('handles long player names', () => {
      const longNameMock = createMockScore({ playerName: 'VeryLongPlayerName' });
      render(
        <ScoreEntry
          score={longNameMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('VeryLongPlayerName')).toBeInTheDocument();
    });
  });

  describe('Game Metrics Display', () => {
    it('displays combo count correctly', () => {
      const comboMock = createMockScore({
        gameMetrics: {
          ...mockScore.gameMetrics,
          longestCombo: 15,
        },
      });

      render(
        <ScoreEntry
          score={comboMock}
          rank={1}
          layout="table"
        />
      );

      expect(screen.getByText('15x')).toBeInTheDocument();
    });

    it('displays food count in card layout', () => {
      const foodMock = createMockScore({
        gameMetrics: {
          ...mockScore.gameMetrics,
          totalFood: 250,
        },
      });

      render(
        <ScoreEntry
          score={foodMock}
          rank={1}
          layout="card"
        />
      );

      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure in table layout', () => {
      const { container } = render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          layout="table"
        />
      );

      const tableRow = container.firstChild as HTMLElement;
      expect(tableRow).toBeInTheDocument();
      expect(tableRow.tagName.toLowerCase()).toBe('div');
    });

    it('has proper semantic structure in card layout', () => {
      const { container } = render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          layout="card"
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
      expect(card.tagName.toLowerCase()).toBe('div');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for card stats grid', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          layout="card"
        />
      );

      const statsGrid = document.querySelector('.grid.grid-cols-3.gap-4');
      expect(statsGrid).toBeInTheDocument();
    });
  });
});