'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * View mode types for responsive layouts
 */
export type ViewMode = 'mobile' | 'tablet' | 'desktop';

/**
 * Responsive breakpoint configuration
 */
interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

/**
 * Responsive hook result interface
 */
interface ResponsiveHookResult {
  viewMode: ViewMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Default breakpoints following common responsive design patterns
 */
const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 768,   // 0 - 767px
  tablet: 1024,  // 768 - 1023px  
  desktop: 1024, // 1024px+
};

/**
 * Hook for responsive design detection specifically for high score components
 * Provides view mode and responsive state information
 * 
 * @param breakpoints - Custom breakpoint configuration
 * @returns Responsive state and utilities
 */
export function useResponsive(
  breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS
): ResponsiveHookResult {
  const [state, setState] = useState<ResponsiveHookResult>(() => {
    // Server-side safe defaults
    const defaultState: ResponsiveHookResult = {
      viewMode: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenWidth: 1024,
      screenHeight: 768,
      orientation: 'landscape',
      isTouch: false,
      prefersReducedMotion: false,
    };

    // Client-side initialization
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < breakpoints.mobile;
      const isTablet = width >= breakpoints.mobile && width < breakpoints.tablet;
      const isDesktop = width >= breakpoints.desktop;
      
      return {
        viewMode: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      };
    }

    return defaultState;
  });

  const updateResponsiveState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < breakpoints.mobile;
    const isTablet = width >= breakpoints.mobile && width < breakpoints.tablet;
    const isDesktop = width >= breakpoints.desktop;

    setState({
      viewMode: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  }, [breakpoints]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update state on mount
    updateResponsiveState();

    // Debounced resize handler for performance
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = (): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateResponsiveState, 150);
    };

    // Add event listeners
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    // Listen for media query changes
    const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaQueryChange = (): void => {
      updateResponsiveState();
    };

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleMediaQueryChange);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleMediaQueryChange);
    }

    // Cleanup
    return (): void => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleMediaQueryChange);
      } else {
        mediaQueryList.removeListener(handleMediaQueryChange);
      }
    };
  }, [updateResponsiveState]);

  return state;
}

/**
 * Hook for checking specific breakpoint conditions
 * Useful for conditional rendering based on screen size
 */
export function useBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean {
  const { viewMode } = useResponsive();
  
  switch (breakpoint) {
    case 'mobile':
      return viewMode === 'mobile';
    case 'tablet':
      return viewMode === 'tablet';
    case 'desktop':
      return viewMode === 'desktop';
    default:
      return false;
  }
}

/**
 * Hook for checking if screen size is at least a certain breakpoint
 * Useful for progressive enhancement patterns
 */
export function useMinBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean {
  const { viewMode } = useResponsive();
  
  switch (breakpoint) {
    case 'mobile':
      return true; // Always true since mobile is the smallest
    case 'tablet':
      return viewMode === 'tablet' || viewMode === 'desktop';
    case 'desktop':
      return viewMode === 'desktop';
    default:
      return false;
  }
}

/**
 * Hook for getting responsive CSS classes based on current viewport
 * Returns appropriate CSS module classes for responsive components
 */
export function useResponsiveClasses(): {
  containerClass: string;
  entryClass: string;
  layoutMode: string;
  touchClass: string;
  motionClass: string;
} {
  const { viewMode, isTouch, prefersReducedMotion } = useResponsive();
  
  return {
    containerClass: viewMode === 'mobile' ? 'scoreCards' : 
                   viewMode === 'tablet' ? 'scoreCards' : 'scoreTable',
    entryClass: viewMode === 'desktop' ? 'tableRow' : 'scoreCard',
    layoutMode: viewMode === 'desktop' ? 'table' : 'card',
    touchClass: isTouch ? 'touch-enabled' : 'mouse-enabled',
    motionClass: prefersReducedMotion ? 'reduced-motion' : 'motion-enabled',
  };
}

export default useResponsive;