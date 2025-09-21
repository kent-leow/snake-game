/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useResponsive, useBreakpoint, useMinBreakpoint, useResponsiveClasses } from '../useResponsive';

// Mock window.matchMedia
const createMatchMedia = (matches: boolean) => {
  return jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

beforeEach(() => {
  // Reset window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });

  // Mock matchMedia
  window.matchMedia = createMatchMedia(false);

  // Reset touch support properties
  // Delete existing properties first
  delete (window as any).ontouchstart;
  
  Object.defineProperty(window, 'ontouchstart', {
    writable: true,
    configurable: true,
    value: undefined,
  });

  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    configurable: true,
    value: 0,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('useResponsive Hook', () => {
  describe('Desktop Detection (1024px+)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
    });

    it('should detect desktop viewport correctly', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.viewMode).toBe('desktop');
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.screenWidth).toBe(1200);
    });
  });

  describe('Tablet Detection (768px - 1023px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });
    });

    it('should detect tablet viewport correctly', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.viewMode).toBe('tablet');
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.screenWidth).toBe(800);
    });
  });

  describe('Mobile Detection (< 768px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it('should detect mobile viewport correctly', () => {
      const { result } = renderHook(() => useResponsive());

      expect(result.current.viewMode).toBe('mobile');
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isMobile).toBe(true);
      expect(result.current.screenWidth).toBe(375);
    });
  });

  describe('Orientation Detection', () => {
    it('should detect landscape orientation', () => {
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

      const { result } = renderHook(() => useResponsive());

      expect(result.current.orientation).toBe('landscape');
    });

    it('should detect portrait orientation', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.orientation).toBe('portrait');
    });
  });

  describe('Touch Detection', () => {
    it('should detect touch devices via ontouchstart', () => {
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: {},
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTouch).toBe(true);
    });

    it('should detect touch devices via maxTouchPoints', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 2,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTouch).toBe(true);
    });

    it('should detect non-touch devices', () => {
      // Create a fresh window object simulation for non-touch
      const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'ontouchstart');
      
      // Remove ontouchstart property completely
      if ('ontouchstart' in window) {
        delete (window as any).ontouchstart;
      }
      
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTouch).toBe(false);

      // Restore original descriptor if it existed
      if (originalDescriptor) {
        Object.defineProperty(window, 'ontouchstart', originalDescriptor);
      }
    });
  });

  describe('Motion Preference Detection', () => {
    it('should detect prefers-reduced-motion', () => {
      window.matchMedia = createMatchMedia(true);

      const { result } = renderHook(() => useResponsive());

      expect(result.current.prefersReducedMotion).toBe(true);
    });

    it('should detect normal motion preference', () => {
      window.matchMedia = createMatchMedia(false);

      const { result } = renderHook(() => useResponsive());

      expect(result.current.prefersReducedMotion).toBe(false);
    });
  });

  describe('Resize Event Handling', () => {
    it('should update viewport state on window resize', async () => {
      const { result } = renderHook(() => useResponsive());

      // Initial state (desktop)
      expect(result.current.viewMode).toBe('desktop');

      // Simulate resize to mobile
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        });

        window.dispatchEvent(new Event('resize'));

        // Wait for debounced update
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.viewMode).toBe('mobile');
      expect(result.current.screenWidth).toBe(375);
    });

    it('should handle orientation change events', async () => {
      const { result } = renderHook(() => useResponsive());

      // Simulate orientation change
      await act(async () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 667,
        });

        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 375,
        });

        window.dispatchEvent(new Event('orientationchange'));

        // Wait for debounced update
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(result.current.orientation).toBe('landscape');
    });
  });

  describe('Custom Breakpoints', () => {
    it('should accept custom breakpoint configuration', () => {
      const customBreakpoints = {
        mobile: 600,
        tablet: 900,
        desktop: 900,
      };

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 700,
      });

      const { result } = renderHook(() => useResponsive(customBreakpoints));

      expect(result.current.viewMode).toBe('tablet');
      expect(result.current.isTablet).toBe(true);
    });
  });

  describe('Server-Side Rendering Compatibility', () => {
    it('should provide safe defaults when window is undefined', () => {
      // Mock server environment
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally setting window to undefined for SSR test
      delete global.window;

      const { result } = renderHook(() => useResponsive());

      expect(result.current.viewMode).toBe('desktop');
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.screenWidth).toBe(1024);
      expect(result.current.screenHeight).toBe(768);

      // Restore window
      global.window = originalWindow;
    });
  });
});

