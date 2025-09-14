'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { usePerformanceMonitor, useScore } from '@/hooks';
import { GameEngine } from '@/lib/game/gameEngine';
import { CompactScoreDisplay } from './ScoreDisplay';
import {
  clearCanvas,
  drawGrid,
  drawSnakeSegment,
  drawBorder,
} from '@/lib/utils/canvas';
import { GAME_CONFIG, PERFORMANCE_CONFIG } from '@/lib/game/constants';
import type { Direction, EnhancedFood } from '@/lib/game/types';
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
  onGameReady?: (game: GameEngine) => void;
  onPerformanceUpdate?: (stats: PerformanceStats) => void;
  enablePerformanceMonitoring?: boolean;
}

/**
 * Main game canvas component for rendering the Snake game with integrated scoring and growth
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
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize canvas hook
  const { canvasRef, contextRef } = useCanvas({
    width,
    height,
    ...(onCanvasReady && { onCanvasReady }),
  });

  // Scoring system integration
  const {
    score,
    addFoodScore,
    comboCount,
  } = useScore({
    onScoreChange: (newScore, event) => {
      console.log('Score changed:', newScore, 'Event:', event);
    },
  });

  // Performance monitoring
  const {
    devicePerformance,
    warnings,
    clearWarnings,
  } = usePerformanceMonitor(enablePerformanceMonitoring, {
    targetFPS: PERFORMANCE_CONFIG.TARGET_FPS,
    warningThreshold: PERFORMANCE_CONFIG.MIN_FPS_MOBILE,
  });

  /**
   * Draw food on canvas
   */
  const drawFood = useCallback((
    context: CanvasRenderingContext2D,
    food: EnhancedFood
  ): void => {
    const foodSize = GAME_CONFIG.GRID_SIZE - 4; // Slightly smaller than grid
    const centerX = food.x + GAME_CONFIG.GRID_SIZE / 2;
    const centerY = food.y + GAME_CONFIG.GRID_SIZE / 2;

    context.save();
    
    // Food color based on type
    if (food.type === 'special') {
      context.fillStyle = '#FFD700'; // Gold for special food
      context.strokeStyle = '#FFA500';
    } else {
      context.fillStyle = '#FF6B6B'; // Red for normal food
      context.strokeStyle = '#FF5252';
    }

    context.lineWidth = 2;
    
    // Draw food as circle
    context.beginPath();
    context.arc(centerX, centerY, foodSize / 2, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    
    context.restore();
  }, []);

  /**
   * Handle direction changes from keyboard input
   */
  const handleDirectionChange = useCallback(
    (direction: Direction) => {
      if (gameEngine && isPlaying) {
        gameEngine.changeDirection(direction);
      }
    },
    [gameEngine, isPlaying]
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
      // Create game engine instance
      const engine = new GameEngine(
        {
          canvasWidth: width,
          canvasHeight: height,
          gridSize: GAME_CONFIG.GRID_SIZE,
          initialScore: 0,
          foodSpawnDelay: 100,
        },
        {
          onScoreChange: (newScore, event) => {
            // Integration with useScore hook would happen here
            console.log('Game engine score change:', newScore, event);
          },
          onFoodEaten: (food, newLength) => {
            console.log('Food eaten:', food, 'New length:', newLength);
            // Add score through the hook
            addFoodScore(food.value, { x: food.x, y: food.y });
          },
          onGameOver: (finalScore, snake) => {
            console.log('Game over:', finalScore, snake);
            setIsPlaying(false);
          },
        }
      );

      setGameEngine(engine);

      // Make canvas focusable for keyboard events
      canvas.setAttribute('tabindex', '0');
      canvas.focus();

      // Call external ready callbacks
      if (onCanvasReady) {
        onCanvasReady(canvas, context);
      }

      if (onGameReady) {
        onGameReady(engine);
      }

      // Initial render
      setTimeout(() => {
        if (engine) {
          const gameState = engine.getGameState();
          
          // Clear canvas
          clearCanvas(context, width, height);
          // Draw grid
          if (devicePerformance !== 'low') {
            drawGrid(context, width, height);
          }
          // Draw border
          drawBorder(context, width, height);
          // Draw snake
          gameState.snake.segments.forEach((segment, index) => {
            drawSnakeSegment(context, segment, GAME_CONFIG.GRID_SIZE, index === 0);
          });
          // Draw food
          if (gameState.food) {
            drawFood(context, gameState.food);
          }
        }
      }, 100);

      // Auto-start the game for demonstration
      setTimeout(() => {
        console.log('Starting game...');
        engine.start();
        setIsPlaying(true);
        
        // Add a simple test interval to update and render
        const gameInterval = setInterval(() => {
          if (engine && isPlaying) {
            const updateSuccess = engine.update();
            
            if (updateSuccess) {
              // Render after update
              const gameState = engine.getGameState();
              clearCanvas(context, width, height);
              if (devicePerformance !== 'low') {
                drawGrid(context, width, height);
              }
              drawBorder(context, width, height);
              gameState.snake.segments.forEach((segment, index) => {
                drawSnakeSegment(context, segment, GAME_CONFIG.GRID_SIZE, index === 0);
              });
              if (gameState.food) {
                drawFood(context, gameState.food);
              }
            } else {
              clearInterval(gameInterval);
              setIsPlaying(false);
            }
          }
        }, GAME_CONFIG.GAME_SPEED);

        // Clear interval after 30 seconds
        setTimeout(() => clearInterval(gameInterval), 30000);
      }, 1000);
    },
    [width, height, devicePerformance, onCanvasReady, onGameReady, addFoodScore, drawFood, isPlaying]
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
      {/* Score Display */}
      <div className="absolute top-4 left-4 z-10">
        <CompactScoreDisplay score={score} />
        {comboCount > 1 && (
          <div className="mt-2 text-yellow-400 font-bold text-sm">
            {comboCount}x COMBO!
          </div>
        )}
      </div>

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

      {/* Game Info */}
      {gameEngine && (
        <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-400 font-mono">
          <div>Length: {gameEngine.getGameState().snakeLength}</div>
          <div>Pending Growth: {gameEngine.getGameState().pendingGrowth}</div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;