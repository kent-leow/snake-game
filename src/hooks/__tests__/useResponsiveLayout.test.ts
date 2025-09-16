import { renderHook, act } from '@testing-library/react';
import { useResponsiveLayout } from '../useResponsiveLayout';

// Mock window.innerWidth and window.innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1280, // Desktop size
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Mock event listeners
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

describe('useResponsiveLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to desktop size (larger than 1024px)
    window.innerWidth = 1280;
    window.innerHeight = 768;
  });

  it('returns desktop layout for large screens', () => {
    window.innerWidth = 1200;
    window.innerHeight = 800;

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenSize: 'large',
      orientation: 'landscape',
      viewportSize: { width: 1200, height: 800 },
    });
  });

  it('returns tablet layout for medium screens', () => {
    window.innerWidth = 900;
    window.innerHeight = 600;

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      screenSize: 'medium',
      orientation: 'landscape',
      viewportSize: { width: 900, height: 600 },
    });
  });

  it('returns mobile layout for small screens', () => {
    window.innerWidth = 600;
    window.innerHeight = 800;

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current).toEqual({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      screenSize: 'small',
      orientation: 'portrait',
      viewportSize: { width: 600, height: 800 },
    });
  });

  it('detects portrait orientation correctly', () => {
    window.innerWidth = 400;
    window.innerHeight = 800;

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.orientation).toBe('portrait');
  });

  it('detects landscape orientation correctly', () => {
    window.innerWidth = 800;
    window.innerHeight = 400;

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.orientation).toBe('landscape');
  });

  it('sets up event listeners for resize and orientation change', () => {
    renderHook(() => useResponsiveLayout());

    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useResponsiveLayout());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('updates layout state on window resize', () => {
    jest.useFakeTimers();
    let resizeCallback: (() => void) | undefined;

    mockAddEventListener.mockImplementation((event, callback) => {
      if (event === 'resize') {
        resizeCallback = callback;
      }
    });

    const { result } = renderHook(() => useResponsiveLayout());

    // Initial state (desktop)
    expect(result.current.isDesktop).toBe(true);

    // Simulate resize to mobile
    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 800;
      if (resizeCallback) {
        resizeCallback();
        // Fast-forward timers to complete debounce
        jest.advanceTimersByTime(100);
      }
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    
    jest.useRealTimers();
  });

  it('handles edge case breakpoints correctly', () => {
    // Test exact breakpoint values
    window.innerWidth = 768; // Exact mobile/tablet boundary
    window.innerHeight = 600;

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
  });

  it('handles tablet boundary correctly', () => {
    window.innerWidth = 1024; // Exact tablet/desktop boundary
    window.innerHeight = 600;

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('provides accurate viewport size', () => {
    const testWidth = 1366;
    const testHeight = 768;
    
    window.innerWidth = testWidth;
    window.innerHeight = testHeight;

    const { result } = renderHook(() => useResponsiveLayout());

    expect(result.current.viewportSize).toEqual({
      width: testWidth,
      height: testHeight,
    });
  });

  it('maintains state consistency across re-renders', () => {
    const { result, rerender } = renderHook(() => useResponsiveLayout());

    const initialState = result.current;
    
    rerender();
    
    expect(result.current).toEqual(initialState);
  });
});