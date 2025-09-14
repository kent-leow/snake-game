import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../useMediaQuery';

// Mock window.innerWidth and resize events
const mockResizeEvent = (): void => {
  window.dispatchEvent(new Event('resize'));
};

const setWindowWidth = (width: number): void => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('useMediaQuery', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Reset to a default width
    setWindowWidth(1200);
  });

  afterEach(() => {
    // Restore original width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('Initial State', () => {
    it('returns correct initial state for desktop width', () => {
      setWindowWidth(1200);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
    });

    it('returns correct initial state for tablet width', () => {
      setWindowWidth(900);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      });
    });

    it('returns correct initial state for mobile width', () => {
      setWindowWidth(500);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });
  });

  describe('Breakpoint Boundaries', () => {
    it('correctly handles mobile breakpoint boundary (768px)', () => {
      setWindowWidth(768);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });

    it('correctly handles tablet lower boundary (769px)', () => {
      setWindowWidth(769);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      });
    });

    it('correctly handles tablet upper boundary (1024px)', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      });
    });

    it('correctly handles desktop boundary (1025px)', () => {
      setWindowWidth(1025);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
    });
  });

  describe('Resize Event Handling', () => {
    it('updates state when window is resized from desktop to mobile', () => {
      setWindowWidth(1200);
      const { result } = renderHook(() => useMediaQuery());

      // Initial desktop state
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isMobile).toBe(false);

      // Resize to mobile
      act(() => {
        setWindowWidth(500);
        mockResizeEvent();
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('updates state when window is resized from mobile to tablet', () => {
      setWindowWidth(500);
      const { result } = renderHook(() => useMediaQuery());

      // Initial mobile state
      expect(result.current.isMobile).toBe(true);

      // Resize to tablet
      act(() => {
        setWindowWidth(900);
        mockResizeEvent();
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
    });

    it('updates state when window is resized from tablet to desktop', () => {
      setWindowWidth(900);
      const { result } = renderHook(() => useMediaQuery());

      // Initial tablet state
      expect(result.current.isTablet).toBe(true);

      // Resize to desktop
      act(() => {
        setWindowWidth(1200);
        mockResizeEvent();
      });

      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });

    it('handles multiple resize events correctly', () => {
      setWindowWidth(1200);
      const { result } = renderHook(() => useMediaQuery());

      // Desktop → Mobile
      act(() => {
        setWindowWidth(400);
        mockResizeEvent();
      });
      expect(result.current.isMobile).toBe(true);

      // Mobile → Tablet
      act(() => {
        setWindowWidth(800);
        mockResizeEvent();
      });
      expect(result.current.isTablet).toBe(true);

      // Tablet → Desktop
      act(() => {
        setWindowWidth(1400);
        mockResizeEvent();
      });
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles very small widths correctly', () => {
      setWindowWidth(100);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });

    it('handles very large widths correctly', () => {
      setWindowWidth(5000);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
    });

    it('handles zero width correctly', () => {
      setWindowWidth(0);
      const { result } = renderHook(() => useMediaQuery());

      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });
  });

  describe('Event Listener Cleanup', () => {
    it('removes event listener on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useMediaQuery());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('does not cause memory leaks with multiple mounts/unmounts', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      // Mount and unmount multiple times
      for (let i = 0; i < 3; i++) {
        const { unmount } = renderHook(() => useMediaQuery());
        unmount();
      }

      // Should have equal number of add and remove calls
      expect(addEventListenerSpy).toHaveBeenCalledTimes(3);
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(3);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('State Consistency', () => {
    it('ensures only one breakpoint is active at a time', () => {
      const testWidths = [300, 600, 768, 769, 900, 1024, 1025, 1500];

      testWidths.forEach(width => {
        setWindowWidth(width);
        const { result } = renderHook(() => useMediaQuery());

        const activeStates = [
          result.current.isMobile,
          result.current.isTablet,
          result.current.isDesktop,
        ].filter(Boolean);

        expect(activeStates).toHaveLength(1);
      });
    });

    it('provides predictable breakpoint logic', () => {
      const testCases = [
        {
          width: 320,
          expected: { isMobile: true, isTablet: false, isDesktop: false },
        },
        {
          width: 768,
          expected: { isMobile: true, isTablet: false, isDesktop: false },
        },
        {
          width: 769,
          expected: { isMobile: false, isTablet: true, isDesktop: false },
        },
        {
          width: 1024,
          expected: { isMobile: false, isTablet: true, isDesktop: false },
        },
        {
          width: 1025,
          expected: { isMobile: false, isTablet: false, isDesktop: true },
        },
        {
          width: 1920,
          expected: { isMobile: false, isTablet: false, isDesktop: true },
        },
      ];

      testCases.forEach(({ width, expected }) => {
        setWindowWidth(width);
        const { result } = renderHook(() => useMediaQuery());

        expect(result.current).toEqual(expected);
      });
    });
  });
});
