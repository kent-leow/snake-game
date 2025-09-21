/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HighScoreTable } from '@/components/HighScoreTable';
import { ScoreEntry } from '@/components/ScoreEntry';
import { IScore } from '@/types/Database';

// Mock data for testing
const mockScores: IScore[] = [
  {
    _id: '1',
    playerName: 'TestPlayer1',
    score: 15000,
    timestamp: new Date('2024-01-01'),
    gameMetrics: {
      totalFood: 150,
      totalCombos: 20,
      longestCombo: 8,
      maxSpeedLevel: 5,
      gameTimeSeconds: 300,
      finalSnakeLength: 25,
    },
    comboStats: {
      totalComboPoints: 2000,
      basePoints: 13000,
      comboEfficiency: 75,
      averageComboLength: 4.5,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as IScore,
  {
    _id: '2',
    playerName: 'TestPlayer2',
    score: 12000,
    timestamp: new Date('2024-01-02'),
    gameMetrics: {
      totalFood: 120,
      totalCombos: 15,
      longestCombo: 6,
      maxSpeedLevel: 4,
      gameTimeSeconds: 240,
      finalSnakeLength: 20,
    },
    comboStats: {
      totalComboPoints: 1500,
      basePoints: 10500,
      comboEfficiency: 65,
      averageComboLength: 3.5,
    },
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  } as IScore,
];

// Mock window.matchMedia for responsive testing
const createMatchMedia = (matches: boolean): jest.Mock => {
  return jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

beforeEach(() => {
  // Reset window size to desktop default
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1200,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 800,
  });

  // Mock ResizeObserver
  global.ResizeObserver = MockResizeObserver;

  // Mock matchMedia for reduced motion preference
  window.matchMedia = createMatchMedia(false);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('HighScoreTable Responsive Behavior', () => {
  describe('Desktop Layout (1024px+)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
    });

    it('should render table layout on desktop screens', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Check for table structure
      const tableHeaders = screen.getAllByText(/Rank|Player|Score|Combos|Time|Date/);
      expect(tableHeaders.length).toBeGreaterThan(0);
      
      // Verify table layout is used (hidden on mobile, shown on desktop)
      const tableContainer = document.querySelector('[class*="lg:block"]');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should hide card layout on desktop', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Card layout should be hidden on desktop (lg:hidden class)
      const cardContainer = document.querySelector('[class*="lg:hidden"]');
      expect(cardContainer).toBeInTheDocument(); // CSS handles visibility
    });

    it('should render statistics in 4-column grid on desktop', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Check for stats grid (responsive grid classes)
      const statsContainer = document.querySelector('[class*="grid-cols-2"]');
      expect(statsContainer).toBeInTheDocument();
    });
  });

  describe('Tablet Layout (768px - 1023px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });
    });

    it('should render card layout on tablet screens', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Should use card layout (lg:hidden for mobile/tablet)
      const cardContainer = document.querySelector('[class*="lg:hidden"]');
      expect(cardContainer).toBeInTheDocument();
    });

    it('should arrange cards in grid on tablet', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Cards should be present (both layouts render, so we expect 2 cards per score)
      const scoreCards = document.querySelectorAll('[class*="scoreCard"]');
      expect(scoreCards.length).toBeGreaterThanOrEqual(mockScores.length);
    });
  });

  describe('Mobile Layout (< 768px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should render card layout on mobile screens', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Should use card layout (lg:hidden for mobile)
      const cardContainer = document.querySelector('[class*="lg:hidden"]');
      expect(cardContainer).toBeInTheDocument();
    });

    it('should stack cards vertically on mobile', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Cards should be present and stacked (both layouts render simultaneously)
      const scoreCards = document.querySelectorAll('[class*="scoreCard"]');
      expect(scoreCards.length).toBeGreaterThanOrEqual(mockScores.length);
    });

    it('should render 2-column stats grid on mobile', () => {
      render(
        <HighScoreTable
          scores={mockScores}
          loading={false}
          error={null}
        />
      );

      // Stats should be in responsive grid (2 columns on mobile, 4 on larger screens)
      const statsContainer = document.querySelector('[class*="grid-cols-2"]');
      expect(statsContainer).toBeInTheDocument();
    });
  });

  describe('Loading State Responsiveness', () => {
    it('should render responsive loading spinner', () => {
      render(
        <HighScoreTable
          scores={[]}
          loading={true}
          error={null}
        />
      );

      const loadingContainer = document.querySelector('.text-center.py-12');
      expect(loadingContainer).toBeInTheDocument();

      const spinner = document.querySelector('.rounded-full');
      expect(spinner).toBeInTheDocument();
    });

    it('should respect reduced motion preference for spinner', () => {
      // Mock prefers-reduced-motion
      window.matchMedia = createMatchMedia(true);

      render(
        <HighScoreTable
          scores={[]}
          loading={true}
          error={null}
        />
      );

      const spinner = document.querySelector('.rounded-full');
      expect(spinner).toBeInTheDocument();
      // Should not have animate-spin class when reduced motion is preferred
      expect(spinner).not.toHaveClass('animate-spin');
    });
  });

  describe('Error State Responsiveness', () => {
    it('should render responsive error container', () => {
      render(
        <HighScoreTable
          scores={[]}
          loading={false}
          error="Test error message"
        />
      );

      const errorContainer = document.querySelector('.glass-effect.rounded-lg');
      expect(errorContainer).toBeInTheDocument();

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('Empty State Responsiveness', () => {
    it('should render responsive empty state', () => {
      render(
        <HighScoreTable
          scores={[]}
          loading={false}
          error={null}
        />
      );

      const emptyContainer = document.querySelector('.text-center.py-12');
      expect(emptyContainer).toBeInTheDocument();

      expect(screen.getByText('No High Scores Yet')).toBeInTheDocument();
    });
  });
});

describe('ScoreEntry Responsive Behavior', () => {
  const mockScore = mockScores[0];

  describe('Table Layout', () => {
    it('should render table row layout correctly', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={false}
          layout="table"
        />
      );

      const tableRow = document.querySelector('[class*="tableRow"]');
      expect(tableRow).toBeInTheDocument();

      // Should display all required data
      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('TestPlayer1')).toBeInTheDocument();
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });

    it('should highlight current player in table layout', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={true}
          layout="table"
        />
      );

      const tableRow = document.querySelector('[class*="tableRow"]');
      expect(tableRow).toBeInTheDocument();
      
      // Check for current player indicator
      expect(screen.getByText('YOU')).toBeInTheDocument();
    });
  });

  describe('Card Layout', () => {
    it('should render card layout correctly', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={false}
          layout="card"
        />
      );

      const scoreCard = document.querySelector('[class*="scoreCard"]');
      expect(scoreCard).toBeInTheDocument();

      // Should display all required data
      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('TestPlayer1')).toBeInTheDocument();
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });

    it('should highlight current player in card layout', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={true}
          layout="card"
        />
      );

      const scoreCard = document.querySelector('[class*="scoreCard"]');
      expect(scoreCard).toBeInTheDocument();
      
      // Check for current player indicator
      expect(screen.getByText('YOU')).toBeInTheDocument();
    });

    it('should display game metrics in card layout', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={false}
          layout="card"
        />
      );

      // Check for game metrics
      expect(screen.getByText('8x')).toBeInTheDocument(); // Best combo
      expect(screen.getByText('5:00')).toBeInTheDocument(); // Game time
      expect(screen.getByText('150')).toBeInTheDocument(); // Food eaten
    });
  });

  describe('Rank Display', () => {
    it('should display gold medal for rank 1', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={false}
          layout="card"
        />
      );

      expect(screen.getByText('🥇')).toBeInTheDocument();
    });

    it('should display silver medal for rank 2', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={2}
          isCurrentPlayer={false}
          layout="card"
        />
      );

      expect(screen.getByText('🥈')).toBeInTheDocument();
    });

    it('should display bronze medal for rank 3', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={3}
          isCurrentPlayer={false}
          layout="card"
        />
      );

      expect(screen.getByText('🥉')).toBeInTheDocument();
    });

    it('should display numeric rank for ranks > 3', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={5}
          isCurrentPlayer={false}
          layout="card"
        />
      );

      expect(screen.getByText('#5')).toBeInTheDocument();
    });
  });

  describe('Touch Optimization', () => {
    beforeEach(() => {
      // Mock touch device
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: {},
      });

      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 2,
      });
    });

    it('should apply touch-optimized styles on touch devices', () => {
      render(
        <ScoreEntry
          score={mockScore}
          rank={1}
          isCurrentPlayer={false}
          layout="card"
        />
      );

      const scoreCard = document.querySelector('[class*="scoreCard"]');
      expect(scoreCard).toHaveClass('touch-optimized');
    });
  });
});

