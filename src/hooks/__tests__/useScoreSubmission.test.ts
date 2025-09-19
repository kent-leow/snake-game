/**
 * Unit tests for useScoreSubmission hook
 * Tests score submission logic, online/offline behavior, and sync functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useScoreSubmission } from '@/hooks/useScoreSubmission';
import { ScoreService } from '@/services/ScoreService';
import type { ScoreSubmissionData } from '@/services/ScoreService';

// Mock ScoreService
jest.mock('@/services/ScoreService');
const MockedScoreService = ScoreService as jest.MockedClass<typeof ScoreService>;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window event listeners
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

describe('useScoreSubmission', () => {
  let mockScoreService: jest.Mocked<ScoreService>;
  let mockScoreData: ScoreSubmissionData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock ScoreService instance
    mockScoreService = {
      submitScore: jest.fn(),
      syncPendingScores: jest.fn(),
      clearPendingScores: jest.fn(),
      getPendingScoreCount: jest.fn(),
      isOnline: jest.fn(),
      getPendingScoresForDisplay: jest.fn(),
      getPlayerBestScores: jest.fn(),
    } as any;
    
    MockedScoreService.mockImplementation(() => mockScoreService);
    
    // Setup mock score data
    mockScoreData = {
      playerName: 'TestPlayer',
      score: 1000,
      gameMetrics: {
        totalFood: 50,
        totalCombos: 10,
        longestCombo: 5,
        maxSpeedLevel: 3,
        gameTimeSeconds: 120,
        finalSnakeLength: 20,
      },
      comboStats: {
        totalComboPoints: 500,
        basePoints: 500,
        comboEfficiency: 0.8,
        averageComboLength: 4.5,
      },
    };

    // Default mocks
    mockScoreService.getPendingScoreCount.mockReturnValue(0);
    mockScoreService.isOnline.mockReturnValue(true);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useScoreSubmission());

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastResult).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isOnline).toBe(true);
    expect(result.current.pendingCount).toBe(0);
  });

  it('should submit score successfully', async () => {
    const mockResult = {
      success: true,
      saved: 'online' as const,
      scoreId: 'test-id',
    };
    mockScoreService.submitScore.mockResolvedValue(mockResult);
    mockScoreService.getPendingScoreCount.mockReturnValue(0);

    const onSuccess = jest.fn();
    const { result } = renderHook(() => useScoreSubmission({ onSuccess }));

    await act(async () => {
      const submissionResult = await result.current.submitScore(mockScoreData);
      expect(submissionResult).toEqual(mockResult);
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.lastResult).toEqual(mockResult);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(mockResult);
    expect(mockScoreService.submitScore).toHaveBeenCalledWith(mockScoreData);
  });

  it('should handle submission errors', async () => {
    const mockError = new Error('Submission failed');
    mockScoreService.submitScore.mockRejectedValue(mockError);

    const onError = jest.fn();
    const { result } = renderHook(() => useScoreSubmission({ onError }));

    await act(async () => {
      const submissionResult = await result.current.submitScore(mockScoreData);
      expect(submissionResult.success).toBe(false);
      expect(submissionResult.saved).toBe('failed');
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe('Submission failed');
    expect(onError).toHaveBeenCalledWith('Submission failed');
  });

  it('should handle service errors gracefully', async () => {
    const mockResult = {
      success: false,
      saved: 'failed' as const,
      error: 'Service error',
    };
    mockScoreService.submitScore.mockResolvedValue(mockResult);

    const onError = jest.fn();
    const { result } = renderHook(() => useScoreSubmission({ onError }));

    await act(async () => {
      await result.current.submitScore(mockScoreData);
    });

    expect(result.current.error).toBe('Service error');
    expect(onError).toHaveBeenCalledWith('Service error');
  });

  it('should sync pending scores', async () => {
    mockScoreService.syncPendingScores.mockResolvedValue();
    mockScoreService.getPendingScoreCount
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(0);

    const { result } = renderHook(() => useScoreSubmission());

    await act(async () => {
      await result.current.syncPendingScores();
    });

    expect(result.current.isSyncing).toBe(false);
    expect(mockScoreService.syncPendingScores).toHaveBeenCalled();
  });

  it('should handle sync errors', async () => {
    const mockError = new Error('Sync failed');
    mockScoreService.syncPendingScores.mockRejectedValue(mockError);

    const { result } = renderHook(() => useScoreSubmission());

    await act(async () => {
      await result.current.syncPendingScores();
    });

    expect(result.current.error).toBe('Sync failed');
    expect(result.current.isSyncing).toBe(false);
  });

  it('should not sync when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    const { result } = renderHook(() => useScoreSubmission());

    await act(async () => {
      await result.current.syncPendingScores();
    });

    expect(mockScoreService.syncPendingScores).not.toHaveBeenCalled();
  });

  it('should not sync when already syncing', async () => {
    mockScoreService.syncPendingScores.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    const { result } = renderHook(() => useScoreSubmission());

    await act(async () => {
      // Start first sync
      const firstSync = result.current.syncPendingScores();
      
      // Try to start second sync immediately
      await result.current.syncPendingScores();
      
      // Wait for first sync to complete
      await firstSync;
    });

    // Should only be called once
    expect(mockScoreService.syncPendingScores).toHaveBeenCalledTimes(1);
  });

  it('should clear pending scores', () => {
    mockScoreService.clearPendingScores.mockImplementation(() => {});
    mockScoreService.getPendingScoreCount
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(0);

    const { result } = renderHook(() => useScoreSubmission());

    act(() => {
      result.current.clearPendingScores();
    });

    expect(mockScoreService.clearPendingScores).toHaveBeenCalled();
  });

  it('should handle online/offline events', () => {
    const { unmount } = renderHook(() => useScoreSubmission({ autoSync: true }));

    // Check event listeners were added
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    // Check event listeners were removed
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should auto-sync when coming back online', async () => {
    mockScoreService.syncPendingScores.mockResolvedValue();
    
    renderHook(() => useScoreSubmission({ autoSync: true }));

    // Simulate coming back online
    const onlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'online'
    )?.[1];

    expect(onlineHandler).toBeDefined();

    await act(async () => {
      if (onlineHandler) {
        await onlineHandler();
      }
    });

    expect(mockScoreService.syncPendingScores).toHaveBeenCalled();
  });

  it('should setup periodic sync when autoSync is enabled', () => {
    jest.useFakeTimers();
    mockScoreService.getPendingScoreCount.mockReturnValue(2);
    mockScoreService.syncPendingScores.mockResolvedValue();

    const { unmount } = renderHook(() => 
      useScoreSubmission({ autoSync: true, syncInterval: 1000 })
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockScoreService.syncPendingScores).toHaveBeenCalled();

    unmount();
    jest.useRealTimers();
  });

  it('should not setup periodic sync when autoSync is disabled', () => {
    jest.useFakeTimers();
    mockScoreService.syncPendingScores.mockResolvedValue();

    const { unmount } = renderHook(() => 
      useScoreSubmission({ autoSync: false })
    );

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockScoreService.syncPendingScores).not.toHaveBeenCalled();

    unmount();
    jest.useRealTimers();
  });

  it('should auto-sync on mount when enabled and online', async () => {
    mockScoreService.syncPendingScores.mockResolvedValue();

    await act(async () => {
      renderHook(() => useScoreSubmission({ autoSync: true }));
    });

    expect(mockScoreService.syncPendingScores).toHaveBeenCalled();
  });

  it('should not auto-sync on mount when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    mockScoreService.isOnline.mockReturnValue(false);
    mockScoreService.syncPendingScores.mockResolvedValue();

    await act(async () => {
      renderHook(() => useScoreSubmission({ autoSync: true }));
    });

    expect(mockScoreService.syncPendingScores).not.toHaveBeenCalled();
  });
});