'use client';

import { useState, useEffect } from 'react';

interface MediaQueryResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Custom hook for responsive breakpoint detection
 * Provides boolean states for mobile, tablet, and desktop screen sizes
 */
export function useMediaQuery(): MediaQueryResult {
  const [mediaQuery, setMediaQuery] = useState<MediaQueryResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const updateMediaQuery = (): void => {
      const width = window.innerWidth;
      
      setMediaQuery({
        isMobile: width <= 768,
        isTablet: width > 768 && width <= 1024,
        isDesktop: width > 1024,
      });
    };

    // Initial check
    updateMediaQuery();

    // Add event listener for window resize
    window.addEventListener('resize', updateMediaQuery);

    // Cleanup
    return (): void => {
      window.removeEventListener('resize', updateMediaQuery);
    };
  }, []);

  return mediaQuery;
}

export default useMediaQuery;