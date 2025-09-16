import { NumberedFoodRenderer } from '../NumberedFoodRenderer';
import type { NumberedFood } from '../multipleFoodTypes';

// Mock canvas context
const createMockContext = (): CanvasRenderingContext2D => {
  let fillStyleValue = '';
  let textAlignValue: CanvasTextAlign = 'start';
  let textBaselineValue: CanvasTextBaseline = 'alphabetic';
  
  const mockContext = {
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    get fillStyle() { return fillStyleValue; },
    set fillStyle(value: string) { fillStyleValue = value; },
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    get textAlign() { return textAlignValue; },
    set textAlign(value: CanvasTextAlign) { textAlignValue = value; },
    get textBaseline() { return textBaselineValue; },
    set textBaseline(value: CanvasTextBaseline) { textBaselineValue = value; },
  } as unknown as CanvasRenderingContext2D;
  
  return mockContext;
};

describe('NumberedFoodRenderer', () => {
  let renderer: NumberedFoodRenderer;
  let mockContext: CanvasRenderingContext2D;
  const gridSize = 20;

  beforeEach(() => {
    mockContext = createMockContext();
    renderer = new NumberedFoodRenderer(mockContext, gridSize);
  });

  describe('initialization', () => {
    it('should create renderer with default options', () => {
      const options = renderer.getOptions();
      
      expect(options.enableAnimation).toBe(true);
      expect(options.enableBorder).toBe(true);
      expect(options.borderColor).toBe('#ffffff');
      expect(options.fontSize).toBeGreaterThan(0);
    });

    it('should create renderer with custom options', () => {
      const customRenderer = new NumberedFoodRenderer(mockContext, gridSize, {
        enableAnimation: false,
        borderColor: '#ff0000',
        fontSize: 16,
      });
      
      const options = customRenderer.getOptions();
      expect(options.enableAnimation).toBe(false);
      expect(options.borderColor).toBe('#ff0000');
      expect(options.fontSize).toBe(16);
    });
  });

  describe('renderNumberedFood', () => {
    const sampleFood: NumberedFood = {
      id: 'food-1',
      number: 1,
      position: { x: 100, y: 100 },
      color: '#FF6B6B',
      timestamp: Date.now(),
      value: 10,
    };

    it('should render food with static mode', () => {
      renderer.updateOptions({ enableAnimation: false });
      
      renderer.renderNumberedFood(sampleFood, 0);
      
      // Should draw background
      expect(mockContext.fillRect).toHaveBeenCalledWith(100, 100, 20, 20);
      
      // Should draw border if enabled
      expect(mockContext.strokeRect).toHaveBeenCalled();
      
      // Should draw number text
      expect(mockContext.fillText).toHaveBeenCalledWith('1', expect.any(Number), expect.any(Number));
    });

    it('should render food with animation mode', () => {
      renderer.updateOptions({ enableAnimation: true });
      
      renderer.renderNumberedFood(sampleFood, 16);
      
      // Should still draw all elements
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalledWith('1', expect.any(Number), expect.any(Number));
    });

    it('should render food without border when disabled', () => {
      renderer.updateOptions({ enableBorder: false });
      
      renderer.renderNumberedFood(sampleFood, 0);
      
      // Should draw background but no border
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).not.toHaveBeenCalled();
    });

    it('should use food color for background', () => {
      // Track all fillStyle values set during rendering
      const fillStyleValues: string[] = [];
      let fillStyleValue = '';
      
      Object.defineProperty(mockContext, 'fillStyle', {
        get: () => fillStyleValue,
        set: (value: string) => {
          fillStyleValue = value;
          fillStyleValues.push(value);
        },
        configurable: true,
      });
      
      renderer.renderNumberedFood(sampleFood, 0);
      
      // Food color should have been used at some point during rendering
      expect(fillStyleValues).toContain('#FF6B6B');
    });
  });

  describe('renderMultipleNumberedFoods', () => {
    const multipleFoods: NumberedFood[] = [
      {
        id: 'food-1',
        number: 1,
        position: { x: 0, y: 0 },
        color: '#FF6B6B',
        timestamp: Date.now(),
        value: 10,
      },
      {
        id: 'food-2',
        number: 2,
        position: { x: 20, y: 20 },
        color: '#4ECDC4',
        timestamp: Date.now(),
        value: 20,
      },
      {
        id: 'food-3',
        number: 3,
        position: { x: 40, y: 40 },
        color: '#45B7D1',
        timestamp: Date.now(),
        value: 30,
      },
    ];

    it('should render all foods', () => {
      renderer.renderMultipleNumberedFoods(multipleFoods, 16);
      
      // Should render each food once
      expect(mockContext.fillRect).toHaveBeenCalledTimes(3);
      expect(mockContext.fillText).toHaveBeenCalledWith('1', expect.any(Number), expect.any(Number));
      expect(mockContext.fillText).toHaveBeenCalledWith('2', expect.any(Number), expect.any(Number));
      expect(mockContext.fillText).toHaveBeenCalledWith('3', expect.any(Number), expect.any(Number));
    });

    it('should handle empty food array', () => {
      renderer.renderMultipleNumberedFoods([], 16);
      
      // Should not throw and not render anything
      expect(mockContext.fillRect).not.toHaveBeenCalled();
      expect(mockContext.fillText).not.toHaveBeenCalled();
    });
  });

  describe('animation state', () => {
    it('should update animation state with delta time', () => {
      const initialState = renderer.getAnimationState();
      
      renderer.renderNumberedFood({
        id: 'food-1',
        number: 1,
        position: { x: 0, y: 0 },
        color: '#FF6B6B',
        timestamp: Date.now(),
        value: 10,
      }, 16);
      
      const updatedState = renderer.getAnimationState();
      expect(updatedState.time).toBeGreaterThan(initialState.time);
    });

    it('should reset animation state', () => {
      // Update animation state
      renderer.renderNumberedFood({
        id: 'food-1',
        number: 1,
        position: { x: 0, y: 0 },
        color: '#FF6B6B',
        timestamp: Date.now(),
        value: 10,
      }, 100);
      
      const stateAfterRender = renderer.getAnimationState();
      expect(stateAfterRender.time).toBeGreaterThan(0);
      
      renderer.resetAnimation();
      const stateAfterReset = renderer.getAnimationState();
      expect(stateAfterReset.time).toBe(0);
    });
  });

  describe('configuration updates', () => {
    it('should update grid size', () => {
      renderer.updateGridSize(30);
      
      const options = renderer.getOptions();
      expect(options.fontSize).toBe(Math.max(10, Math.floor(30 * 0.4)));
    });

    it('should update canvas context', () => {
      const newMockContext = createMockContext();
      renderer.updateContext(newMockContext);
      
      // Render something to verify new context is used
      renderer.renderNumberedFood({
        id: 'food-1',
        number: 1,
        position: { x: 0, y: 0 },
        color: '#FF6B6B',
        timestamp: Date.now(),
        value: 10,
      }, 0);
      
      expect(newMockContext.fillRect).toHaveBeenCalled();
    });

    it('should update rendering options', () => {
      renderer.updateOptions({
        enableShadow: true,
        borderColor: '#00ff00',
        fontSize: 18,
      });
      
      const options = renderer.getOptions();
      expect(options.enableShadow).toBe(true);
      expect(options.borderColor).toBe('#00ff00');
      expect(options.fontSize).toBe(18);
    });

    it('should recalculate font size when grid size changes in options', () => {
      renderer.updateGridSize(40);
      renderer.updateOptions({ enableAnimation: false }); // Update without fontSize
      
      const options = renderer.getOptions();
      expect(options.fontSize).toBe(Math.max(10, Math.floor(40 * 0.4)));
    });
  });

  describe('text rendering', () => {
    it('should set correct text properties during rendering', () => {
      const food: NumberedFood = {
        id: 'food-5',
        number: 5,
        position: { x: 100, y: 100 },
        color: '#98D8C8',
        timestamp: Date.now(),
        value: 50,
      };
      
      // Capture the text align and baseline during the fillText call
      let capturedTextAlign: CanvasTextAlign | undefined;
      let capturedTextBaseline: CanvasTextBaseline | undefined;
      
      (mockContext.fillText as jest.Mock).mockImplementation(() => {
        capturedTextAlign = mockContext.textAlign;
        capturedTextBaseline = mockContext.textBaseline;
      });
      
      renderer.renderNumberedFood(food, 0);
      
      // Should have called fillText with correct properties
      expect(capturedTextAlign).toBe('center');
      expect(capturedTextBaseline).toBe('middle');
      expect(mockContext.fillText).toHaveBeenCalledWith('5', 110, 110); // center of 20x20 grid at (100,100)
    });

    it('should render text shadow for better visibility', () => {
      const food: NumberedFood = {
        id: 'food-1',
        number: 1,
        position: { x: 0, y: 0 },
        color: '#FF6B6B',
        timestamp: Date.now(),
        value: 10,
      };
      
      renderer.renderNumberedFood(food, 0);
      
      // Should render shadow (offset) and main text
      expect(mockContext.fillText).toHaveBeenCalledTimes(2);
    });

    it('should reset text properties after rendering', () => {
      const food: NumberedFood = {
        id: 'food-1',
        number: 1,
        position: { x: 0, y: 0 },
        color: '#FF6B6B',
        timestamp: Date.now(),
        value: 10,
      };
      
      renderer.renderNumberedFood(food, 0);
      
      // Should reset text alignment
      expect(mockContext.textAlign).toBe('start');
      expect(mockContext.textBaseline).toBe('alphabetic');
    });
  });

  describe('edge cases', () => {
    it('should handle minimum grid size', () => {
      const smallRenderer = new NumberedFoodRenderer(mockContext, 5);
      const options = smallRenderer.getOptions();
      
      // Font size should not go below minimum
      expect(options.fontSize).toBe(10);
    });

    it('should handle very large grid size', () => {
      const largeRenderer = new NumberedFoodRenderer(mockContext, 100);
      const options = largeRenderer.getOptions();
      
      expect(options.fontSize).toBe(40); // 100 * 0.4
    });

    it('should handle food at canvas boundaries', () => {
      const edgeFood: NumberedFood = {
        id: 'food-edge',
        number: 1,
        position: { x: 0, y: 0 },
        color: '#FF6B6B',
        timestamp: Date.now(),
        value: 10,
      };
      
      expect(() => {
        renderer.renderNumberedFood(edgeFood, 0);
      }).not.toThrow();
    });

    it('should handle negative delta time', () => {
      const food: NumberedFood = {
        id: 'food-1',
        number: 1,
        position: { x: 0, y: 0 },
        color: '#FF6B6B',
        timestamp: Date.now(),
        value: 10,
      };
      
      expect(() => {
        renderer.renderNumberedFood(food, -16);
      }).not.toThrow();
    });
  });
});