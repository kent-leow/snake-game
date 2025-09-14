'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { useGameOver } from '@/hooks/useGameOver';
import { usePerformanceMonitor, useScore } from '@/hooks';
import { GameEngine, type GameEngineConfig, type GameEngineCallbacks } from '@/lib/game/gameEngine';
import { GameOverModal } from './GameOverModal';
import { CollisionFeedback } from './CollisionFeedback';
import { CompactScoreDisplay } from './ScoreDisplay';
import {
  clearCanvas,
  drawGrid,
  drawSnakeSegment,
  drawBorder,
} from '@/lib/utils/canvas';
import { GAME_CONFIG, PERFORMANCE_CONFIG } from '@/lib/game/constants';
import type { Direction, Position, EnhancedFood } from '@/lib/game/types';
import type { GameOverState } from '@/lib/game/gameOverState';
import type { PerformanceStats } from '@/lib/game/performance';

/**
 * Enhanced GameCanvas component properties
 */
export interface GameCanvasIntegratedProps {
  width?: number;
  height?: number;
  className?: string;
  onScoreChange?: (score: number) => void;
  onGameReady?: () => void;
  onPerformanceUpdate?: (stats: PerformanceStats) => void;
  enablePerformanceMonitoring?: boolean;
}

/**
 * Enhanced GameCanvas component with integrated game over functionality
 * Uses the GameEngine with full game over state management
 */
