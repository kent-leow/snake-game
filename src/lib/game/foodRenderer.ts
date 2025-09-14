import type { Food } from './types';
import { EnhancedFood } from './food';
import { GAME_CONFIG } from './constants';

/**
 * Food rendering options interface
 */
export interface FoodRenderOptions {
  enableAnimation?: boolean;
  enableShadow?: boolean;
  enableGlow?: boolean;
  scaleFactor?: number;
}

/**
 * Animation state interface
 */
interface AnimationState {
  time: number;
  pulsePhase: number;
  glowIntensity: number;
}

/**
 * Food renderer class for handling visual representation of food items
 * Provides animated and static rendering options with visual enhancements
 */
export class FoodRenderer {
  private context: CanvasRenderingContext2D;
  private gridSize: number;
  private animationState: AnimationState;
  private renderOptions: Required<FoodRenderOptions>;

  constructor(
    context: CanvasRenderingContext2D,
    gridSize: number,
    options: FoodRenderOptions = {}
  ) {
    this.context = context;
    this.gridSize = gridSize;
    this.animationState = {
      time: 0,
      pulsePhase: 0,
      glowIntensity: 1,
    };
    
    this.renderOptions = {
      enableAnimation: true,
      enableShadow: false,
      enableGlow: false,
      scaleFactor: 1,
      ...options,
    };
  }

  /**
   * Render food item with current settings
   */
  public renderFood(food: Food | EnhancedFood | null, deltaTime: number = 0): void {
    if (!food) return;

    this.updateAnimation(deltaTime);

    if (this.renderOptions.enableAnimation) {
      this.renderFoodWithAnimation(food);
    } else {
      this.renderStaticFood(food);
    }
  }

  /**
   * Render static food without animation
   */
  private renderStaticFood(food: Food | EnhancedFood): void {
    const size = this.gridSize * this.renderOptions.scaleFactor;
    const offset = (this.gridSize - size) / 2;

    // Draw shadow if enabled
    if (this.renderOptions.enableShadow) {
      this.drawShadow(food.x + offset, food.y + offset, size);
    }

    // Draw main food body
    this.context.fillStyle = this.getFoodColor(food);
    this.context.fillRect(
      food.x + offset,
      food.y + offset,
      size,
      size
    );

    // Draw border
    this.drawFoodBorder(food.x + offset, food.y + offset, size, food);

    // Draw special effects for special food
    if (food.type === 'special') {
      this.drawSpecialEffects(food.x + offset, food.y + offset, size);
    }
  }

  /**
   * Render food with animation effects
   */
  private renderFoodWithAnimation(food: Food | EnhancedFood): void {
    const pulseScale = 1 + Math.sin(this.animationState.pulsePhase) * 0.1;
    const animatedSize = this.gridSize * this.renderOptions.scaleFactor * pulseScale;
    const offset = (this.gridSize - animatedSize) / 2;

    // Draw glow effect if enabled
    if (this.renderOptions.enableGlow) {
      this.drawGlowEffect(food.x, food.y, animatedSize);
    }

    // Draw shadow with animation
    if (this.renderOptions.enableShadow) {
      this.drawShadow(food.x + offset + 2, food.y + offset + 2, animatedSize);
    }

    // Draw main food body with pulse animation
    this.context.fillStyle = this.getFoodColor(food);
    this.context.fillRect(
      food.x + offset,
      food.y + offset,
      animatedSize,
      animatedSize
    );

    // Draw animated border
    this.drawFoodBorder(food.x + offset, food.y + offset, animatedSize, food);

    // Draw special effects for special food
    if (food.type === 'special') {
      this.drawSpecialEffects(food.x + offset, food.y + offset, animatedSize);
      this.drawSpecialAnimation(food.x, food.y);
    }
  }

  /**
   * Update animation state
   */
  private updateAnimation(deltaTime: number): void {
    this.animationState.time += deltaTime;
    this.animationState.pulsePhase = this.animationState.time * 0.005;
    this.animationState.glowIntensity = 0.5 + Math.sin(this.animationState.time * 0.003) * 0.5;
  }

  /**
   * Get color for food based on type
   */
  private getFoodColor(food: Food | EnhancedFood): string {
    if (food.type === 'special') {
      // Animated color for special food
      if (this.renderOptions.enableAnimation) {
        const hue = (this.animationState.time * 0.1) % 360;
        return `hsl(${hue}, 80%, 60%)`;
      }
      return '#fbbf24'; // Gold color for special food
    }
    
    return GAME_CONFIG.COLORS.FOOD;
  }

  /**
   * Draw food border
   */
  private drawFoodBorder(x: number, y: number, size: number, food: Food | EnhancedFood): void {
    this.context.strokeStyle = food.type === 'special' ? '#ffffff' : '#ffffff';
    this.context.lineWidth = 1;
    this.context.strokeRect(x, y, size, size);
  }

