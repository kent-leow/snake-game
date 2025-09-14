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
        const moveSuccess = gameInstance.move();
        
        if (!moveSuccess) {
          // Game over - stop the game
          setIsPlaying(false);
          return;
        }

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

  // Initialize game loop
  const gameLoop = useGameLoop(
    useCallback((_deltaTime: number, _interpolation: number) => handleUpdate(), [handleUpdate]),
    useCallback((_interpolation: number) => handleRender(), [handleRender]),
    {
      enabled: isPlaying,
      targetFPS: PERFORMANCE_CONFIG.TARGET_FPS,
      maxDeltaTime: PERFORMANCE_CONFIG.MAX_DELTA_TIME,
      enablePerformanceMonitoring,
      onPerformanceUpdate: handlePerformanceUpdate,
    }
  );

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

      // Initial render
      handleRender();

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

      // Auto-start the game for demonstration
      setTimeout(() => {
        setIsPlaying(true);
      }, 1000);
    },
    [width, height, handleRender, onCanvasReady, onGameReady]
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
      
      {/* Performance stats display (development only) */}
      {process.env.NODE_ENV === 'development' && performanceStats && (
        <div className="performance-stats text-sm text-gray-500 mt-2">
          <div>FPS: {performanceStats.fps}</div>
          <div>Frame Time: {performanceStats.averageFrameTime.toFixed(2)}ms</div>
          <div>Device: {devicePerformance}</div>
          <div>Runtime: {gameLoop.getRuntime().toFixed(1)}s</div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
