'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceOrientationState {
  orientation: 'portrait' | 'landscape';
  angle: number;
  isSupported: boolean;
}

/**
 * Hook for device orientation detection and monitoring
 * Provides orientation information and change detection
 */
export const useDeviceOrientation = (): DeviceOrientationState => {
  const [orientationState, setOrientationState] = useState<DeviceOrientationState>(() => ({
    orientation: 'portrait',
    angle: 0,
    isSupported: false,
  }));

  const updateOrientation = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    
    // Try to get the device orientation angle
    let angle = 0;
    if (screen.orientation) {
      angle = screen.orientation.angle;
    } else if (window.orientation !== undefined) {
      angle = window.orientation;
    }

    setOrientationState({
      orientation,
      angle,
      isSupported: 'orientation' in screen || 'orientation' in window,
    });
  }, []);

  useEffect(() => {
    updateOrientation();

    // Listen for orientation changes
    const handleOrientationChange = (): void => {
      // Use timeout to allow for layout changes to complete
      setTimeout(updateOrientation, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return (): void => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [updateOrientation]);

  return orientationState;
};

export default useDeviceOrientation;