  /**
   * Draw shadow effect
   */
  private drawShadow(x: number, y: number, size: number): void {
    this.context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.context.fillRect(x + 2, y + 2, size, size);
  }

  /**
   * Draw glow effect
   */
  private drawGlowEffect(x: number, y: number, size: number): void {
    const glowSize = size * 1.5;
    const glowOffset = (size - glowSize) / 2;

    const gradient = this.context.createRadialGradient(
      x + this.gridSize / 2,
      y + this.gridSize / 2,
      0,
      x + this.gridSize / 2,
      y + this.gridSize / 2,
      glowSize / 2
    );

    gradient.addColorStop(0, `rgba(239, 68, 68, ${this.animationState.glowIntensity * 0.3})`);
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

    this.context.fillStyle = gradient;
    this.context.fillRect(x + glowOffset, y + glowOffset, glowSize, glowSize);
  }

  /**
   * Draw special effects for special food
   */
  private drawSpecialEffects(x: number, y: number, size: number): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Draw sparkle effect
    this.context.fillStyle = '#ffffff';
    
    // Small sparkles at corners
    const sparkleSize = 2;
    const sparkleOffset = size * 0.2;
    
    this.context.fillRect(centerX - sparkleOffset, centerY - sparkleOffset, sparkleSize, sparkleSize);
    this.context.fillRect(centerX + sparkleOffset, centerY - sparkleOffset, sparkleSize, sparkleSize);
    this.context.fillRect(centerX - sparkleOffset, centerY + sparkleOffset, sparkleSize, sparkleSize);
    this.context.fillRect(centerX + sparkleOffset, centerY + sparkleOffset, sparkleSize, sparkleSize);
  }

  /**
   * Draw special animation effects
   */
  private drawSpecialAnimation(x: number, y: number): void {
    if (!this.renderOptions.enableAnimation) return;

    const centerX = x + this.gridSize / 2;
    const centerY = y + this.gridSize / 2;
    const radius = this.gridSize * 0.8;

    // Rotating sparkle ring
    const numSparkles = 6;
    const rotationSpeed = this.animationState.time * 0.002;

    this.context.fillStyle = '#ffffff';
    
    for (let i = 0; i < numSparkles; i++) {
      const angle = (i / numSparkles) * Math.PI * 2 + rotationSpeed;
      const sparkleX = centerX + Math.cos(angle) * radius;
      const sparkleY = centerY + Math.sin(angle) * radius;
      
      this.context.fillRect(sparkleX - 1, sparkleY - 1, 2, 2);
    }
  }

  /**
   * Render food with custom style
   */
  public renderCustomFood(
    food: Food | EnhancedFood,
    style: {
      color?: string;
      borderColor?: string;
      size?: number;
      shape?: 'square' | 'circle';
    }
  ): void {
    const size = style.size || this.gridSize;
    const color = style.color || this.getFoodColor(food);
    const borderColor = style.borderColor || '#ffffff';
    const offset = (this.gridSize - size) / 2;

    this.context.fillStyle = color;

    if (style.shape === 'circle') {
      // Draw circle
      const centerX = food.x + this.gridSize / 2;
      const centerY = food.y + this.gridSize / 2;
      const radius = size / 2;

      this.context.beginPath();
      this.context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.context.fill();

      // Draw border
      this.context.strokeStyle = borderColor;
      this.context.lineWidth = 1;
      this.context.stroke();
    } else {
      // Draw square (default)
      this.context.fillRect(food.x + offset, food.y + offset, size, size);

      // Draw border
      this.context.strokeStyle = borderColor;
      this.context.lineWidth = 1;
      this.context.strokeRect(food.x + offset, food.y + offset, size, size);
    }
  }

  /**
   * Update rendering options
   */
  public updateOptions(options: Partial<FoodRenderOptions>): void {
    Object.assign(this.renderOptions, options);
  }

  /**
   * Get current rendering options
   */
  public getOptions(): Required<FoodRenderOptions> {
    return { ...this.renderOptions };
  }

  /**
   * Update canvas context
   */
  public updateContext(context: CanvasRenderingContext2D): void {
    this.context = context;
  }

  /**
   * Update grid size
   */
  public updateGridSize(gridSize: number): void {
    this.gridSize = gridSize;
  }

  /**
   * Reset animation state
   */
  public resetAnimation(): void {
    this.animationState = {
      time: 0,
      pulsePhase: 0,
      glowIntensity: 1,
    };
  }

  /**
   * Get animation state for debugging
   */
  public getAnimationState(): AnimationState {
    return { ...this.animationState };
  }

  /**
   * Render multiple food items efficiently
   */
  public renderMultipleFood(
    foods: (Food | EnhancedFood)[],
    deltaTime: number = 0
  ): void {
    this.updateAnimation(deltaTime);
    
    foods.forEach(food => {
      if (this.renderOptions.enableAnimation) {
        this.renderFoodWithAnimation(food);
      } else {
        this.renderStaticFood(food);
      }
    });
  }
}