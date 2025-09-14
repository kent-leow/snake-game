'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { SnakeGame } from '@/lib/game/snake';
import {
  clearCanvas,
  drawGrid,
  drawSnakeSegment,
  drawBorder,
} from '@/lib/utils/canvas';
import { GAME_CONFIG } from '@/lib/game/constants';
import type { Direction } from '@/lib/game/types';

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
}

/**
 * Main game canvas component for rendering the Snake game
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({
  width = GAME_CONFIG.CANVAS_WIDTH,
  height = GAME_CONFIG.CANVAS_HEIGHT,
  className = '',
  onCanvasReady,
  onGameReady,
}) => {
  // Game state
  const [gameInstance, setGameInstance] = useState<SnakeGame | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);

  // Initialize canvas hook
  const { canvasRef, contextRef } = useCanvas({
    width,
    height,
    ...(onCanvasReady && { onCanvasReady }),
  });

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
   * Render the game state on canvas
   */
  const renderGame = useCallback(
    (context: CanvasRenderingContext2D, game: SnakeGame) => {
      // Clear canvas
      clearCanvas(context, width, height);

      // Draw grid (optional - can be toggled)
      drawGrid(context, width, height);

      // Draw border
      drawBorder(context, width, height);

      // Draw snake
      const snake = game.getSnake();
      snake.segments.forEach((segment, index) => {
        drawSnakeSegment(context, segment, GAME_CONFIG.GRID_SIZE, index === 0);
      });
    },
    [width, height]
  );

  /**
   * Game loop for continuous movement
   */
  const gameLoop = useCallback(
    (currentTime: number) => {
      if (!gameInstance || !isPlaying) return;

      // Control game speed
      if (currentTime - lastUpdateTimeRef.current >= GAME_CONFIG.GAME_SPEED) {
        const moveSuccess = gameInstance.move();
        
        if (!moveSuccess) {
          // Game over - stop the game loop
          setIsPlaying(false);
          return;
        }

        // Re-render the game
        const context = contextRef.current;
        if (context) {
          renderGame(context, gameInstance);
        }

        lastUpdateTimeRef.current = currentTime;
      }

      // Continue the game loop
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    },
    [gameInstance, isPlaying, contextRef, renderGame]
  );

  /**
   * Start the game loop
   */
  const startGame = useCallback(() => {
    if (gameInstance) {
      setIsPlaying(true);
      lastUpdateTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameInstance, gameLoop]);

  /**
   * Stop the game loop
   */
  const stopGame = useCallback(() => {
    setIsPlaying(false);
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = undefined;
    }
  }, []);

  /**
   * Initialize game when canvas is ready
   */
  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
      // Create game instance
      const game = new SnakeGame(width, height, GAME_CONFIG.GRID_SIZE);
      setGameInstance(game);

      // Initial render
      renderGame(context, game);

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
      // In a real game, this would be triggered by user action
      setTimeout(() => {
        setIsPlaying(true);
      }, 1000);
    },
    [width, height, renderGame, onCanvasReady, onGameReady]
  );

  // Update canvas ready handler when dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;

    if (canvas && context) {
      handleCanvasReady(canvas, context);
    }
  }, [handleCanvasReady, canvasRef, contextRef]);

  // Start/stop game loop based on playing state
  useEffect(() => {
    if (isPlaying && gameInstance) {
      startGame();
    } else {
      stopGame();
    }

    // Cleanup on unmount
    return () => {
      stopGame();
    };
  }, [isPlaying, gameInstance, startGame, stopGame]);

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
    </div>
  );
};

export default GameCanvas;
