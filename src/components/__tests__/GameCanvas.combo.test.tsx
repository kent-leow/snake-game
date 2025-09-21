/**
 * Basic tests for GameCanvas component
 * Since combo functionality has been removed from the canvas, these tests focus on core functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameCanvas } from '../game/GameCanvas';
import type { GameEngine } from '@/lib/game/gameEngine';
import type { GameConfig } from '@/lib/rendering';

// Mock all dependencies
jest.mock('@/lib/rendering', () => ({
  CanvasRenderer: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    resize: jest.fn(),
    destroy: jest.fn(),
  })),
  RenderLoop: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    destroy: jest.fn(),
    isActive: jest.fn().mockReturnValue(false),
  })),
  ResponsiveCanvas: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
  })),
}));

jest.mock('@/lib/mobile', () => ({
  MobileUtils: {
    optimizeCanvasForMobile: jest.fn(),
  },
}));

jest.mock('@/hooks', () => ({
  useResponsiveLayout: jest.fn().mockReturnValue({
    isMobile: false,
  }),
}));

jest.mock('@/components/mobile', () => ({
  SwipeGestureHandler: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('GameCanvas Basic Functionality', () => {
  let mockGameEngine: jest.Mocked<GameEngine>;
  let defaultGameConfig: GameConfig;

  beforeEach(() => {
    // Create mock game engine
    mockGameEngine = {
      getGameState: jest.fn().mockReturnValue({
        snake: [],
        food: null,
        multipleFoods: [],
        useMultipleFood: false,
        score: 0,
        isRunning: true,
      }),
      update: jest.fn(),
      changeDirection: jest.fn(),
    } as any;

    defaultGameConfig = {
      gridSize: 20,
      canvasWidth: 400,
      canvasHeight: 400,
      gameSpeed: 150,
      enableSound: false,
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders canvas element', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
        />
      );

      const canvas = screen.getByRole('img', { name: /snake game canvas/i });
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('renders without loading state interference', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
        />
      );

      // The canvas should render cleanly without loading text interference
      const canvas = screen.getByRole('img', { name: /snake game canvas/i });
      expect(canvas).toBeInTheDocument();
    });

    it('accepts className prop', () => {
      const { container } = render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          className="custom-class"
        />
      );

      const canvasContainer = container.querySelector('.game-canvas-container');
      expect(canvasContainer).toHaveClass('custom-class');
    });
  });

  describe('Props Handling', () => {
    it('handles enableComboVisuals prop without errors', () => {
      expect(() => {
        render(
          <GameCanvas
            gameEngine={mockGameEngine}
            gameConfig={defaultGameConfig}
            enableComboVisuals={true}
          />
        );
      }).not.toThrow();
    });

    it('handles enableTouchControls prop', () => {
      expect(() => {
        render(
          <GameCanvas
            gameEngine={mockGameEngine}
            gameConfig={defaultGameConfig}
            enableTouchControls={false}
          />
        );
      }).not.toThrow();
    });

    it('handles onDirectionChange prop', () => {
      const onDirectionChange = jest.fn();
      
      expect(() => {
        render(
          <GameCanvas
            gameEngine={mockGameEngine}
            gameConfig={defaultGameConfig}
            onDirectionChange={onDirectionChange}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Canvas Focus and Interaction', () => {
    it('makes canvas focusable', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
        />
      );

      const canvas = screen.getByRole('img', { name: /snake game canvas/i });
      expect(canvas).toHaveAttribute('tabIndex', '0');
    });

    it('has proper accessibility attributes', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
        />
      );

      const canvas = screen.getByRole('img', { name: /snake game canvas/i });
      expect(canvas).toHaveAttribute('aria-label', 'Snake game canvas');
    });
  });

  describe('No Combo Components', () => {
    it('does not render combo progress indicator', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      // Combo progress indicator should not be in canvas
      expect(screen.queryByRole('group', { name: /combo progress indicator/i })).not.toBeInTheDocument();
    });

    it('does not render combo feedback animations', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      // No combo feedback animations should be present
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByText(/combo/i)).not.toBeInTheDocument();
    });

    it('does not display score on canvas', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
        />
      );

      // Score should not be displayed on the canvas
      expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
    });
  });
});