'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { useGameLoop, usePerformanceMonitor } from '@/hooks';
import { SnakeGame } from '@/lib/game/snake';
import {
  clearCanvas,
  drawGrid,
  drawSnakeSegment,
  drawBorder,
} from '@/lib/utils/canvas';
import { GAME_CONFIG, PERFORMANCE_CONFIG } from '@/lib/game/constants';
import type { Direction } from '@/lib/game/types';
import type { PerformanceStats } from '@/lib/game/performance';

/**
 * GameCanvas component properties
 */
export interface GameCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onCanvasReady?: (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D
  ) => void;
  onGameReady?: (game: SnakeGame) => void;
  onPerformanceUpdate?: (stats: PerformanceStats) => void;
  enablePerformanceMonitoring?: boolean;
}

/**
 * Main game canvas component for rendering the Snake game with optimized performance
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({
  width = GAME_CONFIG.CANVAS_WIDTH,
  height = GAME_CONFIG.CANVAS_HEIGHT,
  className = '',
  onCanvasReady,
  onGameReady,
  onPerformanceUpdate,
  enablePerformanceMonitoring = true,
}) => {
  // Game state
  const [gameInstance, setGameInstance] = useState<SnakeGame | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const lastUpdateTimeRef = useRef<number>(0);

  // Initialize canvas hook
  const { canvasRef, contextRef } = useCanvas({
    width,
    height,
    ...(onCanvasReady && { onCanvasReady }),
  });

  // Performance monitoring
  const {
    stats: performanceStats,
    devicePerformance,
    warnings,
    clearWarnings,
  } = usePerformanceMonitor(enablePerformanceMonitoring, {
    targetFPS: PERFORMANCE_CONFIG.TARGET_FPS,
    warningThreshold: PERFORMANCE_CONFIG.MIN_FPS_MOBILE,
  });

  /**
   * Game update logic with fixed timestep
   */
  const handleUpdate = useCallback(
    (): void => {
      if (!gameInstance || !isPlaying) return;

      // Control game speed with fixed timestep
      const currentTime = performance.now();
      if (currentTime - lastUpdateTimeRef.current >= GAME_CONFIG.GAME_SPEED) {
        console.log('Game update - moving snake');
        const moveSuccess = gameInstance.move();
        
        if (!moveSuccess) {
          // Game over - stop the game
          console.log('Game over - movement failed');
          setIsPlaying(false);
          return;
        }

        console.log('Snake moved successfully, current position:', gameInstance.getHead());
        lastUpdateTimeRef.current = currentTime;
      }
    },
    [gameInstance, isPlaying]
  );

  /**
   * Render the game state with interpolation for smooth rendering
   */
  const handleRender = useCallback(
    (): void => {
      const context = contextRef.current;
      if (!context || !gameInstance) return;

      // Clear canvas
      clearCanvas(context, width, height);

      // Draw grid (optional based on performance)
      if (devicePerformance !== 'low') {
        drawGrid(context, width, height);
      }

      // Draw border
      drawBorder(context, width, height);

      // Draw snake with potential interpolation
      const snake = gameInstance.getSnake();
      console.log('Rendering snake with segments:', snake.segments.length, 'head at:', snake.segments[0]);
      snake.segments.forEach((segment, index) => {
        drawSnakeSegment(context, segment, GAME_CONFIG.GRID_SIZE, index === 0);
      });
    },
    [contextRef, gameInstance, width, height, devicePerformance]
  );

  /**
   * Handle performance statistics updates
   */
  const handlePerformanceUpdate = useCallback(
    (stats: PerformanceStats) => {
      onPerformanceUpdate?.(stats);

      // Auto-adjust game speed based on performance
      if (stats.fps < PERFORMANCE_CONFIG.MIN_FPS_MOBILE) {
        console.warn('Low FPS detected, consider reducing game complexity');
      }
    },
    [onPerformanceUpdate]
  );

  // Initialize game loop - DISABLED FOR DEBUGGING
  /*
  const gameLoop = useGameLoop(
    useCallback((deltaTime: number, interpolation: number) => {
      console.log('Game loop update called with deltaTime:', deltaTime, 'interpolation:', interpolation);
      handleUpdate();
    }, [handleUpdate]),
    useCallback((interpolation: number) => {
      console.log('Game loop render called with interpolation:', interpolation);
      handleRender();
    }, [handleRender]),
    {
      enabled: isPlaying,
      targetFPS: PERFORMANCE_CONFIG.TARGET_FPS,
      maxDeltaTime: PERFORMANCE_CONFIG.MAX_DELTA_TIME,
      enablePerformanceMonitoring,
      onPerformanceUpdate: handlePerformanceUpdate,
    }
  );
  */

  /**
   * Handle direction changes from keyboard input
   */
  const handleDirectionChange = useCallback(
    (direction: Direction) => {
      if (gameInstance && isPlaying) {
        gameInstance.changeDirection(direction);
      }
    },
    [gameInstance, isPlaying]
  );

  // Set up keyboard input handling
  useKeyboardInput({
    onDirectionChange: handleDirectionChange,
    enabled: isPlaying,
  });

  /**
   * Initialize game when canvas is ready
   */
  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
      // Create game instance
      const game = new SnakeGame(width, height, GAME_CONFIG.GRID_SIZE);
      setGameInstance(game);

      // Make canvas focusable for keyboard events
      canvas.setAttribute('tabindex', '0');
      canvas.focus();

      // Call external ready callbacks
      if (onCanvasReady) {
        onCanvasReady(canvas, context);
      }

      if (onGameReady) {
        onGameReady(game);
      }

      // Initial render - needs to be done after game instance is created
      setTimeout(() => {
        if (game) {
          // Clear canvas
          clearCanvas(context, width, height);
          // Draw grid (optional based on performance)
          if (devicePerformance !== 'low') {
            drawGrid(context, width, height);
          }
          // Draw border
          drawBorder(context, width, height);
          // Draw snake
          const snake = game.getSnake();
          console.log('Initial render - snake segments:', snake.segments);
          snake.segments.forEach((segment, index) => {
            drawSnakeSegment(context, segment, GAME_CONFIG.GRID_SIZE, index === 0);
          });
        }
      }, 100);

      // Auto-start the game for demonstration
      setTimeout(() => {
        console.log('Starting game...');
        setIsPlaying(true);
        
        // Add a simple test interval to move snake manually AND render
        const testInterval = setInterval(() => {
          console.log('Manual test move...');
          if (game) {
            const moveSuccess = game.move();
            console.log('Manual move result:', moveSuccess, 'Head position:', game.getHead());
            
            // Force a render after move
            const snake = game.getSnake();
            clearCanvas(context, width, height);
            if (devicePerformance !== 'low') {
              drawGrid(context, width, height);
            }
            drawBorder(context, width, height);
            snake.segments.forEach((segment, index) => {
              drawSnakeSegment(context, segment, GAME_CONFIG.GRID_SIZE, index === 0);
            });
            
            if (!moveSuccess) {
              clearInterval(testInterval);
            }
          }
        }, 1000); // Slower for debugging

        // Clear test interval after 10 seconds
        setTimeout(() => clearInterval(testInterval), 10000);
      }, 1000);
    },
    [width, height, devicePerformance, onCanvasReady, onGameReady]
  );

  // Update canvas ready handler when dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;

    if (canvas && context) {
      handleCanvasReady(canvas, context);
    }
  }, [handleCanvasReady, canvasRef, contextRef]);

  // Display performance warnings in console
  useEffect(() => {
    if (warnings.length > 0) {
      warnings.forEach(warning => console.warn(`Game Performance: ${warning}`));
      clearWarnings();
    }
  }, [warnings, clearWarnings]);

  return (
    <div className={`game-canvas-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className='game-canvas border-2 border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500'
        style={{
          imageRendering: 'pixelated', // Crisp pixel rendering
          backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
        }}
      />
      
      {/* Performance stats display (development only) - DISABLED FOR DEBUGGING */}
      {/*
      {process.env.NODE_ENV === 'development' && performanceStats && (
        <div className="performance-stats text-sm text-gray-500 mt-2">
          <div>FPS: {performanceStats.fps}</div>
          <div>Frame Time: {performanceStats.averageFrameTime.toFixed(2)}ms</div>
          <div>Device: {devicePerformance}</div>
          <div>Runtime: {gameLoop.getRuntime().toFixed(1)}s</div>
        </div>
      )}
      */}
    </div>
  );
};

export default GameCanvas;
