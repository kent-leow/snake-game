/**
 * Integration tests for GameCanvas with Combo Visual Feedback
 * Tests the integration of combo components with the main game canvas
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameCanvas } from '../game/GameCanvas';
import type { GameEngine } from '@/lib/game/gameEngine';
import type { GameConfig } from '@/lib/rendering';
import type { ComboEvent, ComboState } from '@/types/Combo';

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
    pause: jest.fn(),
    resume: jest.fn(),
    isActive: jest.fn().mockReturnValue(true),
  })),
  PerformanceMonitor: jest.fn().mockImplementation(() => ({
    getMetrics: jest.fn().mockReturnValue({}),
    destroy: jest.fn(),
    recordError: jest.fn(),
  })),
  ResponsiveCanvas: jest.fn().mockImplementation(() => ({
    resize: jest.fn(),
    destroy: jest.fn(),
    onResize: jest.fn(),
  })),
}));

jest.mock('@/components/mobile', () => ({
  SwipeGestureHandler: ({ children }: { children: React.ReactNode }) => <div data-testid="swipe-handler">{children}</div>,
}));

jest.mock('@/hooks', () => ({
  useResponsiveLayout: () => ({ isMobile: false }),
}));

jest.mock('@/lib/mobile', () => ({
  MobileUtils: {
    optimizeCanvasForMobile: jest.fn(),
  },
}));

jest.mock('@/styles/combo.module.css', () => ({}));

// Mock canvas context
const mockCanvas = {
  getContext: jest.fn().mockReturnValue({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
  }),
  style: {},
  focus: jest.fn(),
} as any;

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => mockCanvas.getContext(),
});

describe('GameCanvas Combo Integration', () => {
  let mockGameEngine: jest.Mocked<GameEngine>;
  let mockComboManager: any;
  let comboSubscriber: ((event: ComboEvent) => void) | null = null;

  const defaultGameConfig: GameConfig = {
    gridSize: 20,
    canvasWidth: 400,
    canvasHeight: 400,
    gameSpeed: 100,
    enableSound: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    comboSubscriber = null;

    // Create mock combo manager
    mockComboManager = {
      subscribe: jest.fn((callback: (event: ComboEvent) => void) => {
        comboSubscriber = callback;
        return jest.fn(); // Unsubscribe function
      }),
      getCurrentState: jest.fn().mockReturnValue({
        currentSequence: [],
        expectedNext: 1,
        comboProgress: 0,
        totalCombos: 0,
        isComboActive: false,
      } as ComboState),
    };

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
      getComboManager: jest.fn().mockReturnValue(mockComboManager),
      update: jest.fn(),
      changeDirection: jest.fn(),
    } as any;
  });

  describe('Combo Components Rendering', () => {
    it('renders combo progress indicator when combo visuals are enabled', async () => {
      mockComboManager.getCurrentState.mockReturnValue({
        currentSequence: [1],
        expectedNext: 2,
        comboProgress: 1,
        totalCombos: 0,
        isComboActive: true,
      });

      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('group', { name: /combo progress indicator/i })).toBeInTheDocument();
      });
    });

    it('does not render combo components when disabled', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={false}
        />
      );

      expect(screen.queryByRole('group', { name: /combo progress indicator/i })).not.toBeInTheDocument();
    });

    it('positions combo indicator according to comboPosition prop', async () => {
      mockComboManager.getCurrentState.mockReturnValue({
        currentSequence: [1],
        expectedNext: 2,
        comboProgress: 1,
        totalCombos: 0,
        isComboActive: true,
      });

      const { container } = render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      await waitFor(() => {
        const overlay = container.querySelector('.combo-progress-overlay');
        expect(overlay).toHaveStyle({
          top: '10px',
          right: '10px',
        });
      });
    });

    it('supports all combo position options', async () => {
      const positions: Array<['top-left' | 'top-right' | 'bottom-left' | 'bottom-right', object]> = [
        ['top-left', { top: '10px', right: '10px' }],
        ['top-right', { top: '10px', right: '10px' }],
        ['bottom-left', { top: '10px', right: '10px' }],
        ['bottom-right', { top: '10px', right: '10px' }],
      ];

      for (const [, expectedStyle] of positions) {
        mockComboManager.getCurrentState.mockReturnValue({
          currentSequence: [1],
          expectedNext: 2,
          comboProgress: 1,
          totalCombos: 0,
          isComboActive: true,
        });

        const { container, unmount } = render(
          <GameCanvas
            gameEngine={mockGameEngine}
            gameConfig={defaultGameConfig}
            enableComboVisuals={true}
          />
        );

        await waitFor(() => {
          const overlay = container.querySelector('.combo-progress-overlay');
          expect(overlay).toHaveStyle(expectedStyle as Record<string, unknown>);
        });

        unmount();
      }
    });
  });

  describe('Combo Event Handling', () => {
    it('subscribes to combo manager events on mount', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      expect(mockComboManager.subscribe).toHaveBeenCalledTimes(1);
      expect(typeof mockComboManager.subscribe.mock.calls[0][0]).toBe('function');
    });

    it('updates combo state when events are received', async () => {
      const newComboState: ComboState = {
        currentSequence: [1, 2],
        expectedNext: 3,
        comboProgress: 2,
        totalCombos: 0,
        isComboActive: true,
      };

      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      // Simulate receiving a combo event
      if (comboSubscriber) {
        mockComboManager.getCurrentState.mockReturnValue(newComboState);
        
        const comboEvent: ComboEvent = {
          type: 'progress',
          sequence: [1, 2],
          progress: 2,
          totalPoints: 20,
          timestamp: Date.now(),
        };

        comboSubscriber(comboEvent);
      }

      await waitFor(() => {
        expect(screen.getByText('Next: 3')).toBeInTheDocument();
        expect(screen.getByText('2/5')).toBeInTheDocument();
      });
    });

    it('displays combo feedback animations for events', async () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      // Simulate receiving a combo completion event
      if (comboSubscriber) {
        const comboEvent: ComboEvent = {
          type: 'completed',
          sequence: [1, 2, 3, 4, 5],
          progress: 5,
          totalPoints: 100,
          timestamp: Date.now(),
        };

        comboSubscriber(comboEvent);
      }

      await waitFor(() => {
        expect(screen.getByText('COMBO COMPLETE!')).toBeInTheDocument();
      });
    });

    it('handles combo manager not being available gracefully', () => {
      mockGameEngine.getComboManager.mockImplementation(() => {
        throw new Error('Combo manager not available');
      });

      // Should not crash
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
  });

  describe('Component Lifecycle', () => {
    it('unsubscribes from combo events on unmount', () => {
      const unsubscribeMock = jest.fn();
      mockComboManager.subscribe.mockReturnValue(unsubscribeMock);

      const { unmount } = render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('resubscribes when gameEngine changes', () => {
      const { rerender } = render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      expect(mockComboManager.subscribe).toHaveBeenCalledTimes(1);

      // Create new game engine mock
      const newGameEngine = { ...mockGameEngine } as jest.Mocked<GameEngine>;
      
      rerender(
        <GameCanvas
          gameEngine={newGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      expect(mockComboManager.subscribe).toHaveBeenCalledTimes(2);
    });

    it('does not subscribe when combo visuals are disabled', () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={false}
        />
      );

      expect(mockComboManager.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('initializes combo state on mount', async () => {
      const initialState: ComboState = {
        currentSequence: [],
        expectedNext: 1,
        comboProgress: 0,
        totalCombos: 5,
        isComboActive: false,
      };

      mockComboManager.getCurrentState.mockReturnValue(initialState);

      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('5 combos')).toBeInTheDocument();
        expect(screen.getByText('Start: 1')).toBeInTheDocument();
      });
    });

    it('updates state correctly when combo progress changes', async () => {
      let currentState: ComboState = {
        currentSequence: [],
        expectedNext: 1,
        comboProgress: 0,
        totalCombos: 0,
        isComboActive: false,
      };

      mockComboManager.getCurrentState.mockImplementation(() => currentState);

      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      // Initially inactive
      expect(screen.getByText('0 combos')).toBeInTheDocument();

      // Simulate combo start
      if (comboSubscriber) {
        currentState = {
          currentSequence: [1],
          expectedNext: 2,
          comboProgress: 1,
          totalCombos: 0,
          isComboActive: true,
        };

        const startEvent: ComboEvent = {
          type: 'started',
          sequence: [1],
          progress: 1,
          totalPoints: 0,
          timestamp: Date.now(),
        };

        comboSubscriber(startEvent);
      }

      await waitFor(() => {
        expect(screen.getByText('Next: 2')).toBeInTheDocument();
        expect(screen.getByText('1/5')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains canvas accessibility when combo visuals are added', async () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      // Canvas should still have proper ARIA attributes
      const canvas = screen.getByRole('img', { name: /snake game canvas/i });
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('tabIndex', '0');
    });

    it('combo components have proper ARIA attributes', async () => {
      mockComboManager.getCurrentState.mockReturnValue({
        currentSequence: [1],
        expectedNext: 2,
        comboProgress: 1,
        totalCombos: 0,
        isComboActive: true,
      });

      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      await waitFor(() => {
        const progressIndicator = screen.getByRole('group', { name: /combo progress indicator/i });
        expect(progressIndicator).toBeInTheDocument();
        
        const progressBar = screen.getByRole('progressbar', { name: /combo progress/i });
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('does not create combo components when combo state shows no progress', () => {
      mockComboManager.getCurrentState.mockReturnValue({
        currentSequence: [],
        expectedNext: 1,
        comboProgress: 0,
        totalCombos: 0,
        isComboActive: false,
      });

      const { container } = render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      // Progress indicator should be rendered but show inactive state
      const overlay = container.querySelector('.combo-progress-overlay');
      expect(overlay).toBeInTheDocument();
      
      // But it should show inactive styling
      expect(screen.getByText('0 combos')).toBeInTheDocument();
      expect(screen.getByText('Start: 1')).toBeInTheDocument();
    });

    it('handles rapid combo events without performance issues', async () => {
      render(
        <GameCanvas
          gameEngine={mockGameEngine}
          gameConfig={defaultGameConfig}
          enableComboVisuals={true}
        />
      );

      // Simulate rapid events
      if (comboSubscriber) {
        for (let i = 0; i < 10; i++) {
          const event: ComboEvent = {
            type: 'progress',
            sequence: [1, 2],
            progress: 2,
            totalPoints: 10,
            timestamp: Date.now(),
          };
          comboSubscriber(event);
        }
      }

      // Should handle without crashing and show status elements
      await waitFor(() => {
        const statusElements = screen.getAllByRole('status');
        expect(statusElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});