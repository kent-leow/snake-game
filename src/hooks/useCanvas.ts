/**
 * React hooks for canvas management and integration
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CanvasRenderer, 
  ResponsiveCanvas,
  type GameConfig,
  type CanvasDimensions
} from '@/lib/rendering';

export interface UseCanvasOptions {
  gameConfig: GameConfig;
  enableResponsive?: boolean;
  onResize?: (dimensions: CanvasDimensions) => void;
  onError?: (error: Error) => void;
}

export interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  renderer: CanvasRenderer | null;
  responsiveCanvas: ResponsiveCanvas | null;
  isReady: boolean;
  error: Error | null;
  dimensions: CanvasDimensions | null;
  resize: () => void;
}

/**
 * Hook for managing canvas setup and responsive behavior
 */
export const useCanvas = ({
  gameConfig,
  enableResponsive = true,
  onResize,
  onError,
}: UseCanvasOptions): UseCanvasReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const responsiveCanvasRef = useRef<ResponsiveCanvas | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [dimensions, setDimensions] = useState<CanvasDimensions | null>(null);

  /**
   * Handle resize events
   */
  const handleResize = useCallback((newDimensions: CanvasDimensions) => {
    setDimensions(newDimensions);
    onResize?.(newDimensions);
    
    // Update renderer with new config
    if (rendererRef.current) {
      const newConfig = {
        ...gameConfig,
        gridSize: Math.min(gameConfig.gridSize, Math.floor(newDimensions.width / 15)),
      };
      rendererRef.current.resize(newConfig);
    }
  }, [gameConfig, onResize]);

  /**
   * Manual resize trigger
   */
  const resize = useCallback(() => {
    if (responsiveCanvasRef.current) {
      const newDimensions = responsiveCanvasRef.current.resize();
      handleResize(newDimensions);
    }
  }, [handleResize]);

  /**
   * Initialize canvas and renderer
   */
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    try {
      let responsiveCanvas: ResponsiveCanvas | null = null;
      
      // Set up responsive canvas if enabled
      if (enableResponsive) {
        responsiveCanvas = new ResponsiveCanvas(
          canvasRef.current,
          containerRef.current,
          {
            minSize: 300,
            maxSize: 800,
            maintainAspectRatio: true,
          }
        );
        responsiveCanvasRef.current = responsiveCanvas;
        responsiveCanvas.onResize(handleResize);
      }

      // Initialize renderer
      const renderer = new CanvasRenderer(canvasRef.current, gameConfig);
      rendererRef.current = renderer;

      // Get initial dimensions
      if (responsiveCanvas) {
        const initialDimensions = responsiveCanvas.resize();
        setDimensions(initialDimensions);
      } else {
        // Calculate dimensions manually if responsive is disabled
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
          cellSize: Math.floor(Math.min(rect.width, rect.height) / gameConfig.gridSize),
        });
      }

      setIsReady(true);
      setError(null);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Canvas initialization failed');
      setError(error);
      setIsReady(false);
      onError?.(error);
    }

    // Cleanup
    return (): void => {
      rendererRef.current?.destroy();
      responsiveCanvasRef.current?.destroy();
      rendererRef.current = null;
      responsiveCanvasRef.current = null;
      setIsReady(false);
    };
  }, [gameConfig, enableResponsive, handleResize, onError]);

  return {
    canvasRef,
    containerRef,
    renderer: rendererRef.current,
    responsiveCanvas: responsiveCanvasRef.current,
    isReady,
    error,
    dimensions,
    resize,
  };
};
