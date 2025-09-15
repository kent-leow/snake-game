/**
 * High-performance GameCanvas component with responsive design and mobile support
 * Integrates canvas rendering system with React lifecycle and touch controls
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CanvasRenderer, 
  RenderLoop, 
  PerformanceMonitor,
  ResponsiveCanvas,
  type GameConfig,
  type GameElements,
  type PerformanceMetrics 
} from '@/lib/rendering';
import { SwipeGestureHandler } from '@/components/mobile';
import { useResponsiveLayout } from '@/hooks';
import { MobileUtils } from '@/lib/mobile';
import type { GameEngine } from '@/lib/game/gameEngine';
import type { Direction } from '@/lib/game/types';

export interface GameCanvasProps {
  gameEngine: GameEngine;
  gameConfig: GameConfig;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  className?: string;
  enablePerformanceMonitoring?: boolean;
  targetFPS?: number;
  enableTouchControls?: boolean;
  onDirectionChange?: (direction: Direction) => void;
}

/**
 * Main game canvas component with integrated rendering system
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameEngine,
  gameConfig,
  onPerformanceUpdate,
  className = '',
  enablePerformanceMonitoring = process.env.NODE_ENV === 'development',
  targetFPS = 60,
  enableTouchControls = true,
  onDirectionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const renderLoopRef = useRef<RenderLoop | null>(null);
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const responsiveCanvasRef = useRef<ResponsiveCanvas | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFPS, setCurrentFPS] = useState(0);

  const { isMobile } = useResponsiveLayout();

  /**
   * Update game state and render
   */
  const handleUpdate = useCallback((deltaTime: number, interpolation: number): void => {
    try {
      // Game engine update is handled separately to avoid coupling
      // This is just for any canvas-specific update logic
      
      // Use the parameters to avoid unused variable warnings
      if (deltaTime && interpolation) {
        // Parameters are available if needed for future enhancements
      }
    } catch (error) {
      console.error('Game update error:', error);
      setError('Game update failed');
    }
  }, []);

  /**
   * Render frame
   */
  const handleRender = useCallback((interpolation: number) => {
    if (!rendererRef.current || !gameEngine) return;

    try {
      const gameState = gameEngine.getGameState();
      
      // Convert game state to render format
      const gameElements: GameElements = {
        snake: gameState.snake,
        food: gameState.food,
        score: gameState.score,
        gameState: gameState.isRunning ? 'playing' : 'paused',
      };

      rendererRef.current.render(gameElements, interpolation);
    } catch (error) {
      console.error('Render error:', error);
      performanceMonitorRef.current?.recordError();
    }
  }, [gameEngine]);

  /**
   * Handle performance updates
   */
  const handlePerformanceUpdate = useCallback((fps: number) => {
    setCurrentFPS(fps);
    
    if (performanceMonitorRef.current && onPerformanceUpdate) {
      const metrics = performanceMonitorRef.current.getMetrics();
      onPerformanceUpdate(metrics);
    }
  }, [onPerformanceUpdate]);

  /**
   * Initialize canvas and rendering system
   */
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    try {
      // Initialize performance monitor
      const performanceMonitor = new PerformanceMonitor(enablePerformanceMonitoring);
      performanceMonitorRef.current = performanceMonitor;

      // Initialize responsive canvas
      const responsiveCanvas = new ResponsiveCanvas(
        canvasRef.current,
        containerRef.current,
        {
          minSize: 300,
          maxSize: 600,
          maintainAspectRatio: true,
        }
      );
      responsiveCanvasRef.current = responsiveCanvas;

      // Initialize renderer
      const renderer = new CanvasRenderer(
        canvasRef.current,
        gameConfig,
        performanceMonitor
      );
      rendererRef.current = renderer;

      // Initialize render loop
      const renderLoop = new RenderLoop(
        {
          onUpdate: handleUpdate,
          onRender: handleRender,
          onPerformanceUpdate: handlePerformanceUpdate,
        },
        {
          targetFPS,
          enablePerformanceMonitoring,
        },
        performanceMonitor
      );
      renderLoopRef.current = renderLoop;

      // Set up responsive canvas resize handler
      responsiveCanvas.onResize((dimensions) => {
        const newConfig = {
          ...gameConfig,
          gridSize: Math.min(gameConfig.gridSize, Math.floor(dimensions.width / 15)),
        };
        renderer.resize(newConfig);
      });

      // Mobile optimizations
      if (isMobile && canvasRef.current) {
        MobileUtils.optimizeCanvasForMobile(canvasRef.current);
      }

      // Initial resize
      responsiveCanvas.resize();

      // Start render loop
      renderLoop.start();
      setIsInitialized(true);
      setError(null);

    } catch (error) {
      console.error('Failed to initialize canvas:', error);
      setError('Failed to initialize game canvas');
    }

    // Cleanup function
    return () => {
      renderLoopRef.current?.destroy();
      rendererRef.current?.destroy();
      performanceMonitorRef.current?.destroy();
      responsiveCanvasRef.current?.destroy();
      
      rendererRef.current = null;
      renderLoopRef.current = null;
      performanceMonitorRef.current = null;
      responsiveCanvasRef.current = null;
    };
  }, [gameConfig, enablePerformanceMonitoring, targetFPS, handleUpdate, handleRender, handlePerformanceUpdate, isMobile]);

  /**
   * Handle game engine state changes
   */
  useEffect(() => {
    if (!gameEngine || !renderLoopRef.current) return;

    // Create a simple subscription to game state changes
    // This is a basic implementation - you might want to use a more sophisticated approach
    const checkGameState = () => {
      const gameState = gameEngine.getGameState();
      
      if (gameState.isRunning && !renderLoopRef.current?.isActive()) {
        renderLoopRef.current?.resume();
      } else if (!gameState.isRunning && renderLoopRef.current?.isActive()) {
        renderLoopRef.current?.pause();
      }
    };

    // Check game state periodically
    const interval = setInterval(checkGameState, 100);
    
    return () => clearInterval(interval);
  }, [gameEngine]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      responsiveCanvasRef.current?.resize();
    };

    // Debounce resize events
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  /**
   * Handle canvas click for focus
   */
  const handleCanvasClick = useCallback(() => {
    canvasRef.current?.focus();
  }, []);

  /**
   * Handle key events for game control
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Prevent default browser behavior for game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  }, []);

  /**
   * Handle touch direction changes from swipe gestures
   */
  const handleSwipeDirection = useCallback((direction: Direction) => {
    if (onDirectionChange) {
      onDirectionChange(direction);
    } else if (gameEngine) {
      // Fallback: call gameEngine direction change directly
      gameEngine.changeDirection(direction);
    }
  }, [onDirectionChange, gameEngine]);

  return (
    <div
      ref={containerRef}
      className={`game-canvas-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        position: 'relative',
      }}
    >
      {isMobile && enableTouchControls ? (
        <SwipeGestureHandler
          onSwipe={handleSwipeDirection}
          sensitivity={50}
          disabled={!isInitialized}
        >
          <canvas
            ref={canvasRef}
            className="game-canvas"
            tabIndex={0}
            role="img"
            aria-label="Snake game canvas"
            onClick={handleCanvasClick}
            onKeyDown={handleKeyDown}
            style={{
              border: '2px solid #333',
              borderRadius: '8px',
              background: '#1a1a1a',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </SwipeGestureHandler>
      ) : (
        <canvas
          ref={canvasRef}
          className="game-canvas"
          tabIndex={0}
          role="img"
          aria-label="Snake game canvas"
          onClick={handleCanvasClick}
          onKeyDown={handleKeyDown}
          style={{
            border: '2px solid #333',
            borderRadius: '8px',
            background: '#1a1a1a',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      )}
      
      {/* Loading state */}
      {!isInitialized && !error && (
        <div 
          className="canvas-loading"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ffffff',
            fontSize: '18px',
            fontFamily: 'monospace',
          }}
        >
          <span>Loading game...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div 
          className="canvas-error"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ef4444',
            fontSize: '16px',
            fontFamily: 'monospace',
            textAlign: 'center',
          }}
        >
          <div>{error}</div>
          <div style={{ fontSize: '14px', marginTop: '8px', color: '#888' }}>
            Please refresh the page to try again
          </div>
        </div>
      )}

      {/* Performance overlay (development only) */}
      {enablePerformanceMonitoring && isInitialized && (
        <div 
          className="performance-overlay"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            color: '#888',
            fontSize: '12px',
            fontFamily: 'monospace',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '4px 8px',
            borderRadius: '4px',
            pointerEvents: 'none',
          }}
        >
          FPS: {currentFPS}
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
