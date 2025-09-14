'use client';

import React, { useCallback, useEffect } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { SnakeGame } from '@/lib/game/snake';
import { clearCanvas, drawGrid, drawSnakeSegment, drawBorder } from '@/lib/utils/canvas';
import { GAME_CONFIG } from '@/lib/game/constants';

/**
 * GameCanvas component properties
 */
export interface GameCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void;
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
  // Initialize canvas hook
  const { canvasRef, contextRef } = useCanvas({
    width,
    height,
    ...(onCanvasReady && { onCanvasReady }),
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
   * Initialize game when canvas is ready
   */
  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
      // Create game instance
      const game = new SnakeGame(width, height, GAME_CONFIG.GRID_SIZE);

      // Initial render
      renderGame(context, game);

      // Make canvas focusable for keyboard events
      canvas.setAttribute('tabindex', '0');

      // Call external ready callbacks
      if (onCanvasReady) {
        onCanvasReady(canvas, context);
      }

      if (onGameReady) {
        onGameReady(game);
      }
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

  return (
    <div className={`game-canvas-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="game-canvas border-2 border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        style={{
          imageRendering: 'pixelated', // Crisp pixel rendering
          backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
        }}
      />
    </div>
  );
};

export default GameCanvas;