'use client';

import { useState, useEffect, useCallback } from 'react';

interface ResponsiveLayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  viewportSize: { width: number; height: number };
}

/**
 * Hook for responsive layout detection with orientation awareness
 * Provides comprehensive device and screen size information
 */
export const useResponsiveLayout = (): ResponsiveLayoutState => {
  const [layoutState, setLayoutState] = useState<ResponsiveLayoutState>(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'large',
    orientation: 'landscape',
    viewportSize: { width: 0, height: 0 },
  }));

  const updateLayout = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    const isDesktop = width > 1024;
    const newScreenSize = isMobile ? 'small' : isTablet ? 'medium' : 'large';
    const newOrientation = width > height ? 'landscape' : 'portrait';

    // Only update if there's a meaningful change to prevent unnecessary re-renders
    setLayoutState(prevState => {
      if (
        prevState.isMobile !== isMobile ||
        prevState.screenSize !== newScreenSize ||
        prevState.orientation !== newOrientation ||
        Math.abs(prevState.viewportSize.width - width) > 50 || // Only update if significant change
        Math.abs(prevState.viewportSize.height - height) > 50
      ) {
        return {
          isMobile,
          isTablet,
          isDesktop,
          screenSize: newScreenSize,
          orientation: newOrientation,
          viewportSize: { width, height },
        };
      }
      return prevState;
    });
  }, []);

  useEffect(() => {
    updateLayout();

    const debouncedUpdate = debounce(updateLayout, 250); // Increased from 100ms to 250ms
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return (): void => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
    };
  }, [updateLayout]);

  return layoutState;
};

/**
 * Debounce utility function for performance optimization
 */
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default useResponsiveLayout;