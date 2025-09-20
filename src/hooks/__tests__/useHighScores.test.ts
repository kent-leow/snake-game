import { renderHook, waitFor } from '@testing-library/react';
import { useHighScores, usePlayerScores, ERROR_MESSAGES } from '@/hooks/useHighScores';
import { IScore } from '@/types/Database';

// Mock fetch and Response globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Response constructor for Jest environment
global.Response = class Response {
  ok: boolean;
  status: number;
  statusText: string;
  private body: string;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.body = body as string || '';
    this.status = init?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = init?.statusText || 'OK';
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
} as any;

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock score data used across tests - simulating JSON API response with string dates
const mockScoreData: IScore[] = [
  {
    _id: '1',
    playerName: 'Player1',
    score: 1000,
    timestamp: '2023-01-01T00:00:00.000Z',
    gameMetrics: {
      gameTimeSeconds: 300,
      totalFood: 50,
      longestCombo: 10,
      totalCombos: 25,
      maxSpeedLevel: 5,
      finalSnakeLength: 60,
    },
    comboStats: {
      basePoints: 500,
      totalComboPoints: 500,
      comboEfficiency: 85.5,
      averageComboLength: 3.2,
    },
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  } as unknown as IScore,
  {
    _id: '2',
    playerName: 'Player2',
    score: 800,
    timestamp: '2023-01-02T00:00:00.000Z',
    gameMetrics: {
      gameTimeSeconds: 250,
      totalFood: 40,
      longestCombo: 8,
      totalCombos: 20,
      maxSpeedLevel: 4,
      finalSnakeLength: 50,
    },
    comboStats: {
      basePoints: 400,
      totalComboPoints: 400,
      comboEfficiency: 75.0,
      averageComboLength: 2.8,
    },
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  } as unknown as IScore,
];

describe('useHighScores Hook', () => {
  beforeEach(() => {
    // Complete reset of all mocks
    jest.resetAllMocks();
    mockFetch.mockClear();
    mockConsoleError.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    // Ensure complete cleanup
    jest.resetAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return initial state correctly', () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: mockScoreData }), {
          status: 200,
        })
      );

      const { result } = renderHook(() => useHighScores({ autoFetch: false }));

      expect(result.current.scores).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should fetch scores successfully', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: mockScoreData }), {
          status: 200,
        })
      );

      const { result } = renderHook(() => useHighScores());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.scores).toEqual(mockScoreData);
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/scores?limit=10&sortBy=score&order=desc',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle empty scores with appropriate message', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
        })
      );

      const { result } = renderHook(() => useHighScores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.scores).toEqual([]);
      expect(result.current.error).toBe(ERROR_MESSAGES.NO_DATA);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const { result } = renderHook(() => useHighScores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.scores).toEqual([]);
      expect(result.current.error).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    });

    it('should handle server errors (500)', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Internal Server Error' }), {
          status: 500,
        })
      );

      const { result } = renderHook(() => useHighScores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.scores).toEqual([]);
      expect(result.current.error).toBe(ERROR_MESSAGES.SERVER_ERROR);
    });

    it('should handle API errors (success: false)', async () => {
      const errorMessage = 'Database connection failed';
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false, error: errorMessage }), {
          status: 200,
        })
      );

      const { result } = renderHook(() => useHighScores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.scores).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle timeout errors', async () => {
      // Mock fetch to throw AbortError after a delay
      const mockAbortError = new Error('The operation was aborted');
      mockAbortError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(mockAbortError);

      const { result } = renderHook(() => useHighScores({ timeout: 1000 }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(ERROR_MESSAGES.TIMEOUT);
    });
  });

  describe('Configuration Options', () => {
    it('should use custom options correctly', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: mockScoreData }), {
          status: 200,
        })
      );

      const { result } = renderHook(() =>
        useHighScores({
          limit: 5,
          sortBy: 'timestamp',
          order: 'asc',
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/scores?limit=5&sortBy=timestamp&order=asc',
        expect.any(Object)
      );
    });

    it('should not auto-fetch when autoFetch is false', () => {
      const { result } = renderHook(() => useHighScores({ autoFetch: false }));

      expect(result.current.loading).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch data when refetch is called', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true, data: mockScoreData }), {
            status: 200,
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true, data: [mockScoreData[0]] }), {
            status: 200,
          })
        );

      const { result } = renderHook(() => useHighScores());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.scores).toHaveLength(2);

      // Call refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.scores).toHaveLength(1);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('usePlayerScores Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockConsoleError.mockClear();
    jest.clearAllMocks();
  });

  const playerName = 'TestPlayer';
  const playerScoreData: IScore[] = [mockScoreData[0]];

  it('should fetch player scores successfully', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: playerScoreData }), {
        status: 200,
      })
    );

    const { result } = renderHook(() => usePlayerScores(playerName));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.scores).toEqual(playerScoreData);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/scores/player/${encodeURIComponent(playerName)}?limit=10`,
      expect.any(Object)
    );
  });

  it('should handle empty player name', async () => {
    const { result } = renderHook(() => usePlayerScores(''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.scores).toEqual([]);
    expect(result.current.error).toBe('Player name is required');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle no scores for player', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
      })
    );

    const { result } = renderHook(() => usePlayerScores(playerName));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.scores).toEqual([]);
    expect(result.current.error).toBe(`No scores found for player "${playerName}"`);
  });

  it('should not fetch when autoFetch is false', () => {
    const { result } = renderHook(() => usePlayerScores(playerName, { autoFetch: false }));

    expect(result.current.loading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle player score fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    const { result } = renderHook(() => usePlayerScores(playerName));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    expect(result.current.scores).toEqual([]);
  });
});

describe('Error Messages', () => {
  it('should have all required error messages defined', () => {
    expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
    expect(ERROR_MESSAGES.SERVER_ERROR).toBeDefined();
    expect(ERROR_MESSAGES.NO_DATA).toBeDefined();
    expect(ERROR_MESSAGES.TIMEOUT).toBeDefined();
  });

  it('should provide user-friendly error messages', () => {
    expect(ERROR_MESSAGES.NETWORK_ERROR).toContain('Unable to connect');
    expect(ERROR_MESSAGES.SERVER_ERROR).toContain('Server error');
    expect(ERROR_MESSAGES.NO_DATA).toContain('No high scores');
    expect(ERROR_MESSAGES.TIMEOUT).toContain('timed out');
  });
});