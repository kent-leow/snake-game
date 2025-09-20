/**
 * Dedicated food rendering system for numbered food blocks
 * Provides responsive design, accessibility features, and visual enhancements
 */

import type { NumberedFood } from '@/lib/game/multipleFoodTypes';
import type { Position } from '@/lib/game/types';
import { FOOD_STYLE, getFoodColors, getBorderColor } from '@/constants/FoodColors';

/**
 * Configuration interface for the food renderer
 */
export interface FoodRenderConfig {
  colors: Record<1 | 2 | 3 | 4 | 5, string>;
  fontSize: number;
  fontFamily: string;
  borderWidth: number;
  borderColor: string;
  textColor: string;
  enableShadow: boolean;
  enableAnimation: boolean;
  colorScheme: 'default' | 'high-contrast' | 'protanopia' | 'deuteranopia';
}

/**
 * Animation state for food rendering
 */
interface FoodAnimationState {
  time: number;
  pulsePhase: number;
  glowIntensity: number;
}

/**
 * Food rendering metrics for performance monitoring
 */
export interface FoodRenderMetrics {
  renderTime: number;
  foodsRendered: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * High-performance, responsive food renderer for numbered food blocks
 */
export class FoodRenderer {
  private context: CanvasRenderingContext2D;
  private config: FoodRenderConfig;
  private gridSize: number;
  private animationState: FoodAnimationState;
  private fontCache: Map<number, string> = new Map();
  private metrics: FoodRenderMetrics;

