/**
 * @jest-environment jsdom
 */

import { CanvasRenderer, type GameConfig, type GameElements } from '../CanvasRenderer';
import type { Snake, EnhancedFood } from '../../game/types';

// Mock canvas context
const mockContext = {
  scale: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  quadraticCurveTo: jest.fn(),
  closePath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  drawImage: jest.fn(), // Add missing drawImage method
  measureText: jest.fn(() => ({ width: 0 })), // Add missing measureText method
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  save: jest.fn(),
  restore: jest.fn(),
  // Properties
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'top',
  imageSmoothingEnabled: true,
  lineCap: 'butt',
  lineJoin: 'miter',
};

// Mock canvas element
const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  width: 600,
  height: 600,
  style: {},
  parentElement: {
    clientWidth: 800,
    clientHeight: 600,
  },
} as unknown as HTMLCanvasElement;

// Mock document.createElement to return our mock canvas for internal canvases
const originalCreateElement = document.createElement.bind(document);
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement(tagName);
});

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 2,
});

describe('CanvasRenderer', () => {
  let renderer: CanvasRenderer;
  let gameConfig: GameConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    gameConfig = {
      gridSize: 20,
      gameSpeed: 150,
      enableSound: true,
    };
    
    renderer = new CanvasRenderer(mockCanvas, gameConfig);
  });

  afterEach(() => {
    renderer.destroy();
  });

  describe('initialization', () => {
    it('should initialize with canvas and config', () => {
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      // Note: scale is no longer called due to high-DPI fix
      // expect(mockContext.scale).toHaveBeenCalledWith(2, 2); 
    });

    it('should set up canvas optimizations', () => {
      expect(mockContext.imageSmoothingEnabled).toBe(false);
      expect(mockContext.textBaseline).toBe('top');
      expect(mockContext.lineCap).toBe('square');
      expect(mockContext.lineJoin).toBe('miter');
    });

    it('should throw error if canvas context unavailable', () => {
      const badCanvas = {
        getContext: jest.fn(() => null),
        parentElement: { clientWidth: 800, clientHeight: 600 },
      } as unknown as HTMLCanvasElement;

      expect(() => {
        new CanvasRenderer(badCanvas, gameConfig);
      }).toThrow('Failed to get 2D context');
    });
  });

  describe('rendering', () => {
    let gameElements: GameElements;

    beforeEach(() => {
      const mockSnake: Snake = {
        segments: [
          { x: 10, y: 10, id: 'head' },
          { x: 9, y: 10, id: 'body1' },
          { x: 8, y: 10, id: 'body2' },
        ],
        direction: 'RIGHT' as const,
        nextDirection: 'RIGHT' as const,
        isGrowing: false,
      };

      const mockFood: EnhancedFood = {
        x: 15,
        y: 15,
        id: 'food1',
        timestamp: Date.now(),
        value: 10,
        type: 'normal' as const,
        points: 10,
      };

      gameElements = {
        snake: mockSnake,
        food: mockFood,
        score: 100,
        gameState: 'playing' as const,
      };
    });

    it('should render all game elements', () => {
      renderer.render(gameElements);

      // Should clear canvas
      expect(mockContext.fillRect).toHaveBeenCalled();
      
      // Should draw grid
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
      
      // Should draw snake segments
      expect(mockContext.fill).toHaveBeenCalled();
      
      // Should draw food
      expect(mockContext.arc).toHaveBeenCalled();
      
      // Score is no longer drawn on canvas - it's in the UI panel
    });
  });
});