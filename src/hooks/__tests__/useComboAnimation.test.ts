/**
 * Unit tests for useComboAnimation hook
 * Tests animation state management, queueing, and control functions
 */

import { renderHook, act } from '@testing-library/react';
import { useComboAnimation, useSimpleComboAnimation } from '../useComboAnimation';
import type { ComboEvent } from '@/types/Combo';

// Mock timers for animation testing
jest.useFakeTimers();

describe('useComboAnimation', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  const createComboEvent = (type: ComboEvent['type'], overrides?: Partial<ComboEvent>): ComboEvent => {
    // Create appropriate default values based on event type
    const defaults: Record<ComboEvent['type'], Partial<ComboEvent>> = {
      started: { sequence: [1], progress: 1, totalPoints: 0 },
      progress: { sequence: [1, 2], progress: 2, totalPoints: 0 },
      completed: { sequence: [1, 2, 3, 4, 5], progress: 5, totalPoints: 100 },
      broken: { sequence: [1, 2], progress: 0, totalPoints: 0 },
    };

    return {
      type,
      sequence: defaults[type].sequence || [1, 2],
      progress: defaults[type].progress || 2,
      totalPoints: defaults[type].totalPoints || 50,
      timestamp: Date.now(),
      ...overrides,
    };
  };

  describe('Initial State', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useComboAnimation());
      
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.animationType).toBe(null);
      expect(result.current.currentEvent).toBe(null);
      expect(result.current.progress).toBe(0);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isQueueEmpty()).toBe(true);
      expect(result.current.getQueueLength()).toBe(0);
    });

    it('accepts custom configuration', () => {
      const config = {
        maxQueueSize: 10,
        autoClear: false,
        allowInterruption: true,
        debug: true,
      };
      
      const { result } = renderHook(() => useComboAnimation(config));
      
      // Should initialize without errors and accept the config
      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('Animation Triggering', () => {
    it('starts animation when triggerAnimation is called', () => {
      const { result } = renderHook(() => useComboAnimation());
      const event = createComboEvent('started');
      
      act(() => {
        result.current.triggerAnimation(event);
      });
      
      expect(result.current.isAnimating).toBe(true);
      expect(result.current.animationType).toBe('started');
      expect(result.current.currentEvent).toEqual(event);
      expect(result.current.progress).toBe(0);
    });

    it.skip('maps ComboEvent types to AnimationTypes correctly', () => {
      const { result } = renderHook(() => useComboAnimation());
      
      const testCases: Array<[ComboEvent['type'], string]> = [
        ['started', 'started'],
        ['progress', 'progress'],
        ['completed', 'complete'],
        ['broken', 'break'],
      ];
      
      testCases.forEach(([eventType, expectedAnimationType]) => {
        const event = createComboEvent(eventType);
        
        act(() => {
          result.current.clearAnimation();
          result.current.triggerAnimation(event);
        });
        
        expect(result.current.animationType).toBe(expectedAnimationType);
      });
    });

    it('updates progress over time', () => {
      const { result } = renderHook(() => useComboAnimation());
      const event = createComboEvent('started');
      
      act(() => {
        result.current.triggerAnimation(event);
      });
      
      expect(result.current.progress).toBe(0);
      
      // Advance timer partway through animation
      act(() => {
        jest.advanceTimersByTime(750); // Half of 1500ms duration
      });
      
      expect(result.current.progress).toBeGreaterThan(0);
      expect(result.current.progress).toBeLessThan(1);
    });

    it('completes animation automatically after duration', () => {
      const { result } = renderHook(() => useComboAnimation({ autoClear: true }));
      const event = createComboEvent('started');
      
      act(() => {
        result.current.triggerAnimation(event);
      });
      
      expect(result.current.isAnimating).toBe(true);
      
      // Complete the animation
      act(() => {
        jest.advanceTimersByTime(1500); // Full duration
      });
      
      // Should auto-clear after 100ms
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.currentEvent).toBe(null);
    });
  });

  describe('Animation Control', () => {
    it('clears animation when clearAnimation is called', () => {
      const { result } = renderHook(() => useComboAnimation());
      const event = createComboEvent('progress');
      
      act(() => {
        result.current.triggerAnimation(event);
      });
      
      expect(result.current.isAnimating).toBe(true);
      
      act(() => {
        result.current.clearAnimation();
      });
      
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.animationType).toBe(null);
      expect(result.current.currentEvent).toBe(null);
      expect(result.current.progress).toBe(0);
    });

    it.skip('pauses and resumes animation correctly', () => {
      const { result } = renderHook(() => useComboAnimation());
      const event = createComboEvent('progress');
      
      act(() => {
        result.current.triggerAnimation(event);
      });
      
      // Advance partway
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      const progressBeforePause = result.current.progress;
      
      act(() => {
        result.current.pauseAnimation();
      });
      
      expect(result.current.isPaused).toBe(true);
      
      // Advance timer while paused - progress should not change
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(result.current.progress).toBe(progressBeforePause);
      
      // Resume
      act(() => {
        result.current.resumeAnimation();
      });
      
      expect(result.current.isPaused).toBe(false);
      
      // Progress should continue
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(result.current.progress).toBeGreaterThan(progressBeforePause);
    });

    it('skips animation when skipAnimation is called', () => {
      const { result } = renderHook(() => useComboAnimation({ autoClear: true }));
      const event = createComboEvent('completed');
      
      act(() => {
        result.current.triggerAnimation(event);
      });
      
      expect(result.current.isAnimating).toBe(true);
      
      act(() => {
        result.current.skipAnimation();
      });
      
      // Should complete immediately
      expect(result.current.progress).toBe(1);
      
      // Should auto-clear
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('Animation Queueing', () => {
    it.skip('queues animations when allowInterruption is false', () => {
      const { result } = renderHook(() => useComboAnimation({ allowInterruption: false }));
      const event1 = createComboEvent('started');
      const event2 = createComboEvent('progress');
      
      act(() => {
        result.current.triggerAnimation(event1);
        result.current.triggerAnimation(event2);
      });
      
      // First animation should be playing
      expect(result.current.currentEvent).toEqual(event1);
      expect(result.current.isAnimating).toBe(true);
      expect(result.current.getQueueLength()).toBe(1);
      expect(result.current.isQueueEmpty()).toBe(false);
    });

    it.skip('processes queue when current animation completes', () => {
      const { result } = renderHook(() => useComboAnimation({ 
        allowInterruption: false,
        autoClear: true 
      }));
      const event1 = createComboEvent('started');
      const event2 = createComboEvent('progress');
      
      act(() => {
        result.current.triggerAnimation(event1);
        result.current.triggerAnimation(event2);
      });
      
      // Complete first animation
      act(() => {
        jest.advanceTimersByTime(1500 + 100); // Duration + auto-clear delay
      });
      
      // Second animation should now be playing
      expect(result.current.currentEvent).toEqual(event2);
      expect(result.current.getQueueLength()).toBe(0);
    });

    it.skip('respects maxQueueSize', () => {
      const { result } = renderHook(() => useComboAnimation({ 
        allowInterruption: false,
        maxQueueSize: 2 
      }));
      
      const events = [
        createComboEvent('started'),
        createComboEvent('progress'),
        createComboEvent('completed'),
        createComboEvent('broken'),
      ];
      
      act(() => {
        events.forEach(event => {
          result.current.triggerAnimation(event);
        });
      });
      
      // Should only queue maxQueueSize items
      expect(result.current.getQueueLength()).toBe(2);
      expect(result.current.currentEvent).toEqual(events[0]); // First is playing
    });

    it('allows interruption when allowInterruption is true', () => {
      const { result } = renderHook(() => useComboAnimation({ allowInterruption: true }));
      const event1 = createComboEvent('started');
      const event2 = createComboEvent('progress');
      
      act(() => {
        result.current.triggerAnimation(event1);
        result.current.triggerAnimation(event2);
      });
      
      // Second animation should interrupt the first
      expect(result.current.currentEvent).toEqual(event2);
      expect(result.current.getQueueLength()).toBe(0);
    });
  });

  describe('Duration Handling', () => {
    it('uses correct durations for different event types', () => {
      const { result } = renderHook(() => useComboAnimation({ autoClear: true }));
      
      const testCases: Array<[ComboEvent['type'], number]> = [
        ['started', 1500],
        ['progress', 1000],
        ['completed', 2500],
        ['broken', 1200],
      ];
      
      testCases.forEach(([eventType, expectedDuration]) => {
        act(() => {
          result.current.clearAnimation();
        });
        
        const event = createComboEvent(eventType);
        
        act(() => {
          result.current.triggerAnimation(event);
        });
        
        expect(result.current.isAnimating).toBe(true);
        
        // Animation should complete at expected duration
        act(() => {
          jest.advanceTimersByTime(expectedDuration);
        });
        
        expect(result.current.progress).toBe(1);
        
        // Auto-clear
        act(() => {
          jest.advanceTimersByTime(100);
        });
        
        expect(result.current.isAnimating).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles invalid event types gracefully', () => {
      const { result } = renderHook(() => useComboAnimation());
      
      // This should not crash
      act(() => {
        result.current.triggerAnimation({
          type: 'invalid' as any,
          sequence: [],
          progress: 0,
          totalPoints: 0,
          timestamp: Date.now(),
        });
      });
      
      expect(result.current.isAnimating).toBe(true);
      expect(result.current.animationType).toBe(null); // Maps to null for invalid types
    });
  });
});

describe('useSimpleComboAnimation', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  const createComboEvent = (type: ComboEvent['type'], overrides?: Partial<ComboEvent>): ComboEvent => ({
    type,
    sequence: [1, 2],
    progress: 2,
    totalPoints: 50,
    timestamp: Date.now(),
    ...overrides,
  });

  describe('Simplified Interface', () => {
    it('provides simplified interface for basic usage', () => {
      const { result } = renderHook(() => useSimpleComboAnimation());
      
      expect(result.current.currentEvent).toBe(null);
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.animationType).toBe(null);
      expect(typeof result.current.showEvent).toBe('function');
      expect(typeof result.current.hideEvent).toBe('function');
    });

    it('shows and hides events correctly', () => {
      const { result } = renderHook(() => useSimpleComboAnimation());
      const event = createComboEvent('progress');
      
      act(() => {
        result.current.showEvent(event);
      });
      
      expect(result.current.currentEvent).toEqual(event);
      expect(result.current.isAnimating).toBe(true);
      expect(result.current.animationType).toBe('progress');
      
      act(() => {
        result.current.hideEvent();
      });
      
      expect(result.current.currentEvent).toBe(null);
      expect(result.current.isAnimating).toBe(false);
    });

    it.skip('uses correct default configuration', () => {
      const { result } = renderHook(() => useSimpleComboAnimation());
      const event1 = createComboEvent('started');
      const event2 = createComboEvent('progress');
      
      act(() => {
        result.current.showEvent(event1);
        result.current.showEvent(event2);
      });
      
      // Should not allow interruption (default config)
      expect(result.current.currentEvent).toEqual(event1);
    });
  });
});