export const GameCanvas: React.FC<GameCanvasIntegratedProps> = ({
  width = GAME_CONFIG.CANVAS_WIDTH,
  height = GAME_CONFIG.CANVAS_HEIGHT,
  className = '',
  onScoreChange,
  onGameReady,
  onPerformanceUpdate,
  enablePerformanceMonitoring = true,
}) => {
  // Game state
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [collisionFeedback, setCollisionFeedback] = useState<{
    position: Position;
    type: 'boundary' | 'self';
  } | null>(null);
  
  const gameLoopRef = useRef<number | null>(null);

  // Initialize canvas hook
  const { canvasRef, contextRef } = useCanvas({
    width,
    height,
  });

  // Scoring system integration
  const {
    score,
    addFoodScore,
    comboCount,
  } = useScore({
    onScoreChange: (newScore, event) => {
      console.log('Score changed:', newScore, 'Event:', event);
      onScoreChange?.(newScore);
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

  // Game over hook
  const {
    gameOverState,
    resetGameOver,
    isGameOver,
  } = useGameOver({
    onGameOver: (state: GameOverState) => {
      console.log('Game over state changed:', state);
      setIsPlaying(false);
      
      // Show collision feedback if position is available
      if (state.collisionPosition && state.cause) {
        setCollisionFeedback({
          position: state.collisionPosition,
          type: state.cause,
        });
      }
    },
    onRestart: () => {
      console.log('Game restarted via hook');
      setCollisionFeedback(null);
    },
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
   * Game update and render loop
   */
  const gameLoop = useCallback(() => {
    if (!gameEngine || !contextRef.current || !isPlaying || isGameOver) return;

    // Update game state
    const updateSuccess = gameEngine.update();
    
    if (!updateSuccess) {
      // Game over handled by engine
      setIsPlaying(false);
      return;
    }

    // Render game
    const context = contextRef.current;
    const gameState = gameEngine.getGameState();

    // Clear canvas
    clearCanvas(context, width, height);

    // Draw grid and border
    if (devicePerformance !== 'low') {
      drawGrid(context, width, height);
    }
    drawBorder(context, width, height);

    // Draw snake
    gameState.snake.segments.forEach((segment, index) => {
      drawSnakeSegment(context, segment, GAME_CONFIG.GRID_SIZE, index === 0);
    });

    // Draw food
    if (gameState.food) {
      drawFood(context, gameState.food);
    }

    // Continue game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameEngine, contextRef, isPlaying, isGameOver, width, height, devicePerformance, drawFood]);

  /**
   * Start the game loop
   */
  const startGameLoop = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  /**
   * Stop the game loop
   */
  const stopGameLoop = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  /**
   * Handle direction changes from keyboard input
   */
  const handleDirectionChange = useCallback(
    (direction: Direction) => {
      if (gameEngine && isPlaying && !isGameOver) {
        gameEngine.changeDirection(direction);
      }
    },
    [gameEngine, isPlaying, isGameOver]
  );

  // Set up keyboard input handling
  useKeyboardInput({
    onDirectionChange: handleDirectionChange,
    enabled: isPlaying && !isGameOver,
  });

  /**
   * Initialize game engine and callbacks
   */
  useEffect(() => {
    if (!canvasRef.current || !contextRef.current) return;

    const config: GameEngineConfig = {
      canvasWidth: width,
      canvasHeight: height,
      gridSize: GAME_CONFIG.GRID_SIZE,
      initialScore: 0,
      foodSpawnDelay: 100,
    };

    const callbacks: GameEngineCallbacks = {
      onScoreChange: (score) => {
        console.log('Game engine score change:', score);
      },
      onFoodEaten: (food, newLength) => {
        console.log('Food eaten:', food, 'New length:', newLength);
        // Add score through the hook
        addFoodScore(food.value, { x: food.x, y: food.y });
      },
      onGameOver: (finalScore, _snake, cause, collisionPosition) => {
        console.log('Game over callback:', { finalScore, cause, collisionPosition });
        setIsPlaying(false);
      },
      onGameOverStateChange: (state) => {
        console.log('Game over state change callback:', state);
      },
    };

    const engine = new GameEngine(config, callbacks);
    setGameEngine(engine);

    // Make canvas focusable
    canvasRef.current.setAttribute('tabindex', '0');
    canvasRef.current.focus();

    onGameReady?.();

    return () => {
      stopGameLoop();
    };
  }, [canvasRef, contextRef, width, height, addFoodScore, onGameReady, stopGameLoop]);

  /**
   * Start/restart game
   */
  const handleStartGame = useCallback(() => {
    if (!gameEngine) return;

    gameEngine.reset();
    resetGameOver();
    setIsPlaying(true);
    gameEngine.start();
    startGameLoop();
  }, [gameEngine, resetGameOver, startGameLoop]);

  /**
   * Handle game restart from modal
   */
  const handleRestartGame = useCallback(() => {
    handleStartGame();
    setCollisionFeedback(null);
  }, [handleStartGame]);

  /**
   * Handle return to main menu
   */
  const handleMainMenu = useCallback(() => {
    setIsPlaying(false);
    resetGameOver();
    setCollisionFeedback(null);
    stopGameLoop();
    // Navigation to main menu would be handled by parent component
  }, [resetGameOver, stopGameLoop]);

  /**
   * Handle collision feedback animation complete
   */
  const handleCollisionFeedbackComplete = useCallback(() => {
    setCollisionFeedback(null);
  }, []);

  // Start game loop when playing
  useEffect(() => {
    if (isPlaying && !isGameOver) {
      startGameLoop();
    } else {
      stopGameLoop();
    }

    return () => stopGameLoop();
  }, [isPlaying, isGameOver, startGameLoop, stopGameLoop]);

  // Performance warnings
  useEffect(() => {
    if (warnings.length > 0) {
      warnings.forEach(warning => console.warn(`Game Performance: ${warning}`));
      clearWarnings();
    }
  }, [warnings, clearWarnings]);

  // Call performance update callback
  useEffect(() => {
    if (onPerformanceUpdate) {
      // Mock performance stats for now
      const stats: PerformanceStats = {
        fps: 60,
        averageFrameTime: 16.67,
        maxFrameTime: 20,
        minFrameTime: 10,
        totalFrames: 0,
        droppedFrames: 0,
      };
      onPerformanceUpdate(stats);
    }
  }, [onPerformanceUpdate]);

  return (
    <div className={`game-canvas-container relative ${className}`}>
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
          imageRendering: 'pixelated',
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

      {/* Game Over Modal */}
      <GameOverModal
        isVisible={isGameOver}
        finalScore={gameOverState.finalScore}
        cause={gameOverState.cause}
        {...(gameOverState.gameStats && { gameStats: gameOverState.gameStats })}
        onRestart={handleRestartGame}
        onMainMenu={handleMainMenu}
      />

      {/* Collision Feedback */}
      {collisionFeedback && (
        <CollisionFeedback
          position={collisionFeedback.position}
          type={collisionFeedback.type}
          onAnimationComplete={handleCollisionFeedbackComplete}
        />
      )}
    </div>
  );
};

export default GameCanvas;