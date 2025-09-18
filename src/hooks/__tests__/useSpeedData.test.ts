import { renderHook, act } from '@testing-library/react';
import { useSpeedData } from '../useSpeedData';
import type { GameEngine } from '@/lib/game/gameEngine';

// Mock the game engine and speed manager
const createMockSpeedManager = () => ({
  getSpeedState: jest.fn(() => ({
    speedLevel: 0,
    currentSpeed: 150,
    isTransitioning: false,
  })),
  getConfig: jest.fn(() => ({
    baseSpeed: 150,
  })),
  getSpeedProgress: jest.fn(() => 0),
  onSpeedChange: jest.fn((_callback: () => void) => () => {}), // Returns unsubscribe function
});

const createMockGameEngine = (speedManager = createMockSpeedManager()) => ({
  getSpeedManager: jest.fn(() => speedManager),
  isAtMaxSpeed: jest.fn(() => false),
} as unknown as GameEngine);

describe('useSpeedData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('returns default speed data when game engine is null', () => {
      const { result } = renderHook(() => useSpeedData(null));

      expect(result.current).toEqual({
        speedLevel: 0,
        currentSpeed: 150,
        baseSpeed: 150,
        isTransitioning: false,
        isAtMaxSpeed: false,
        speedProgress: 0,
      });
    });

    it('returns speed data from game engine when available', () => {
      const mockSpeedManager = createMockSpeedManager();
      mockSpeedManager.getSpeedState.mockReturnValue({
        speedLevel: 3,
        currentSpeed: 105,
        isTransitioning: true,
      });
      mockSpeedManager.getConfig.mockReturnValue({
        baseSpeed: 150,
      });
      mockSpeedManager.getSpeedProgress.mockReturnValue(0.3);

      const mockGameEngine = createMockGameEngine(mockSpeedManager);
      mockGameEngine.isAtMaxSpeed = jest.fn(() => true);

      const { result } = renderHook(() => useSpeedData(mockGameEngine));

      expect(result.current).toEqual({
        speedLevel: 3,
        currentSpeed: 105,
        baseSpeed: 150,
        isTransitioning: true,
        isAtMaxSpeed: true,
        speedProgress: 0.3,
      });
    });
  });

  describe('Data Updates', () => {
    it('updates data when speed changes', () => {
      const mockSpeedManager = createMockSpeedManager();
      let speedChangeCallback: (() => void) | null = null;

      // Mock onSpeedChange to capture the callback
      mockSpeedManager.onSpeedChange.mockImplementation((callback: () => void) => {
        speedChangeCallback = callback;
        return () => {}; // Unsubscribe function
      });

      const mockGameEngine = createMockGameEngine(mockSpeedManager);

      const { result } = renderHook(() => useSpeedData(mockGameEngine));

      // Initial state
      expect(result.current.speedLevel).toBe(0);

      // Simulate speed change
      mockSpeedManager.getSpeedState.mockReturnValue({
        speedLevel: 1,
        currentSpeed: 135,
        isTransitioning: false,
      });

      act(() => {
        if (speedChangeCallback) {
          speedChangeCallback();
        }
      });

      expect(result.current.speedLevel).toBe(1);
      expect(result.current.currentSpeed).toBe(135);
    });

    it('subscribes to speed change events on mount', () => {
      const mockSpeedManager = createMockSpeedManager();
      const mockGameEngine = createMockGameEngine(mockSpeedManager);

      renderHook(() => useSpeedData(mockGameEngine));

      expect(mockSpeedManager.onSpeedChange).toHaveBeenCalledTimes(1);
      expect(mockSpeedManager.onSpeedChange).toHaveBeenCalledWith(expect.any(Function));
    });

    it('unsubscribes from speed change events on unmount', () => {
      const mockSpeedManager = createMockSpeedManager();
      const unsubscribeMock = jest.fn();
      mockSpeedManager.onSpeedChange.mockReturnValue(unsubscribeMock);

      const mockGameEngine = createMockGameEngine(mockSpeedManager);

      const { unmount } = renderHook(() => useSpeedData(mockGameEngine));

      unmount();

      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('handles errors in speed manager gracefully', () => {
      const mockSpeedManager = createMockSpeedManager();
      mockSpeedManager.getSpeedState.mockImplementation(() => {
        throw new Error('Speed manager error');
      });

      const mockGameEngine = createMockGameEngine(mockSpeedManager);

      // Mock console.warn to avoid cluttering test output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useSpeedData(mockGameEngine));

      // Should return default values when error occurs
      expect(result.current).toEqual({
        speedLevel: 0,
        currentSpeed: 150,
        baseSpeed: 150,
        isTransitioning: false,
        isAtMaxSpeed: false,
        speedProgress: 0,
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to update speed data:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('handles missing game engine methods gracefully', () => {
      const mockGameEngine = {
        getSpeedManager: jest.fn(() => {
          throw new Error('Method not available');
        }),
      } as unknown as GameEngine;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useSpeedData(mockGameEngine));

      expect(result.current).toEqual({
        speedLevel: 0,
        currentSpeed: 150,
        baseSpeed: 150,
        isTransitioning: false,
        isAtMaxSpeed: false,
        speedProgress: 0,
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('updates data at regular intervals as fallback', () => {
      const mockSpeedManager = createMockSpeedManager();
      const mockGameEngine = createMockGameEngine(mockSpeedManager);

      renderHook(() => useSpeedData(mockGameEngine));

      // Initial call on mount
      expect(mockSpeedManager.getSpeedState).toHaveBeenCalledTimes(1);

      // Fast forward timer
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should be called again due to interval
      expect(mockSpeedManager.getSpeedState).toHaveBeenCalledTimes(2);
    });

    it('clears interval on unmount', () => {
      const mockSpeedManager = createMockSpeedManager();
      const mockGameEngine = createMockGameEngine(mockSpeedManager);

      const { unmount } = renderHook(() => useSpeedData(mockGameEngine));

      unmount();

      // Should not have any pending timers
      expect(jest.getTimerCount()).toBe(0);
    });

    it('does not create multiple intervals when game engine changes', () => {
      const mockSpeedManager1 = createMockSpeedManager();
      const mockGameEngine1 = createMockGameEngine(mockSpeedManager1);

      const mockSpeedManager2 = createMockSpeedManager();
      const mockGameEngine2 = createMockGameEngine(mockSpeedManager2);

      const { rerender } = renderHook(
        ({ gameEngine }: { gameEngine: GameEngine | null }) => useSpeedData(gameEngine),
        { initialProps: { gameEngine: mockGameEngine1 } }
      );

      // Check initial timer count
      const initialTimerCount = jest.getTimerCount();

      rerender({ gameEngine: mockGameEngine2 });

      // Should not have additional timers
      expect(jest.getTimerCount()).toBe(initialTimerCount);
    });
  });

  describe('Game Engine Changes', () => {
    it('updates subscription when game engine changes', () => {
      const mockSpeedManager1 = createMockSpeedManager();
      const unsubscribe1 = jest.fn();
      mockSpeedManager1.onSpeedChange.mockReturnValue(unsubscribe1);
      const mockGameEngine1 = createMockGameEngine(mockSpeedManager1);

      const mockSpeedManager2 = createMockSpeedManager();
      const unsubscribe2 = jest.fn();
      mockSpeedManager2.onSpeedChange.mockReturnValue(unsubscribe2);
      const mockGameEngine2 = createMockGameEngine(mockSpeedManager2);

      const { rerender } = renderHook(
        ({ gameEngine }: { gameEngine: GameEngine | null }) => useSpeedData(gameEngine),
        { initialProps: { gameEngine: mockGameEngine1 } }
      );

      expect(mockSpeedManager1.onSpeedChange).toHaveBeenCalledTimes(1);

      rerender({ gameEngine: mockGameEngine2 });

      expect(unsubscribe1).toHaveBeenCalledTimes(1);
      expect(mockSpeedManager2.onSpeedChange).toHaveBeenCalledTimes(1);
    });

    it('handles transition from null to valid game engine', () => {
      const { result, rerender } = renderHook(
        ({ gameEngine }: { gameEngine: GameEngine | null }) => useSpeedData(gameEngine),
        { initialProps: { gameEngine: null } }
      );

      // Initial state with null engine
      expect(result.current.speedLevel).toBe(0);

      const mockSpeedManager = createMockSpeedManager();
      mockSpeedManager.getSpeedState.mockReturnValue({
        speedLevel: 2,
        currentSpeed: 120,
        isTransitioning: false,
      });

      const mockGameEngine = createMockGameEngine(mockSpeedManager);

      rerender({ gameEngine: mockGameEngine });

      expect(result.current.speedLevel).toBe(2);
      expect(result.current.currentSpeed).toBe(120);
    });

    it('handles transition from valid game engine to null', () => {
      const mockSpeedManager = createMockSpeedManager();
      const unsubscribe = jest.fn();
      mockSpeedManager.onSpeedChange.mockReturnValue(unsubscribe);
      const mockGameEngine = createMockGameEngine(mockSpeedManager);

      const { result, rerender } = renderHook(
        ({ gameEngine }: { gameEngine: GameEngine | null }) => useSpeedData(gameEngine),
        { initialProps: { gameEngine: mockGameEngine } }
      );

      rerender({ gameEngine: null });

      expect(unsubscribe).toHaveBeenCalledTimes(1);
      // Should still have speed data (last known state)
      expect(result.current).toBeDefined();
    });
  });
});