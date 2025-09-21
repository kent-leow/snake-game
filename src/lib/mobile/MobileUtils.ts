/**
 * Mobile-specific utility functions for device detection and optimization
 * Provides comprehensive mobile device support and optimization tools
 */
export class MobileUtils {
  /**
   * Detect if the current device is a mobile device
   */
  static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Detect if the device supports touch events
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get current viewport dimensions
   */
  static getViewportSize(): { width: number; height: number } {
    return {
      width: Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      ),
      height: Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
      ),
    };
  }

  /**
   * Prevent zoom gestures and maintain fixed viewport
   */
  static preventZoom(): void {
    document.addEventListener(
      'touchmove',
      (e) => {
        // Check if it's a multi-touch gesture (potential zoom)
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Enable safe area support for notched devices
   */
  static enableSafeArea(): void {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
    document.head.appendChild(meta);
  }

  /**
   * Calculate optimal canvas size for mobile devices
   */
  static calculateOptimalCanvasSize(
    viewportWidth: number,
    viewportHeight: number,
    hasControls: boolean = true
  ): { width: number; height: number } {
    const margin = 20;
    const controlsHeight = hasControls ? 120 : 0;

    const availableWidth = viewportWidth - margin * 2;
    const availableHeight = viewportHeight - controlsHeight - margin * 2;

    const size = Math.min(availableWidth, availableHeight);

    return {
      width: Math.max(300, size), // Minimum size
      height: Math.max(300, size),
    };
  }

  /**
   * Optimize canvas for mobile performance and touch interaction
   * Note: Canvas sizing and high-DPI scaling are handled by CanvasRenderer
   */
  static optimizeCanvasForMobile(canvas: HTMLCanvasElement): void {
    // Disable context menu on long press
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Prevent text selection
    canvas.style.webkitUserSelect = 'none';
    canvas.style.userSelect = 'none';

    // Improve touch responsiveness
    canvas.style.touchAction = 'none';

    // Mobile-specific performance optimizations
    canvas.style.willChange = 'contents';
    canvas.style.backfaceVisibility = 'hidden';
    canvas.style.transform = 'translateZ(0)'; // Force hardware acceleration
    
    // Note: High-DPI scaling is handled by CanvasRenderer's setupHighDPICanvas
    // to avoid double scaling issues
  }

  /**
   * Trigger haptic feedback if available
   */
  static vibrate(pattern: number | number[] = 50): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Check if device is in landscape orientation
   */
  static isLandscape(): boolean {
    return window.innerWidth > window.innerHeight;
  }

  /**
   * Check if device is in portrait orientation
   */
  static isPortrait(): boolean {
    return window.innerHeight > window.innerWidth;
  }

  /**
   * Get safe area insets if available
   */
  static getSafeAreaInsets(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
    };
  }

  /**
   * Detect device performance level
   */
  static getPerformanceLevel(): 'low' | 'medium' | 'high' {
    const userAgent = navigator.userAgent.toLowerCase();
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    
    // Basic performance heuristics
    if (hardwareConcurrency >= 8) {
      return 'high';
    } else if (hardwareConcurrency >= 4) {
      return 'medium';
    } else if (userAgent.includes('mobile') && hardwareConcurrency < 4) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Disable text selection on mobile for better game experience
   */
  static disableTextSelection(): void {
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
    // Use setProperty for webkit-specific properties
    document.body.style.setProperty('-webkit-touch-callout', 'none');
  }

  /**
   * Enable text selection (reverse of disableTextSelection)
   */
  static enableTextSelection(): void {
    document.body.style.webkitUserSelect = '';
    document.body.style.userSelect = '';
    document.body.style.setProperty('-webkit-touch-callout', '');
  }
}

export default MobileUtils;