  constructor(
    context: CanvasRenderingContext2D, 
    gridSize: number,
    options: Partial<FoodRenderConfig> = {}
  ) {
    this.context = context;
    this.gridSize = gridSize;
    
    // Initialize configuration with defaults
    this.config = {
      colors: getFoodColors(options.colorScheme || 'default'),
      fontSize: this.calculateFontSize(gridSize),
      fontFamily: FOOD_STYLE.fontFamily,
      borderWidth: FOOD_STYLE.borderWidth,
      borderColor: FOOD_STYLE.borderColor,
      textColor: FOOD_STYLE.textColor,
      enableShadow: true,
      enableAnimation: false, // Disable animation for debugging
      colorScheme: 'default',
      ...options,
    };

    // Initialize animation state
    this.animationState = {
      time: 0,
      pulsePhase: 0,
      glowIntensity: 1,
    };

    // Initialize metrics
    this.metrics = {
      renderTime: 0,
      foodsRendered: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    // Pre-cache font strings
    this.initializeFontCache();
  }

  /**
   * Render a single numbered food block
   */
  public renderFood(food: NumberedFood, deltaTime: number = 0): void {
    const startTime = performance.now();
    
    this.updateAnimation(deltaTime);

    if (this.config.enableAnimation) {
      this.renderWithAnimation(food);
    } else {
      this.renderStatic(food);
    }

    this.metrics.renderTime += performance.now() - startTime;
    this.metrics.foodsRendered++;
  }

  /**
   * Render multiple food blocks efficiently
   */
  public renderMultipleFoods(foods: NumberedFood[], deltaTime: number = 0): void {
    const startTime = performance.now();
    
    this.updateAnimation(deltaTime);

    // Batch rendering for performance
    foods.forEach(food => {
      if (this.config.enableAnimation) {
        this.renderWithAnimation(food);
      } else {
        this.renderStatic(food);
      }
    });

    this.metrics.renderTime += performance.now() - startTime;
    this.metrics.foodsRendered += foods.length;
  }

  /**
   * Update grid size and recalculate font size responsively
   */
  public updateGridSize(newGridSize: number): void {
    this.gridSize = newGridSize;
    this.config.fontSize = this.calculateFontSize(newGridSize);
    this.initializeFontCache(); // Regenerate font cache
  }

  /**
   * Update rendering configuration
   */
  public updateConfig(newConfig: Partial<FoodRenderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update colors if color scheme changed
    if (newConfig.colorScheme) {
      this.config.colors = getFoodColors(newConfig.colorScheme);
    }
    
    this.initializeFontCache(); // Regenerate font cache if needed
  }

  /**
   * Get current rendering metrics
   */
  public getMetrics(): FoodRenderMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset rendering metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      renderTime: 0,
      foodsRendered: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Calculate responsive font size based on grid size
   */
  private calculateFontSize(gridSize: number): number {
    // Ensure font is readable on mobile (minimum 10px) and scales with grid
    return Math.max(10, Math.floor(gridSize * 0.4));
  }

  /**
   * Initialize font cache for performance
   */
  private initializeFontCache(): void {
    this.fontCache.clear();
    const fontString = `bold ${this.config.fontSize}px ${this.config.fontFamily}`;
    
    // Cache font string for each number
    for (let i = 1; i <= 5; i++) {
      this.fontCache.set(i, fontString);
    }
  }

  /**
   * Get cached font string
   */
  private getCachedFont(number: number): string {
    const cached = this.fontCache.get(number);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    
    this.metrics.cacheMisses++;
    const fontString = `bold ${this.config.fontSize}px ${this.config.fontFamily}`;
    this.fontCache.set(number, fontString);
    return fontString;
  }

  /**
   * Render food block without animation (static)
   */
  private renderStatic(food: NumberedFood): void {
    const { position } = food;
    const color = this.config.colors[food.number];
    
    // Draw a very visible colored square
    this.context.fillStyle = color;
    this.context.fillRect(position.x, position.y, this.gridSize, this.gridSize);
    
    // Draw a black border
    this.context.strokeStyle = '#000000';
    this.context.lineWidth = 2;
    this.context.strokeRect(position.x, position.y, this.gridSize, this.gridSize);
    
    // Draw the number in white, large text with black outline
    const centerX = position.x + this.gridSize / 2;
    const centerY = position.y + this.gridSize / 2;
    const fontSize = Math.floor(this.gridSize * 0.8);
    this.context.font = `bold ${fontSize}px Arial`;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    
    // Draw black outline
    this.context.strokeStyle = '#000000';
    this.context.lineWidth = 2;
    this.context.strokeText(food.number.toString(), centerX, centerY);
    
    // Draw white text
    this.context.fillStyle = '#FFFFFF';
    this.context.fillText(food.number.toString(), centerX, centerY);
  }

  /**
   * Render food block with animation effects
   */
  private renderWithAnimation(food: NumberedFood): void {
    const { position } = food;
    const color = this.config.colors[food.number];
    
    // Calculate animation values
    const pulseScale = 1 + Math.sin(this.animationState.pulsePhase) * 0.05;
    const glowIntensity = 0.7 + Math.sin(this.animationState.time * 0.003) * 0.3;
    
    // Apply scale transformation
    const scaledSize = this.gridSize * pulseScale;
    const offset = (this.gridSize - scaledSize) / 2;
    const scaledPosition = {
      x: position.x + offset,
      y: position.y + offset,
    };
    
    this.renderBackground(scaledPosition, color, scaledSize);
    this.renderAnimatedBorder(scaledPosition, color, scaledSize, glowIntensity);
    this.renderNumber(position, food.number); // Keep text stable for readability
  }

  /**
   * Render food background
   */
  private renderBackground(
    position: Position, 
    color: string, 
    size: number = this.gridSize
  ): void {
    // Draw shadow if enabled
    if (this.config.enableShadow) {
      this.context.fillStyle = FOOD_STYLE.shadowColor;
      this.context.fillRect(
        position.x + FOOD_STYLE.shadowOffset,
        position.y + FOOD_STYLE.shadowOffset,
        size,
        size
      );
    }

    // Draw main background - make it more visible for debugging
    this.context.fillStyle = color;
    this.context.fillRect(position.x, position.y, size, size);
    
    // Add a border to make it more visible
    this.context.strokeStyle = '#000000';
    this.context.lineWidth = 2;
    this.context.strokeRect(position.x, position.y, size, size);
  }



  /**
   * Render animated border with glow effect
   */
  private renderAnimatedBorder(
    position: Position, 
    foodColor: string, 
    size: number,
    glowIntensity: number
  ): void {
    if (this.config.borderWidth <= 0) return;

    const borderColor = getBorderColor(foodColor);
    
    // Create glow effect by drawing multiple borders with decreasing opacity
    for (let i = 0; i < 3; i++) {
      const alpha = (glowIntensity * (3 - i)) / 3;
      const width = this.config.borderWidth + i;
      
      this.context.strokeStyle = borderColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      this.context.lineWidth = width;
      this.context.strokeRect(position.x, position.y, size, size);
    }
  }

  /**
   * Render number text on food block
   */
  private renderNumber(position: Position, number: 1 | 2 | 3 | 4 | 5): void {
    const centerX = position.x + this.gridSize / 2;
    const centerY = position.y + this.gridSize / 2;

    // Set font properties
    this.context.font = this.getCachedFont(number);
    this.context.textAlign = FOOD_STYLE.textAlign;
    this.context.textBaseline = FOOD_STYLE.textBaseline;

    // Draw text shadow for better visibility
    if (this.config.enableShadow) {
      this.context.fillStyle = FOOD_STYLE.shadowColor;
      this.context.fillText(
        number.toString(),
        centerX + FOOD_STYLE.shadowOffset,
        centerY + FOOD_STYLE.shadowOffset
      );
    }

    // Draw main text
    this.context.fillStyle = this.config.textColor;
    this.context.fillText(number.toString(), centerX, centerY);
  }

  /**
   * Update animation state
   */
  private updateAnimation(deltaTime: number): void {
    if (!this.config.enableAnimation) return;

    this.animationState.time += deltaTime;
    this.animationState.pulsePhase += deltaTime * 0.002; // Slow pulse
    this.animationState.glowIntensity = 0.7 + Math.sin(this.animationState.time * 0.003) * 0.3;

    // Wrap phases to prevent overflow
    if (this.animationState.pulsePhase > Math.PI * 2) {
      this.animationState.pulsePhase -= Math.PI * 2;
    }
  }

  /**
   * Update canvas context (for context changes)
   */
  public updateContext(context: CanvasRenderingContext2D): void {
    this.context = context;
  }

  /**
   * Get current configuration
   */
  public getConfig(): FoodRenderConfig {
    return { ...this.config };
  }

  /**
   * Check if food is within canvas bounds
   */
  public isWithinBounds(food: NumberedFood, canvasWidth: number, canvasHeight: number): boolean {
    return (
      food.position.x >= 0 &&
      food.position.y >= 0 &&
      food.position.x + this.gridSize <= canvasWidth &&
      food.position.y + this.gridSize <= canvasHeight
    );
  }

  /**
   * Destroy the renderer and clean up resources
   */
  public destroy(): void {
    this.fontCache.clear();
    this.resetMetrics();
  }
}