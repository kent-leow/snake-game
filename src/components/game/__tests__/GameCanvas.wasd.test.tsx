/**
 * Test WASD keyboard support in GameCanvas component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCanvas } from '@/components/game/GameCanvas';
import type { GameEngine } from '@/lib/game/gameEngine';
import type { GameConfig } from '@/lib/rendering';
import type { Direction } from '@/lib/game/types';

// Mock the rendering system
jest.mock('@/lib/rendering', () => ({
  CanvasRenderer: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    resize: jest.fn(),
    destroy: jest.fn(),
  })),
  RenderLoop: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    destroy: jest.fn(),
    isActive: jest.fn().mockReturnValue(true),
  })),
  PerformanceMonitor: jest.fn().mockImplementation(() => ({
    getMetrics: jest.fn().mockReturnValue({
      fps: 60,
      frameTime: 16.67,
      renderTime: 2.5,
    }),
    recordError: jest.fn(),
    destroy: jest.fn(),
  })),
  ResponsiveCanvas: jest.fn().mockImplementation(() => ({
    onResize: jest.fn(),
    resize: jest.fn(),
    destroy: jest.fn(),
  })),
}));

// Mock the mobile components
jest.mock('@/components/mobile', () => ({
  SwipeGestureHandler: ({ children }: any) => <div>{children}</div>,
}));

// Mock the hooks
jest.mock('@/hooks', () => ({
  useResponsiveLayout: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

// Mock the mobile utils
jest.mock('@/lib/mobile', () => ({
  MobileUtils: {
    optimizeCanvasForMobile: jest.fn(),
  },
}));

// Mock game engine
const createMockGameEngine = (): GameEngine => {
  return {
    update: jest.fn(),
    changeDirection: jest.fn(),
    getGameState: jest.fn().mockReturnValue({
      snake: {
        segments: [{ x: 0, y: 0 }],
        direction: 'RIGHT' as Direction,
        isGrowing: false,
      },
      food: null,
      multipleFoods: [],
      useMultipleFood: false,
      score: 0,
      isRunning: true,
    }),
    start: jest.fn(),
    pause: jest.fn(),
    reset: jest.fn(),
    isGameOver: jest.fn().mockReturnValue(false),
  } as unknown as GameEngine;
};

const defaultGameConfig: GameConfig = {
  gridSize: 20,
  canvasWidth: 800,
  canvasHeight: 600,
  gameSpeed: 150,
  enableSound: false,
};

describe('GameCanvas WASD Support', () => {
  let mockGameEngine: GameEngine;
  let mockOnDirectionChange: jest.Mock;

  beforeEach(() => {
    mockGameEngine = createMockGameEngine();
    mockOnDirectionChange = jest.fn();

    // Mock canvas context
    const mockContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: 'start' as CanvasTextAlign,
      textBaseline: 'alphabetic' as CanvasTextBaseline,
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
    };

    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('WASD Key Support', () => {
    it('should handle W key for UP direction', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          onDirectionChange={mockOnDirectionChange}
        />
      );

      const canvas = screen.getByLabelText('Snake game canvas');
      
      fireEvent.keyDown(canvas, { code: 'KeyW' });
      
      expect(mockOnDirectionChange).toHaveBeenCalledWith('UP');
    });

    it('should handle S key for DOWN direction', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          onDirectionChange={mockOnDirectionChange}
        />
      );

      const canvas = screen.getByLabelText('Snake game canvas');
      
      fireEvent.keyDown(canvas, { code: 'KeyS' });
      
      expect(mockOnDirectionChange).toHaveBeenCalledWith('DOWN');
    });

    it('should handle A key for LEFT direction', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          onDirectionChange={mockOnDirectionChange}
        />
      );

      const canvas = screen.getByLabelText('Snake game canvas');
      
      fireEvent.keyDown(canvas, { code: 'KeyA' });
      
      expect(mockOnDirectionChange).toHaveBeenCalledWith('LEFT');
    });

    it('should handle D key for RIGHT direction', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          onDirectionChange={mockOnDirectionChange}
        />
      );

      const canvas = screen.getByLabelText('Snake game canvas');
      
      fireEvent.keyDown(canvas, { code: 'KeyD' });
      
      expect(mockOnDirectionChange).toHaveBeenCalledWith('RIGHT');
    });

    it('should still handle arrow keys correctly', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          onDirectionChange={mockOnDirectionChange}
        />
      );

      const canvas = screen.getByLabelText('Snake game canvas');
      
      // Test all arrow keys
      fireEvent.keyDown(canvas, { code: 'ArrowUp' });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('UP');

      fireEvent.keyDown(canvas, { code: 'ArrowDown' });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('DOWN');

      fireEvent.keyDown(canvas, { code: 'ArrowLeft' });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('LEFT');

      fireEvent.keyDown(canvas, { code: 'ArrowRight' });
      expect(mockOnDirectionChange).toHaveBeenCalledWith('RIGHT');
    });

    it('should handle WASD keys properly', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          onDirectionChange={mockOnDirectionChange}
        />
      );

      const canvas = screen.getByLabelText('Snake game canvas');
      
      // Test that WASD keys trigger direction changes correctly
      fireEvent.keyDown(canvas, { code: 'KeyW' });
      fireEvent.keyDown(canvas, { code: 'KeyA' });
      fireEvent.keyDown(canvas, { code: 'KeyS' });
      fireEvent.keyDown(canvas, { code: 'KeyD' });

      expect(mockOnDirectionChange).toHaveBeenCalledTimes(4);
      expect(mockOnDirectionChange).toHaveBeenCalledWith('UP');
      expect(mockOnDirectionChange).toHaveBeenCalledWith('LEFT');
      expect(mockOnDirectionChange).toHaveBeenCalledWith('DOWN');
      expect(mockOnDirectionChange).toHaveBeenCalledWith('RIGHT');
    });

    it('should ignore non-game keys', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          onDirectionChange={mockOnDirectionChange}
        />
      );

      const canvas = screen.getByLabelText('Snake game canvas');
      
      // Test keys that should be ignored
      fireEvent.keyDown(canvas, { code: 'KeyQ' });
      fireEvent.keyDown(canvas, { code: 'KeyE' });
      fireEvent.keyDown(canvas, { code: 'KeyR' });
      fireEvent.keyDown(canvas, { code: 'KeyT' });
      
      expect(mockOnDirectionChange).not.toHaveBeenCalled();
    });

    it('should work when onDirectionChange is not provided', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
        />
      );

      const canvas = screen.getByLabelText('Snake game canvas');
      
      // Should not crash when onDirectionChange is not provided
      expect(() => {
        fireEvent.keyDown(canvas, { code: 'KeyW' });
        fireEvent.keyDown(canvas, { code: 'KeyS' });
        fireEvent.keyDown(canvas, { code: 'KeyA' });
        fireEvent.keyDown(canvas, { code: 'KeyD' });
      }).not.toThrow();
    });
  });

  describe('Mixed Input Support', () => {
    it('should handle alternating between arrow keys and WASD', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          onDirectionChange={mockOnDirectionChange}
        />
      );

      const canvas = screen.getByLabelText('Snake game canvas');
      
      // Alternate between arrow keys and WASD
      fireEvent.keyDown(canvas, { code: 'ArrowUp' });
      expect(mockOnDirectionChange).toHaveBeenLastCalledWith('UP');

      fireEvent.keyDown(canvas, { code: 'KeyS' });
      expect(mockOnDirectionChange).toHaveBeenLastCalledWith('DOWN');

      fireEvent.keyDown(canvas, { code: 'ArrowLeft' });
      expect(mockOnDirectionChange).toHaveBeenLastCalledWith('LEFT');

      fireEvent.keyDown(canvas, { code: 'KeyD' });
      expect(mockOnDirectionChange).toHaveBeenLastCalledWith('RIGHT');

      expect(mockOnDirectionChange).toHaveBeenCalledTimes(4);
    });
  });
});