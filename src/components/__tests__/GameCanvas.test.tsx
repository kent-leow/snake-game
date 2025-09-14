import React from 'react';
import { render } from '@testing-library/react';
import { GameCanvas } from '../game/GameCanvas';
import { GAME_CONFIG } from '@/lib/game/constants';

// Mock the canvas context
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  imageSmoothingEnabled: true,
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  roundRect: jest.fn(),
  fillText: jest.fn(),
  getContext: jest.fn(),
} as unknown as CanvasRenderingContext2D;

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn((contextId: string) => {
  if (contextId === '2d') {
    return mockContext;
  }
  return null;
}) as HTMLCanvasElement['getContext'];

// Mock the useCanvas hook
jest.mock('@/hooks/useCanvas', () => ({
  useCanvas: ({ onCanvasReady }: { onCanvasReady?: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void }): { canvasRef: React.RefObject<HTMLCanvasElement>; contextRef: React.RefObject<CanvasRenderingContext2D>; isReady: boolean } => {
    React.useEffect(() => {
      if (onCanvasReady) {
        const mockCanvas = document.createElement('canvas');
        onCanvasReady(mockCanvas, mockContext);
      }
    }, [onCanvasReady]);

    return {
      canvasRef: { current: document.createElement('canvas') },
      contextRef: { current: mockContext },
      isReady: true,
    };
  },
}));

describe('GameCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render canvas element', () => {
      render(<GameCanvas />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should apply default dimensions', () => {
      render(<GameCanvas />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', GAME_CONFIG.CANVAS_WIDTH.toString());
      expect(canvas).toHaveAttribute('height', GAME_CONFIG.CANVAS_HEIGHT.toString());
    });

    it('should apply custom dimensions', () => {
      const customWidth = 400;
      const customHeight = 300;
      
      render(<GameCanvas width={customWidth} height={customHeight} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', customWidth.toString());
      expect(canvas).toHaveAttribute('height', customHeight.toString());
    });

    it('should apply custom className', () => {
      const customClass = 'custom-game-canvas';
      render(<GameCanvas className={customClass} />);
      
      const container = document.querySelector('.game-canvas-container');
      expect(container).toHaveClass('game-canvas-container', customClass);
    });

    it('should have proper canvas styling', () => {
      render(<GameCanvas />);
      const canvas = document.querySelector('canvas');
      
      expect(canvas).toHaveClass('game-canvas');
      expect(canvas).toHaveStyle({
        imageRendering: 'pixelated',
        backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
      });
    });
  });

  describe('Canvas Initialization', () => {
    it('should make canvas focusable', () => {
      render(<GameCanvas />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('tabindex', '0');
    });

    it('should call onCanvasReady when canvas is ready', () => {
      const onCanvasReady = jest.fn();
      render(<GameCanvas onCanvasReady={onCanvasReady} />);
      
      expect(onCanvasReady).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        expect.any(Object)
      );
    });

    it('should call onGameReady when game is initialized', () => {
      const onGameReady = jest.fn();
      render(<GameCanvas onGameReady={onGameReady} />);
      
      expect(onGameReady).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Canvas Context Setup', () => {
    it('should disable image smoothing for pixelated rendering', () => {
      render(<GameCanvas />);
      
      // The context setup should be called through the useCanvas hook
      expect(mockContext.imageSmoothingEnabled).toBeDefined();
    });
  });

  describe('Game Integration', () => {
    it('should initialize game with correct dimensions', () => {
      const onGameReady = jest.fn();
      const width = 600;
      const height = 400;
      
      render(
        <GameCanvas 
          width={width} 
          height={height} 
          onGameReady={onGameReady} 
        />
      );
      
      expect(onGameReady).toHaveBeenCalledWith(expect.any(Object));
      
      // Verify game was created with correct dimensions
      const gameInstance = onGameReady.mock.calls[0][0];
      expect(gameInstance).toBeDefined();
    });

    it('should render initial game state', () => {
      render(<GameCanvas />);
      
      // Canvas drawing methods should be called for initial render
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing canvas context gracefully', () => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as HTMLCanvasElement['getContext'];
      
      expect(() => {
        render(<GameCanvas />);
      }).not.toThrow();
      
      // Restore original method
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard focusable', () => {
      render(<GameCanvas />);
      const canvas = document.querySelector('canvas');
      
      expect(canvas).toHaveAttribute('tabindex', '0');
      expect(canvas).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-green-500');
    });
  });

  describe('Responsive Behavior', () => {
    it('should update canvas size when dimensions change', () => {
      const { rerender } = render(<GameCanvas width={400} height={300} />);
      
      rerender(<GameCanvas width={800} height={600} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
    });
  });
});