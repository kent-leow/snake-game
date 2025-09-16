/**
 * Comprehensive unit tests for FoodRenderer
 * Tests responsiveness, accessibility, performance, and visual quality
 */

import { FoodRenderer, type FoodRenderConfig } from '@/game/FoodRenderer';
import type { NumberedFood } from '@/lib/game/multipleFoodTypes';

// Mock Canvas API
const createMockContext = (): CanvasRenderingContext2D => {
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
    arc: jest.fn(),
    beginPath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    clearRect: jest.fn(),
  } as unknown as CanvasRenderingContext2D;

  return mockContext;
};

const createSampleFood = (number: 1 | 2 | 3 | 4 | 5): NumberedFood => ({
  id: `food-${number}`,
  number,
  position: { x: 100, y: 100 },
  color: '#FF6B6B',
  timestamp: Date.now(),
  value: number * 10,
});

describe('FoodRenderer', () => {
  let renderer: FoodRenderer;
  let mockContext: CanvasRenderingContext2D;
  const gridSize = 20;

  beforeEach(() => {
    mockContext = createMockContext();
    renderer = new FoodRenderer(mockContext, gridSize);
  });

  afterEach(() => {
    renderer.destroy();
  });

  describe('initialization', () => {
    it('should create renderer with default configuration', () => {
      const config = renderer.getConfig();
      
      expect(config.fontSize).toBeGreaterThan(0);
      expect(config.fontFamily).toBe('Arial, sans-serif');
      expect(config.borderWidth).toBe(2);
      expect(config.enableShadow).toBe(true);
      expect(config.enableAnimation).toBe(true);
      expect(config.colorScheme).toBe('default');
    });

    it('should create renderer with custom configuration', () => {
      const customConfig: Partial<FoodRenderConfig> = {
        enableAnimation: false,
        enableShadow: false,
        borderWidth: 3,
        colorScheme: 'high-contrast',
      };

      const customRenderer = new FoodRenderer(mockContext, gridSize, customConfig);
      const config = customRenderer.getConfig();

      expect(config.enableAnimation).toBe(false);
      expect(config.enableShadow).toBe(false);
      expect(config.borderWidth).toBe(3);
      expect(config.colorScheme).toBe('high-contrast');

      customRenderer.destroy();
    });

    it('should calculate responsive font size correctly', () => {
      const smallRenderer = new FoodRenderer(mockContext, 10);
      const largeRenderer = new FoodRenderer(mockContext, 50);

      const smallConfig = smallRenderer.getConfig();
      const largeConfig = largeRenderer.getConfig();

      expect(smallConfig.fontSize).toBeGreaterThanOrEqual(10); // Minimum size
      expect(largeConfig.fontSize).toBeGreaterThan(smallConfig.fontSize);

      smallRenderer.destroy();
      largeRenderer.destroy();
    });
  });

  describe('single food rendering', () => {
    it('should render food without animation', () => {
      const food = createSampleFood(1);
      renderer.updateConfig({ enableAnimation: false });

      renderer.renderFood(food, 0);

      // Should draw background
      expect(mockContext.fillRect).toHaveBeenCalled();
      
      // Should draw border if enabled
      expect(mockContext.strokeRect).toHaveBeenCalled();
      
      // Should draw number text
      expect(mockContext.fillText).toHaveBeenCalledWith('1', expect.any(Number), expect.any(Number));
    });

    it('should render food with animation', () => {
      const food = createSampleFood(2);
      renderer.updateConfig({ enableAnimation: true });

      renderer.renderFood(food, 16);

      // Should draw background and border
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
      
      // Should draw number text
      expect(mockContext.fillText).toHaveBeenCalledWith('2', expect.any(Number), expect.any(Number));
    });

    it('should draw shadow when enabled', () => {
      const food = createSampleFood(3);
      renderer.updateConfig({ enableShadow: true });

      renderer.renderFood(food, 0);

      // Should draw shadow (additional fillRect calls)
      expect(mockContext.fillRect).toHaveBeenCalledTimes(2); // Background + shadow
      expect(mockContext.fillText).toHaveBeenCalledTimes(2); // Text + shadow
    });

    it('should not draw shadow when disabled', () => {
      const food = createSampleFood(4);
      renderer.updateConfig({ enableShadow: false });

      renderer.renderFood(food, 0);

      // Should only draw background (no shadow)
      expect(mockContext.fillRect).toHaveBeenCalledTimes(1);
      expect(mockContext.fillText).toHaveBeenCalledTimes(1);
    });

    it('should handle edge positions correctly', () => {
      const edgeFood: NumberedFood = {
        ...createSampleFood(5),
        position: { x: 0, y: 0 },
      };

      expect(() => {
        renderer.renderFood(edgeFood, 0);
      }).not.toThrow();

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });
  });

  describe('multiple food rendering', () => {
    it('should render multiple foods efficiently', () => {
      const foods: NumberedFood[] = [
        createSampleFood(1),
        createSampleFood(2),
        createSampleFood(3),
        createSampleFood(4),
        createSampleFood(5),
      ];

      renderer.renderMultipleFoods(foods, 16);

      // Should render all foods
      expect(mockContext.fillRect).toHaveBeenCalledTimes(10); // 5 foods * 2 (background + shadow)
      expect(mockContext.fillText).toHaveBeenCalledTimes(10); // 5 foods * 2 (text + shadow)
    });

    it('should handle empty food array', () => {
      expect(() => {
        renderer.renderMultipleFoods([], 0);
      }).not.toThrow();

      expect(mockContext.fillRect).not.toHaveBeenCalled();
      expect(mockContext.fillText).not.toHaveBeenCalled();
    });

    it('should track rendering metrics', () => {
      const foods = [createSampleFood(1), createSampleFood(2)];
      
      renderer.resetMetrics();
      renderer.renderMultipleFoods(foods, 16);

      const metrics = renderer.getMetrics();
      expect(metrics.foodsRendered).toBe(2);
      expect(metrics.renderTime).toBeGreaterThan(0);
    });
  });

  describe('responsive design', () => {
    it('should update grid size and recalculate font size', () => {
      const initialConfig = renderer.getConfig();
      const initialFontSize = initialConfig.fontSize;

      renderer.updateGridSize(40); // Double the grid size

      const updatedConfig = renderer.getConfig();
      expect(updatedConfig.fontSize).toBeGreaterThan(initialFontSize);
    });

    it('should maintain minimum font size on small grids', () => {
      renderer.updateGridSize(5); // Very small grid

      const config = renderer.getConfig();
      expect(config.fontSize).toBeGreaterThanOrEqual(10); // Minimum readable size
    });

    it('should update context when needed', () => {
      const newMockContext = createMockContext();
      
      expect(() => {
        renderer.updateContext(newMockContext);
      }).not.toThrow();

      // Render something to verify context is updated
      const food = createSampleFood(1);
      renderer.renderFood(food, 0);

      expect(newMockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('accessibility features', () => {
    it('should support different color schemes', () => {
      renderer.updateConfig({ colorScheme: 'high-contrast' });
      const config = renderer.getConfig();
      
      expect(config.colorScheme).toBe('high-contrast');
      expect(config.colors[1]).toBeTruthy();
      expect(config.colors[5]).toBeTruthy();
    });

    it('should provide protanopia color scheme', () => {
      renderer.updateConfig({ colorScheme: 'protanopia' });
      const config = renderer.getConfig();
      
      expect(config.colorScheme).toBe('protanopia');
      expect(Object.keys(config.colors)).toHaveLength(5);
    });

    it('should provide deuteranopia color scheme', () => {
      renderer.updateConfig({ colorScheme: 'deuteranopia' });
      const config = renderer.getConfig();
      
      expect(config.colorScheme).toBe('deuteranopia');
      expect(Object.keys(config.colors)).toHaveLength(5);
    });

    it('should use high contrast text and borders', () => {
      const food = createSampleFood(1);
      renderer.renderFood(food, 0);

      // Verify text color is set for visibility
      expect(mockContext.fillStyle).toContain('#'); // Should be a valid color
    });
  });

  describe('performance optimization', () => {
    it('should cache font strings for performance', () => {
      const food1 = createSampleFood(1);
      const food2 = createSampleFood(1); // Same number

      renderer.renderFood(food1, 0);
      renderer.renderFood(food2, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.cacheHits).toBeGreaterThan(0);
    });

    it('should track cache misses for new numbers', () => {
      renderer.resetMetrics();
      
      const foods = [
        createSampleFood(1),
        createSampleFood(2),
        createSampleFood(3),
      ];

      foods.forEach(food => renderer.renderFood(food, 0));

      const metrics = renderer.getMetrics();
      // Initially all are cache misses since metrics were reset
      expect(metrics.cacheMisses).toBeGreaterThanOrEqual(0);
      expect(metrics.foodsRendered).toBe(3);
    });

    it('should reset metrics correctly', () => {
      const food = createSampleFood(1);
      renderer.renderFood(food, 0);

      let metrics = renderer.getMetrics();
      expect(metrics.foodsRendered).toBeGreaterThan(0);

      renderer.resetMetrics();
      metrics = renderer.getMetrics();
      
      expect(metrics.foodsRendered).toBe(0);
      expect(metrics.renderTime).toBe(0);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
    });
  });

  describe('bounds checking', () => {
    it('should correctly identify food within bounds', () => {
      const food = createSampleFood(1);
      const canvasWidth = 800;
      const canvasHeight = 600;

      const isWithinBounds = renderer.isWithinBounds(food, canvasWidth, canvasHeight);
      expect(isWithinBounds).toBe(true);
    });

    it('should correctly identify food outside bounds', () => {
      const food: NumberedFood = {
        ...createSampleFood(1),
        position: { x: 900, y: 700 }, // Outside canvas
      };
      const canvasWidth = 800;
      const canvasHeight = 600;

      const isWithinBounds = renderer.isWithinBounds(food, canvasWidth, canvasHeight);
      expect(isWithinBounds).toBe(false);
    });

    it('should handle edge case positions', () => {
      const foods: NumberedFood[] = [
        { ...createSampleFood(1), position: { x: 0, y: 0 } }, // Top-left corner
        { ...createSampleFood(2), position: { x: 780, y: 580 } }, // Near bottom-right
        { ...createSampleFood(3), position: { x: -10, y: 100 } }, // Outside left
        { ...createSampleFood(4), position: { x: 100, y: -10 } }, // Outside top
      ];

      const canvasWidth = 800;
      const canvasHeight = 600;

      foods.forEach(food => {
        expect(() => {
          const isWithinBounds = renderer.isWithinBounds(food, canvasWidth, canvasHeight);
          expect(typeof isWithinBounds).toBe('boolean');
        }).not.toThrow();
      });
    });
  });

  describe('configuration management', () => {
    it('should update configuration partially', () => {
      const originalConfig = renderer.getConfig();
      
      renderer.updateConfig({
        borderWidth: 5,
        enableAnimation: false,
      });

      const updatedConfig = renderer.getConfig();
      expect(updatedConfig.borderWidth).toBe(5);
      expect(updatedConfig.enableAnimation).toBe(false);
      
      // Other properties should remain unchanged
      expect(updatedConfig.fontSize).toBe(originalConfig.fontSize);
      expect(updatedConfig.fontFamily).toBe(originalConfig.fontFamily);
    });

    it('should handle invalid configuration gracefully', () => {
      expect(() => {
        renderer.updateConfig({
          borderWidth: -1, // Invalid but should not crash
          fontSize: 0, // Invalid but should not crash
        });
      }).not.toThrow();
    });
  });

  describe('cleanup and destruction', () => {
    it('should clean up resources on destroy', () => {
      const food = createSampleFood(1);
      renderer.renderFood(food, 0); // Create some state

      renderer.destroy();

      const metrics = renderer.getMetrics();
      expect(metrics.foodsRendered).toBe(0);
      expect(metrics.renderTime).toBe(0);
    });

    it('should handle multiple destroy calls gracefully', () => {
      expect(() => {
        renderer.destroy();
        renderer.destroy(); // Should not crash
      }).not.toThrow();
    });
  });
});