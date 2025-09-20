import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScoresPage from '../../app/scores/page';

// Mock the components
jest.mock('@/components', () => ({
  PageLayout: ({ children, title }: any) => (
    <div data-testid="page-layout" data-title={title}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/HighScoreTable', () => ({
  HighScoreTable: ({ scores, loading, error }: any) => (
    <div data-testid="high-score-table">
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {!loading && !error && (
        <div>
          Scores loaded: {scores.length}
          {scores.map((score: any, index: number) => (
            <div key={index} data-testid={`score-${index}`}>
              {score.playerName}: {score.score}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ScoresPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Page Structure', () => {
    it('renders PageLayout with correct title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(<ScoresPage />);

      expect(screen.getByTestId('page-layout')).toBeInTheDocument();
      expect(screen.getByTestId('page-layout')).toHaveAttribute('data-title', 'High Scores');
    });

    it('renders HighScoreTable component', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(<ScoresPage />);

      expect(screen.getByTestId('high-score-table')).toBeInTheDocument();
    });

    it('applies correct container classes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const { container } = render(<ScoresPage />);
      
      const mainContainer = container.querySelector('.flex-1.overflow-auto.p-6');
      expect(mainContainer).toBeInTheDocument();
      
      const innerContainer = container.querySelector('.max-w-4xl.mx-auto');
      expect(innerContainer).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ScoresPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('passes loading=true to HighScoreTable initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ScoresPage />);

      const table = screen.getByTestId('high-score-table');
      expect(table).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Successful Data Fetching', () => {
    const mockScores = [
      {
        _id: '1',
        playerName: 'Player1',
        score: 1500,
        timestamp: new Date('2024-01-01'),
        gameMetrics: {
          totalFood: 150,
          totalCombos: 15,
          longestCombo: 8,
          maxSpeedLevel: 5,
          gameTimeSeconds: 450,
          finalSnakeLength: 25,
        },
        comboStats: {
          totalComboPoints: 750,
          basePoints: 750,
          comboEfficiency: 60,
          averageComboLength: 3.0,
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        _id: '2',
        playerName: 'Player2',
        score: 1200,
        timestamp: new Date('2024-01-02'),
        gameMetrics: {
          totalFood: 120,
          totalCombos: 12,
          longestCombo: 6,
          maxSpeedLevel: 4,
          gameTimeSeconds: 360,
          finalSnakeLength: 22,
        },
        comboStats: {
          totalComboPoints: 600,
          basePoints: 600,
          comboEfficiency: 50,
          averageComboLength: 2.5,
        },
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    it('fetches scores on component mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockScores,
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/scores?limit=10&sortBy=score&order=desc', {
          headers: { 'Content-Type': 'application/json' },
          signal: expect.any(AbortSignal),
        });
      });
    });

    it('displays fetched scores', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockScores,
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Scores loaded: 2')).toBeInTheDocument();
        expect(screen.getByText('Player1: 1500')).toBeInTheDocument();
        expect(screen.getByText('Player2: 1200')).toBeInTheDocument();
      });
    });

    it('passes correct props to HighScoreTable after successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockScores,
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Scores loaded: 2')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      });
    });

    it('handles HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: Server error occurred')).toBeInTheDocument();
      });
    });

    it('handles API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          message: 'Database error',
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: Database error')).toBeInTheDocument();
      });
    });

    it('handles API error responses without message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: Server error occurred')).toBeInTheDocument();
      });
    });

    it('sets loading to false after error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      render(<ScoresPage />);

      // Initially loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // After error, loading should be false
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByText('Error: Test error')).toBeInTheDocument();
      });
    });
  });

  describe('API Request Configuration', () => {
    it('makes request with correct query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/scores?limit=10&sortBy=score&order=desc', {
          headers: { 'Content-Type': 'application/json' },
          signal: expect.any(AbortSignal),
        });
      });
    });

    it('makes only one request on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Component State Management', () => {
    it('initializes with correct default state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ScoresPage />);

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('resets error state when making new request', async () => {
      // First request fails
      mockFetch.mockRejectedValueOnce(new Error('First error'));

      const { rerender } = render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: First error')).toBeInTheDocument();
      });

      // Mock successful response for rerender
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      // Force re-render
      rerender(<ScoresPage />);

      // Should clear the error and show loading
      await waitFor(() => {
        expect(screen.queryByText('Error: First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty Data Handling', () => {
    it('handles empty scores array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: No high scores available yet')).toBeInTheDocument();
      });
    });

    it('handles null data response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: null,
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: No high scores available yet')).toBeInTheDocument();
      });
    });

    it('handles undefined data response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      render(<ScoresPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: No high scores available yet')).toBeInTheDocument();
      });
    });
  });
});