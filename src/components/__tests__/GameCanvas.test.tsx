import React from 'react';
import { render } from '@testing-library/react';
import { GameCanvas } from '../game/GameCanvas';
import { GameEngine } from '@/lib/game/gameEngine';

// Mock the GameEngine
const createMockGameEngine = () => ({
  getGameState: jest.fn(() => ({
    snake: { 
      segments: [{ x: 100, y: 100, id: 'head' }], 
      direction: 'RIGHT' as const, 
      nextDirection: 'RIGHT' as const, 
      isGrowing: false 
    },
    food: { 
      x: 200, 
      y: 200, 
      type: 'normal' as const, 
      points: 10, 
      id: 'food-1', 
      timestamp: Date.now(), 
      value: 10 
    },
    score: 0,
    isRunning: false,
    snakeLength: 1,
    pendingGrowth: 0,
    gameOverState: { 
      isGameOver: false, 
      cause: null, 
      finalScore: 0, 
      statistics: null 
    }
  })),
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  reset: jest.fn(),
  update: jest.fn(() => true),
  changeDirection: jest.fn(() => true),
} as unknown as GameEngine);

// Default game config for tests
const defaultGameConfig = {
  gridSize: 20,
  gameSpeed: 150,
  enableSound: false,
  canvasWidth: 400,
  canvasHeight: 400,
};

// Mock canvas context
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'left' as CanvasTextAlign,
  textBaseline: 'top' as CanvasTextBaseline,
  imageSmoothingEnabled: true,
  lineCap: 'square' as CanvasLineCap,
  lineJoin: 'miter' as CanvasLineJoin,
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  roundRect: jest.fn(),
  fillText: jest.fn(),
  scale: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  quadraticCurveTo: jest.fn(),
  closePath: jest.fn(),
} as unknown as CanvasRenderingContext2D;

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn((contextId: string): CanvasRenderingContext2D | null => {
  if (contextId === '2d') {
    return mockContext;
  }
  return null;
}) as HTMLCanvasElement['getContext'];

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

describe('GameCanvas Component', () => {
  let mockGameEngine: GameEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGameEngine = createMockGameEngine();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(
        <GameCanvas 
          gameEngine={mockGameEngine} 
          gameConfig={defaultGameConfig} 
        />
      );
    });

    it('should render with custom className', () => {
      const customClass = 'custom-canvas-class';
      render(
        <GameCanvas 
          gameEngine={mockGameEngine} 
          gameConfig={defaultGameConfig}
          className={customClass} 
        />
      );
    });

    it('should render with performance monitoring enabled', () => {
      render(
        <GameCanvas 
          gameEngine={mockGameEngine} 
          gameConfig={defaultGameConfig}
          enablePerformanceMonitoring={true}
        />
      );
    });

    it('should render with touch controls enabled', () => {
      render(
        <GameCanvas 
          gameEngine={mockGameEngine} 
          gameConfig={defaultGameConfig}
          enableTouchControls={true}
        />
      );
    });
  });

  describe('Game Engine Integration', () => {
    it('should call gameEngine.getGameState during render', () => {
      render(
        <GameCanvas 
          gameEngine={mockGameEngine} 
          gameConfig={defaultGameConfig} 
        />
      );
      
      // getGameState might be called during initialization
      expect(mockGameEngine.getGameState).toHaveBeenCalled();
    });

    it('should handle direction changes', () => {
      const onDirectionChange = jest.fn();
      render(
        <GameCanvas 
          gameEngine={mockGameEngine} 
          gameConfig={defaultGameConfig}
          onDirectionChange={onDirectionChange}
        />
      );
      
      // Component should render without errors
      expect(onDirectionChange).not.toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('should accept different target FPS values', () => {
      render(
        <GameCanvas 
          gameEngine={mockGameEngine} 
          gameConfig={defaultGameConfig}
          targetFPS={30}
        />
      );
    });

    it('should accept custom game config', () => {
      const customConfig = {
        ...defaultGameConfig,
        gridSize: 30,
        gameSpeed: 200,
      };
      
      render(
        <GameCanvas 
          gameEngine={mockGameEngine} 
          gameConfig={customConfig}
        />
      );
    });
  });
});