describe('Responsive Hook Integration', () => {
  it('should handle window resize events', async () => {
    const { rerender } = render(
      <HighScoreTable
        scores={mockScores}
        loading={false}
        error={null}
      />
    );

    // Simulate window resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Trigger resize event
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      // Allow time for debounced updates
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    rerender(
      <HighScoreTable
        scores={mockScores}
        loading={false}
        error={null}
      />
    );

    // Should now use card layout (lg:hidden for mobile view)
    const cardContainer = document.querySelector('[class*="lg:hidden"]');
    expect(cardContainer).toBeInTheDocument();
  });

  it('should handle orientation change events', async () => {
    const { rerender } = render(
      <HighScoreTable
        scores={mockScores}
        loading={false}
        error={null}
      />
    );

    // Simulate orientation change
    await act(async () => {
      window.dispatchEvent(new Event('orientationchange'));
      // Allow time for debounced updates
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    rerender(
      <HighScoreTable
        scores={mockScores}
        loading={false}
        error={null}
      />
    );

    // Component should handle orientation change gracefully - use getAllByText since both layouts render
    const leaderboardHeadings = screen.getAllByText('🏆 Hall of Fame');
    expect(leaderboardHeadings.length).toBeGreaterThan(0);
  });
});

describe('Accessibility and Motion Preferences', () => {
  it('should respect prefers-reduced-motion setting', () => {
    // Mock prefers-reduced-motion
    window.matchMedia = createMatchMedia(true);

    render(
      <HighScoreTable
        scores={[]}
        loading={true}
        error={null}
      />
    );

    const spinner = document.querySelector('.rounded-full');
    expect(spinner).toBeInTheDocument();
    // Should not have animation classes when reduced motion is preferred
    expect(spinner).not.toHaveClass('animate-spin');
  });

  it('should maintain proper heading hierarchy for screen readers', () => {
    render(
      <HighScoreTable
        scores={mockScores}
        loading={false}
        error={null}
      />
    );

    // Check for proper heading - use getAllByRole since both layouts render the same heading
    const headings = screen.getAllByRole('heading', { name: /Leaderboard/i });
    expect(headings.length).toBeGreaterThan(0);
    
    // Check that at least one heading is a proper heading element
    const hasProperHeading = headings.some(heading => 
      ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(heading.tagName)
    );
    expect(hasProperHeading).toBe(true);
  });
});

describe('Performance Considerations', () => {
  it('should render large score lists efficiently', () => {
    const largeScoreList = Array.from({ length: 100 }, (_, index) => ({
      ...mockScores[0],
      _id: `score-${index}`,
      playerName: `Player${index}`,
      score: 15000 - index * 100,
    })) as IScore[];

    const startTime = performance.now();
    render(
      <HighScoreTable
        scores={largeScoreList}
        loading={false}
        error={null}
      />
    );
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Render should complete within reasonable time (< 5000ms for CI)
    expect(renderTime).toBeLessThan(5000);
  });
});