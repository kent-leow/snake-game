'use client';

import React from 'react';
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
  onGameReady?: () => void;
  onPerformanceUpdate?: (stats: PerformanceStats) => void;
  enablePerformanceMonitoring?: boolean;
}

/**
 * Basic GameCanvas component - replaced by GameCanvasIntegrated
 * This is kept for backward compatibility
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({
  width = 800,
  height = 600,
  className = '',
}) => {
  return (
    <div className={`game-canvas-container ${className}`}>
      <canvas
        width={width}
        height={height}
        className='game-canvas border-2 border-gray-600 rounded'
        style={{
          imageRendering: 'pixelated',
          backgroundColor: '#0a0a0a',
        }}
      />
      <div className="mt-4 text-center text-gray-500">
        Basic GameCanvas - use GameCanvasIntegrated for full functionality
      </div>
    </div>
  );
};

export default GameCanvas;
