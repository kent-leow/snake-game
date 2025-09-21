/**
 * Dedicated food rendering system for numbered food blocks
 * Provides responsive design, accessibility features, and visual enhancements
 */

import type { NumberedFood } from '../lib/game/multipleFoodTypes';
import type { Position } from '../lib/game/types';
import type { ComboState } from '../types/Combo';
import {
  FOOD_COLORS,
  getFoodColors,
} from '../constants/FoodColors';/**
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
  enableGradients: boolean;
  enableGlow: boolean;
  enableComboTargeting: boolean;
  colorScheme: 'default' | 'high-contrast' | 'protanopia' | 'deuteranopia';
}

/**
 * Animation state for food rendering
 */
interface FoodAnimationState {
  time: number;
  pulsePhase: number;
  glowIntensity: number;
  comboTargetPulse: number;
  comboGlowPhase: number;
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
  private comboState: ComboState | null = null;

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
      enableAnimation: true,
      enableGradients: true,
      enableGlow: true,
      enableComboTargeting: true,
      colorScheme: 'default',
      ...options,
    };

    // Initialize animation state
    this.animationState = {
      time: 0,
      pulsePhase: 0,
      glowIntensity: 1,
      comboTargetPulse: 0,
      comboGlowPhase: 0,
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
   * Update combo state for targeting animation
   */
  public updateComboState(comboState: ComboState | null): void {
    this.comboState = comboState;
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
   * Render food block without animation (static)
   */
  private renderStatic(food: NumberedFood): void {
    const { position } = food;
    const isComboTarget = this.isComboTarget(food);
    
    // Enhanced background rendering
    this.renderEnhancedBackground(position, food.number, this.gridSize, isComboTarget);
    
    // Enhanced border rendering
    this.renderEnhancedBorder(position, food.number, this.gridSize, 1.0, isComboTarget);
    
    // Enhanced number rendering
    this.renderEnhancedNumber(position, food.number, isComboTarget);
  }

  /**
   * Render food block with animation effects
   */
  private renderWithAnimation(food: NumberedFood): void {
    const { position } = food;
    const isComboTarget = this.isComboTarget(food);
    
    // Calculate animation values
    let pulseScale = 1 + Math.sin(this.animationState.pulsePhase) * 0.05;
    let glowIntensity = 0.7 + Math.sin(this.animationState.time * 0.003) * 0.3;
    
    // Enhanced combo target animation
    if (isComboTarget && this.config.enableComboTargeting) {
      pulseScale = 1 + Math.sin(this.animationState.comboTargetPulse) * 0.15;
      glowIntensity = Math.max(glowIntensity, 0.8 + Math.sin(this.animationState.comboGlowPhase) * 0.2);
    }
    
    // Apply scale transformation
    const scaledSize = this.gridSize * pulseScale;
    const offset = (this.gridSize - scaledSize) / 2;
    const scaledPosition = {
      x: position.x + offset,
      y: position.y + offset,
    };
    
    // Enhanced background rendering
    this.renderEnhancedBackground(scaledPosition, food.number, scaledSize, isComboTarget);
    
    // Enhanced border rendering
    this.renderEnhancedBorder(scaledPosition, food.number, scaledSize, glowIntensity, isComboTarget);
    
    // Enhanced number rendering
    this.renderEnhancedNumber(position, food.number, isComboTarget);
  }

  /**
   * Check if food is the next combo target
   */
  private isComboTarget(food: NumberedFood): boolean {
    if (!this.comboState || !this.config.enableComboTargeting) {
      return false;
    }
    return food.number === this.comboState.expectedNext;
  }

  /**
   * Render enhanced food background with gradients and effects
   */
  private renderEnhancedBackground(
    position: Position, 
    number: 1 | 2 | 3 | 4 | 5,
    size: number,
    isComboTarget: boolean = false
  ): void {
    const baseColor = this.config.colors[number];
    
    // Draw enhanced shadow
    if (this.config.enableShadow) {
      const shadowOffset = isComboTarget ? 3 : FOOD_STYLE.shadowOffset;
      const shadowBlur = isComboTarget ? 6 : 3;
      
      this.context.shadowColor = 'rgba(0, 0, 0, 0.6)';
      this.context.shadowBlur = shadowBlur;
      this.context.shadowOffsetX = shadowOffset;
      this.context.shadowOffsetY = shadowOffset;
    }

    // Create gradient background if enabled
    if (this.config.enableGradients) {
      const gradient = this.context.createRadialGradient(
        position.x + size / 2, position.y + size / 2, 0,
        position.x + size / 2, position.y + size / 2, size / 2
      );
      
      const gradientColors = getGradientColors(number);
      
      // Enhanced colors for combo target
      if (isComboTarget) {
        gradient.addColorStop(0, lightenColor(gradientColors.start, 0.3));
        gradient.addColorStop(0.6, gradientColors.start);
        gradient.addColorStop(1, darkenColor(gradientColors.end, 0.1));
      } else {
        gradient.addColorStop(0, gradientColors.start);
        gradient.addColorStop(1, gradientColors.end);
      }
      
      this.context.fillStyle = gradient;
    } else {
      this.context.fillStyle = baseColor;
    }
    
    // Draw rounded rectangle for better aesthetics
    const radius = size * FOOD_STYLE.cornerRadius;
    this.drawRoundedRect(position.x, position.y, size, size, radius);
    this.context.fill();
    
    // Reset shadow
    this.context.shadowColor = 'transparent';
    this.context.shadowBlur = 0;
    this.context.shadowOffsetX = 0;
    this.context.shadowOffsetY = 0;
  }



  /**
   * Render enhanced border with glow effects
   */
  private renderEnhancedBorder(
    position: Position, 
    number: 1 | 2 | 3 | 4 | 5,
    size: number,
    glowIntensity: number,
    isComboTarget: boolean = false
  ): void {
    if (this.config.borderWidth <= 0) return;

    const baseColor = this.config.colors[number];
    const borderColor = getBorderColor(baseColor, isComboTarget);
    
    // Enhanced glow for combo targets
    const glowLayers = isComboTarget ? 5 : 3;
    const maxGlowWidth = isComboTarget ? 6 : 3;
    
    // Create multiple glow layers
    if (this.config.enableGlow) {
      for (let i = 0; i < glowLayers; i++) {
        const alpha = (glowIntensity * (glowLayers - i)) / glowLayers;
        const width = this.config.borderWidth + (i * maxGlowWidth / glowLayers);
        
        // Special combo target glow color
        let glowColor = borderColor;
        if (isComboTarget) {
          glowColor = getComboGlowColor();
        }
        
        this.context.strokeStyle = glowColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        this.context.lineWidth = width;
        
        const radius = size * FOOD_STYLE.cornerRadius;
        this.drawRoundedRectStroke(position.x, position.y, size, size, radius);
      }
    } else {
      // Simple border
      this.context.strokeStyle = borderColor;
      this.context.lineWidth = this.config.borderWidth;
      
      const radius = size * FOOD_STYLE.cornerRadius;
      this.drawRoundedRectStroke(position.x, position.y, size, size, radius);
    }
  }

  /**
   * Render enhanced number text with effects
   */
  private renderEnhancedNumber(position: Position, number: 1 | 2 | 3 | 4 | 5, isComboTarget: boolean = false): void {
    const centerX = position.x + this.gridSize / 2;
    const centerY = position.y + this.gridSize / 2;

    // Enhanced font size for combo targets
    const baseFontSize = this.calculateFontSize(this.gridSize);
    const fontSize = isComboTarget ? Math.floor(baseFontSize * 1.2) : baseFontSize;
    
    // Set font properties
    this.context.font = `bold ${fontSize}px ${this.config.fontFamily}`;
    this.context.textAlign = FOOD_STYLE.textAlign;
    this.context.textBaseline = FOOD_STYLE.textBaseline;

    // Enhanced text shadow
    if (this.config.enableShadow) {
      const shadowOffset = isComboTarget ? 2 : FOOD_STYLE.shadowOffset;
      
      // Multiple shadow layers for depth
      for (let i = 0; i < (isComboTarget ? 3 : 2); i++) {
        const offset = shadowOffset + i;
        const alpha = 0.8 - (i * 0.2);
        
        this.context.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        this.context.fillText(
          number.toString(),
          centerX + offset,
          centerY + offset
        );
      }
    }

    // Outline for better visibility
    this.context.strokeStyle = isComboTarget ? '#000000' : 'rgba(0, 0, 0, 0.8)';
    this.context.lineWidth = isComboTarget ? 3 : 2;
    this.context.strokeText(number.toString(), centerX, centerY);

    // Main text with enhanced color for combo targets
    if (isComboTarget && this.config.enableGlow) {
      // Glowing text effect
      this.context.shadowColor = COMBO_TARGET_COLORS.primaryGlow;
      this.context.shadowBlur = 8;
      this.context.fillStyle = '#FFFFFF';
    } else {
      this.context.fillStyle = this.config.textColor;
    }
    
    this.context.fillText(number.toString(), centerX, centerY);
    
    // Reset shadow
    this.context.shadowColor = 'transparent';
    this.context.shadowBlur = 0;
  }

  /**
   * Update animation state
   */
  private updateAnimation(deltaTime: number): void {
    if (!this.config.enableAnimation) return;

    this.animationState.time += deltaTime;
    this.animationState.pulsePhase += deltaTime * 0.002; // Slow pulse
    this.animationState.glowIntensity = 0.7 + Math.sin(this.animationState.time * 0.003) * 0.3;
    
    // Enhanced combo target animations
    this.animationState.comboTargetPulse += deltaTime * 0.004; // Faster pulse for targets
    this.animationState.comboGlowPhase += deltaTime * 0.005; // Glow animation

    // Wrap phases to prevent overflow
    if (this.animationState.pulsePhase > Math.PI * 2) {
      this.animationState.pulsePhase -= Math.PI * 2;
    }
    if (this.animationState.comboTargetPulse > Math.PI * 2) {
      this.animationState.comboTargetPulse -= Math.PI * 2;
    }
    if (this.animationState.comboGlowPhase > Math.PI * 2) {
      this.animationState.comboGlowPhase -= Math.PI * 2;
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
   * Draw a rounded rectangle
   */
  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.context.beginPath();
    this.context.moveTo(x + radius, y);
    this.context.lineTo(x + width - radius, y);
    this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.context.lineTo(x + width, y + height - radius);
    this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.context.lineTo(x + radius, y + height);
    this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.context.lineTo(x, y + radius);
    this.context.quadraticCurveTo(x, y, x + radius, y);
    this.context.closePath();
  }

  /**
   * Draw a rounded rectangle stroke
   */
  private drawRoundedRectStroke(x: number, y: number, width: number, height: number, radius: number): void {
    this.drawRoundedRect(x, y, width, height, radius);
    this.context.stroke();
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