describe('useBreakpoint Hook', () => {
  it('should return true for mobile breakpoint on mobile device', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useBreakpoint('mobile'));

    expect(result.current).toBe(true);
  });

  it('should return true for tablet breakpoint on tablet device', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { result } = renderHook(() => useBreakpoint('tablet'));

    expect(result.current).toBe(true);
  });

  it('should return true for desktop breakpoint on desktop device', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { result } = renderHook(() => useBreakpoint('desktop'));

    expect(result.current).toBe(true);
  });

  it('should return false for incorrect breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useBreakpoint('desktop'));

    expect(result.current).toBe(false);
  });
});

describe('useMinBreakpoint Hook', () => {
  it('should return true for mobile on all device sizes', () => {
    // Test mobile device
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result: mobileResult } = renderHook(() => useMinBreakpoint('mobile'));
    expect(mobileResult.current).toBe(true);

    // Test tablet device
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { result: tabletResult } = renderHook(() => useMinBreakpoint('mobile'));
    expect(tabletResult.current).toBe(true);

    // Test desktop device
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { result: desktopResult } = renderHook(() => useMinBreakpoint('mobile'));
    expect(desktopResult.current).toBe(true);
  });

  it('should return true for tablet and above on tablet/desktop', () => {
    // Test tablet device
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { result: tabletResult } = renderHook(() => useMinBreakpoint('tablet'));
    expect(tabletResult.current).toBe(true);

    // Test desktop device
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { result: desktopResult } = renderHook(() => useMinBreakpoint('tablet'));
    expect(desktopResult.current).toBe(true);
  });

  it('should return false for tablet on mobile device', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useMinBreakpoint('tablet'));
    expect(result.current).toBe(false);
  });

  it('should return true only for desktop on desktop device', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { result } = renderHook(() => useMinBreakpoint('desktop'));
    expect(result.current).toBe(true);
  });
});

describe('useResponsiveClasses Hook', () => {
  it('should return correct classes for mobile layout', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useResponsiveClasses());

    expect(result.current.containerClass).toBe('scoreCards');
    expect(result.current.entryClass).toBe('scoreCard');
    expect(result.current.layoutMode).toBe('card');
  });

  it('should return correct classes for tablet layout', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { result } = renderHook(() => useResponsiveClasses());

    expect(result.current.containerClass).toBe('scoreCards');
    expect(result.current.entryClass).toBe('scoreCard');
    expect(result.current.layoutMode).toBe('card');
  });

  it('should return correct classes for desktop layout', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { result } = renderHook(() => useResponsiveClasses());

    expect(result.current.containerClass).toBe('scoreTable');
    expect(result.current.entryClass).toBe('tableRow');
    expect(result.current.layoutMode).toBe('table');
  });

  it('should return touch-enabled class for touch devices', () => {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: {},
    });

    const { result } = renderHook(() => useResponsiveClasses());

    expect(result.current.touchClass).toBe('touch-enabled');
  });

  it('should return mouse-enabled class for non-touch devices', () => {
    // Create a fresh window object simulation for non-touch
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'ontouchstart');
    
    // Remove ontouchstart property completely
    if ('ontouchstart' in window) {
      delete (window as any).ontouchstart;
    }
    
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });

    const { result } = renderHook(() => useResponsiveClasses());

    expect(result.current.touchClass).toBe('mouse-enabled');

    // Restore original descriptor if it existed
    if (originalDescriptor) {
      Object.defineProperty(window, 'ontouchstart', originalDescriptor);
    }
  });

  it('should return reduced-motion class when prefers-reduced-motion is true', () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useResponsiveClasses());

    expect(result.current.motionClass).toBe('reduced-motion');
  });

  it('should return motion-enabled class when prefers-reduced-motion is false', () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useResponsiveClasses());

    expect(result.current.motionClass).toBe('motion-enabled');
  });
});

describe('Hook Performance', () => {
  it('should debounce resize events for performance', async () => {
    const { result } = renderHook(() => useResponsive());

    const initialViewMode = result.current.viewMode;

    // Trigger multiple rapid resize events
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375 + i * 10,
        });
        window.dispatchEvent(new Event('resize'));
      }

      // Wait for debounced update
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Should only update once after debounce
    expect(result.current.viewMode).not.toBe(initialViewMode);
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useResponsive());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});