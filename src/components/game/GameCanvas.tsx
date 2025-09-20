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
import type { ComboEvent, ComboState } from '@/types/Combo';
import { ComboProgressIndicator, useComboProgressProps } from '@/components/ComboProgressIndicator';
import { ComboFeedback } from '@/components/ComboFeedback';
import { useSimpleComboAnimation } from '@/hooks/useComboAnimation';

export interface GameCanvasProps {
  gameEngine: GameEngine;
  gameConfig: GameConfig;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  className?: string;
  enablePerformanceMonitoring?: boolean;
  targetFPS?: number;
  enableTouchControls?: boolean;
  onDirectionChange?: (direction: Direction) => void;
  enableComboVisuals?: boolean;
}

/**
 * Main game canvas component with integrated rendering system
 */
export const GameCanvas: React.FC<GameCanvasProps> = React.memo(({
  gameEngine,
  gameConfig,
  onPerformanceUpdate,
  className = '',
  enablePerformanceMonitoring = process.env.NODE_ENV === 'development',
  targetFPS = 60,
  enableTouchControls = true,
  onDirectionChange,
  enableComboVisuals = true,
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
  const [comboState, setComboState] = useState<ComboState | null>(null);

  const { isMobile } = useResponsiveLayout();
  
  // Combo animation management
  const {
    currentEvent: comboEvent,
    showEvent: showComboEvent,
    hideEvent: hideComboEvent,
  } = useSimpleComboAnimation();

  // Convert combo state to progress props (always call hook, then filter result)
  const allComboProgressProps = useComboProgressProps(comboState || {
    currentSequence: [],
    expectedNext: 1,
    comboProgress: 0,
    totalCombos: 0,
    isComboActive: false,
  });
  const comboProgressProps = comboState ? allComboProgressProps : null;

  /**
   * Update game state and render
   */
  const handleUpdate = useCallback((deltaTime: number, interpolation: number): void => {
    try {
      if (gameEngine) {
        // Call the game engine update method to move the snake
        gameEngine.update();
      }
      
      // Use the parameters to avoid unused variable warnings
      if (deltaTime && interpolation) {
        // Parameters are available if needed for future enhancements
      }
    } catch (error) {
      console.error('Game update error:', error);
      setError('Game update failed');
    }
  }, [gameEngine]);

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
        multipleFoods: gameState.multipleFoods,
        useMultipleFood: gameState.useMultipleFood,
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
    return (): void => {
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
    const checkGameState = (): void => {
      const gameState = gameEngine.getGameState();
      
      if (gameState.isRunning && !renderLoopRef.current?.isActive()) {
        renderLoopRef.current?.resume();
      } else if (!gameState.isRunning && renderLoopRef.current?.isActive()) {
        renderLoopRef.current?.pause();
      }
    };

    // Check game state periodically
    const interval = setInterval(checkGameState, 100);
    
    return (): void => clearInterval(interval);
  }, [gameEngine]);

  /**
   * Handle combo state and events
   */
  useEffect(() => {
    if (!gameEngine || !enableComboVisuals) return;

    try {
      const comboManager = gameEngine.getComboManager();
      
      // Subscribe to combo events
      const unsubscribe = comboManager.subscribe((event: ComboEvent) => {
        // Update combo state
        setComboState(comboManager.getCurrentState());
        
        // Show combo animation
        showComboEvent(event);
      });

      // Initialize combo state
      setComboState(comboManager.getCurrentState());

      return unsubscribe;
    } catch (error) {
      console.warn('Combo system not available:', error);
      return undefined;
    }
  }, [gameEngine, enableComboVisuals, showComboEvent]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = (): void => {
      responsiveCanvasRef.current?.resize();
    };

    // Debounce resize events
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = (): void => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return (): void => {
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
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
      event.preventDefault();
      
      // Handle direction changes
      if (onDirectionChange) {
        switch (event.code) {
          case 'ArrowUp':
          case 'KeyW':
            onDirectionChange('UP');
            break;
          case 'ArrowDown':
          case 'KeyS':
            onDirectionChange('DOWN');
            break;
          case 'ArrowLeft':
          case 'KeyA':
            onDirectionChange('LEFT');
            break;
          case 'ArrowRight':
          case 'KeyD':
            onDirectionChange('RIGHT');
            break;
        }
      }
    }
  }, [onDirectionChange]);

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
            onFocus={() => {
              // Focus handled by CSS
            }}
            onBlur={() => {
              // Blur handled by CSS
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
          onFocus={() => {
            // Focus handled by CSS
          }}
          onBlur={() => {
            // Blur handled by CSS
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

      {/* Combo Progress Indicator - moved below canvas */}
      {enableComboVisuals && comboProgressProps && (
        <div
          className="combo-progress-external"
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #333',
          }}
        >
          <ComboProgressIndicator {...comboProgressProps} />
        </div>
      )}

      {/* Combo Feedback Animations - moved below canvas */}
      {enableComboVisuals && (
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 101,
          }}
        >
          <ComboFeedback
            event={comboEvent}
            onAnimationComplete={hideComboEvent}
          />
        </div>
      )}
    </div>
  );
});

export default GameCanvas;
