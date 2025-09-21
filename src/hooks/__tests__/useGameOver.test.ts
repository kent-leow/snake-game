import { renderHook, act } from '@testing-library/react';
import { useGameOver } from '../useGameOver';
import type { GameStatistics } from '../../lib/game/gameOverState';

describe('useGameOver', () => {
  const mockOnGameOver = jest.fn();
  const mockOnRestart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default game over state', () => {
      const { result } = renderHook(() => useGameOver());
      
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.gameOverState.isGameOver).toBe(false);
      expect(result.current.gameOverState.cause).toBeNull();
      expect(result.current.gameOverState.finalScore).toBe(0);
      expect(result.current.gameOverState.timestamp).toBe(0);
    });

    it('should provide trigger and reset functions', () => {
      const { result } = renderHook(() => useGameOver());
      
      expect(typeof result.current.triggerGameOver).toBe('function');
      expect(typeof result.current.resetGameOver).toBe('function');
    });
  });

  describe('Game Over Trigger', () => {
    it('should update state when triggering game over', () => {
      const { result } = renderHook(() => useGameOver());
      
      act(() => {
        result.current.triggerGameOver('boundary', 1000);
      });
      
      expect(result.current.isGameOver).toBe(true);
      expect(result.current.gameOverState.isGameOver).toBe(true);
      expect(result.current.gameOverState.cause).toBe('boundary');
      expect(result.current.gameOverState.finalScore).toBe(1000);
    });

    it('should trigger game over with collision position', () => {
      const { result } = renderHook(() => useGameOver());
      const collisionPosition = { x: 100, y: 200 };
      
      act(() => {
        result.current.triggerGameOver('self', 500, collisionPosition);
      });
      
      expect(result.current.gameOverState.collisionPosition).toEqual(collisionPosition);
    });

    it('should trigger game over with game statistics', () => {
      const { result } = renderHook(() => useGameOver());
      const gameStats: GameStatistics = {
        duration: 120,
        foodConsumed: 15,
        maxSnakeLength: 20,
        averageSpeed: 2.5,
      };
      
      act(() => {
        result.current.triggerGameOver('boundary', 1500, undefined, gameStats);
      });
      
      expect(result.current.gameOverState.gameStats).toEqual(gameStats);
    });

    it('should call onGameOver callback when provided', () => {
      const { result } = renderHook(() => 
        useGameOver({ onGameOver: mockOnGameOver })
      );
      
      act(() => {
        result.current.triggerGameOver('boundary', 1000);
      });
      
      expect(mockOnGameOver).toHaveBeenCalledTimes(1);
      expect(mockOnGameOver).toHaveBeenCalledWith(
        expect.objectContaining({
          isGameOver: true,
          cause: 'boundary',
          finalScore: 1000,
        })
      );
    });
  });

  describe('Game Over Reset', () => {
    it('should reset game over state', () => {
      const { result } = renderHook(() => useGameOver());
      
      // First trigger game over
      act(() => {
        result.current.triggerGameOver('self', 500);
      });
      
      expect(result.current.isGameOver).toBe(true);
      
      // Then reset
      act(() => {
        result.current.resetGameOver();
      });
      
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.gameOverState.isGameOver).toBe(false);
      expect(result.current.gameOverState.cause).toBeNull();
      expect(result.current.gameOverState.finalScore).toBe(0);
    });

    it('should call onRestart callback when provided', () => {
      const { result } = renderHook(() => 
        useGameOver({ onRestart: mockOnRestart })
      );
      
      act(() => {
        result.current.resetGameOver();
      });
      
      expect(mockOnRestart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callback Handling', () => {
    it('should handle both callbacks when provided', () => {
      const { result } = renderHook(() => 
        useGameOver({ 
          onGameOver: mockOnGameOver,
          onRestart: mockOnRestart 
        })
      );
      
      // Trigger game over
      act(() => {
        result.current.triggerGameOver('boundary', 1000);
      });
      
      expect(mockOnGameOver).toHaveBeenCalledTimes(1);
      
      // Reset game
      act(() => {
        result.current.resetGameOver();
      });
      
      expect(mockOnRestart).toHaveBeenCalledTimes(1);
    });

    it('should work without callbacks', () => {
      const { result } = renderHook(() => useGameOver());
      
      // Should not throw errors when no callbacks are provided
      act(() => {
        result.current.triggerGameOver('self', 100);
      });
      
      act(() => {
        result.current.resetGameOver();
      });
      
      expect(result.current.isGameOver).toBe(false);
    });

    it('should handle callback changes', () => {
      const initialCallback = jest.fn();
      const newCallback = jest.fn();
      
      const { result, rerender } = renderHook(
        ({ onGameOver }) => useGameOver({ onGameOver }),
        { initialProps: { onGameOver: initialCallback } }
      );
      
      // Trigger with initial callback
      act(() => {
        result.current.triggerGameOver('boundary', 100);
      });
      
      expect(initialCallback).toHaveBeenCalledTimes(1);
      expect(newCallback).not.toHaveBeenCalled();
      
      // Reset for next test
      act(() => {
        result.current.resetGameOver();
      });
      
      // Clear mock calls from reset
      initialCallback.mockClear();
      
      // Change callback
      rerender({ onGameOver: newCallback });
      
      // Trigger with new callback
      act(() => {
        result.current.triggerGameOver('self', 200);
      });
      
      expect(initialCallback).not.toHaveBeenCalled(); // Should not be called anymore
      expect(newCallback).toHaveBeenCalledTimes(1); // Now called once
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state across multiple operations', () => {
      const { result } = renderHook(() => useGameOver());
      
      // Initial state
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.gameOverState.isGameOver).toBe(false);
      
      // Trigger game over
      act(() => {
        result.current.triggerGameOver('boundary', 1000);
      });
      
      expect(result.current.isGameOver).toBe(true);
      expect(result.current.gameOverState.isGameOver).toBe(true);
      expect(result.current.gameOverState.cause).toBe('boundary');
      expect(result.current.gameOverState.finalScore).toBe(1000);
      
      // Reset
      act(() => {
        result.current.resetGameOver();
      });
      
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.gameOverState.isGameOver).toBe(false);
      expect(result.current.gameOverState.cause).toBeNull();
      expect(result.current.gameOverState.finalScore).toBe(0);
    });

    it('should handle rapid state changes correctly', () => {
      const { result } = renderHook(() => useGameOver());
      
      // Rapidly trigger and reset multiple times
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.triggerGameOver('self', i * 100);
        });
        
        expect(result.current.isGameOver).toBe(true);
        expect(result.current.gameOverState.finalScore).toBe(i * 100);
        
        act(() => {
          result.current.resetGameOver();
        });
        
        expect(result.current.isGameOver).toBe(false);
      }
    });
  });

  describe('Memory Management', () => {
    it('should clean up subscription on unmount', () => {
      const { result, unmount } = renderHook(() => useGameOver());
      
      // Trigger to ensure subscription is working
      act(() => {
        result.current.triggerGameOver('boundary', 100);
      });
      
      expect(result.current.isGameOver).toBe(true);
      
      // Unmount should clean up subscription
      unmount();
      
      // No way to directly test subscription cleanup, but this ensures
      // the component unmounts without errors
    });
  });

  describe('Edge Cases', () => {
    it('should handle triggering game over multiple times', () => {
      const { result } = renderHook(() => 
        useGameOver({ onGameOver: mockOnGameOver })
      );
      
      // Trigger multiple times
      act(() => {
        result.current.triggerGameOver('boundary', 100);
      });
      
      act(() => {
        result.current.triggerGameOver('self', 200);
      });
      
      // Should have the latest state
      expect(result.current.gameOverState.cause).toBe('self');
      expect(result.current.gameOverState.finalScore).toBe(200);
      
      // Callback should be called for each trigger
      expect(mockOnGameOver).toHaveBeenCalledTimes(2);
    });

    it('should handle resetting when not game over', () => {
      const { result } = renderHook(() => 
        useGameOver({ onRestart: mockOnRestart })
      );
      
      // Reset when not game over
      act(() => {
        result.current.resetGameOver();
      });
      
      expect(result.current.isGameOver).toBe(false);
      expect(mockOnRestart).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined callbacks gracefully', () => {
      const { result } = renderHook(() => useGameOver({}));
      
      // Should not throw errors
      act(() => {
        result.current.triggerGameOver('boundary', 100);
      });
      
      act(() => {
        result.current.resetGameOver();
      });
      
      expect(result.current.isGameOver).toBe(false);
    });
  });
});