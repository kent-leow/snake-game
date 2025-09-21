/**
 * High-performance GameCanvas component with responsive design and mobile support
 * Integrates canvas rendering system with React lifecycle and touch controls
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CanvasRenderer, 
  RenderLoop, 
  ResponsiveCanvas,
  type GameConfig,
  type GameElements
} from '@/lib/rendering';
import { useResponsiveLayout } from '@/hooks';
import { MobileUtils } from '@/lib/mobile';
import { SwipeGestureHandler } from '@/components/mobile';
import type { GameEngine } from '@/lib/game/gameEngine';
import type { Direction } from '@/lib/game/types';

export interface GameCanvasProps {
  gameEngine: GameEngine;
  gameConfig: GameConfig;
  className?: string;
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
  className = '',
  targetFPS = 60,
  enableTouchControls = true,
  onDirectionChange,
  enableComboVisuals = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const renderLoopRef = useRef<RenderLoop | null>(null);
  const responsiveCanvasRef = useRef<ResponsiveCanvas | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isMobile } = useResponsiveLayout();

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
        comboState: gameState.comboState ? {
          expectedNext: gameState.comboState.expectedNext,
          comboProgress: gameState.comboState.comboProgress,
          isComboActive: gameState.comboState.isComboActive,
        } : undefined,
      };

      rendererRef.current.render(gameElements, interpolation);
    } catch (error) {
      console.error('Render error:', error);
    }
  }, [gameEngine]);

  /**
   * Initialize canvas and rendering system
   */
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    try {
      // Initialize canvas with fixed dimensions - skip ResponsiveCanvas to avoid conflicts
      // ResponsiveCanvas interferes with the CanvasRenderer's dimension management
      responsiveCanvasRef.current = null;

      // Initialize renderer with proper fixed dimensions
      const renderer = new CanvasRenderer(
        canvasRef.current,
        gameConfig
      );
      rendererRef.current = renderer;

      // Initialize render loop
      const renderLoop = new RenderLoop(
        {
          onUpdate: handleUpdate,
          onRender: handleRender,
        },
        {
          targetFPS,
        }
      );
      renderLoopRef.current = renderLoop;

      // Set canvas to fixed size - no dynamic resizing
      if (gameConfig.canvasWidth && gameConfig.canvasHeight) {
        renderer.resize(gameConfig);
      }

      // Mobile optimizations
      if (isMobile && canvasRef.current) {
        MobileUtils.optimizeCanvasForMobile(canvasRef.current);
      }

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
      // ResponsiveCanvas is disabled for fixed canvas sizes
      
      rendererRef.current = null;
      renderLoopRef.current = null;
      responsiveCanvasRef.current = null;
    };
  }, [gameConfig, targetFPS, handleUpdate, handleRender, isMobile]);

  /**
   * Handle game engine state changes
   */
  useEffect(() => {
    if (!gameEngine || !renderLoopRef.current) return;

    // The render loop should always run for smooth visuals
    // Game state changes are handled in the render function
    if (!renderLoopRef.current.isActive()) {
      renderLoopRef.current.start();
    }
  }, [gameEngine]);

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
          className="game-canvas-swipe-wrapper"
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
              touchAction: 'none',
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
    </div>
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;