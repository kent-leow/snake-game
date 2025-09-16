import type { NumberedFood } from './multipleFoodTypes';

/**
 * Rendering options for numbered food blocks
 */
export interface NumberedFoodRenderOptions {
  enableAnimation?: boolean;
  enableShadow?: boolean;
  enableBorder?: boolean;
  borderWidth?: number;
  borderColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
}

/**
 * Animation state for numbered food renderer
 */
interface NumberedFoodAnimationState {
  time: number;
  pulsePhase: number;
  glowIntensity: number;
}

/**
 * Renderer for numbered food blocks in multiple food system
 */
export class NumberedFoodRenderer {
  private context: CanvasRenderingContext2D;
  private gridSize: number;
  private animationState: NumberedFoodAnimationState;
  private renderOptions: Required<NumberedFoodRenderOptions>;

  constructor(
    context: CanvasRenderingContext2D,
    gridSize: number,
    options: NumberedFoodRenderOptions = {}
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
      enableBorder: true,
      borderWidth: 2,
      borderColor: '#ffffff',
      fontSize: Math.max(10, Math.floor(gridSize * 0.4)),
      fontFamily: 'bold Arial, sans-serif',
      textColor: '#ffffff',
      ...options,
    };
  }

  /**
   * Render a single numbered food block
   */
  public renderNumberedFood(food: NumberedFood, deltaTime: number = 0): void {
    this.updateAnimation(deltaTime);

    if (this.renderOptions.enableAnimation) {
      this.renderWithAnimation(food);
    } else {
      this.renderStatic(food);
    }
  }

  /**
   * Render multiple numbered food blocks efficiently
   */
  public renderMultipleNumberedFoods(foods: NumberedFood[], deltaTime: number = 0): void {
    this.updateAnimation(deltaTime);

    foods.forEach(food => {
      if (this.renderOptions.enableAnimation) {
        this.renderWithAnimation(food);
      } else {
        this.renderStatic(food);
      }
    });
  }

  /**
   * Render food block without animation
   */
  private renderStatic(food: NumberedFood): void {
    const { x, y } = food.position;
    const size = this.gridSize;

    // Draw shadow if enabled
    if (this.renderOptions.enableShadow) {
      this.drawShadow(x, y, size);
    }

    // Draw background
    this.context.fillStyle = food.color;
    this.context.fillRect(x, y, size, size);

    // Draw border if enabled
    if (this.renderOptions.enableBorder) {
      this.context.strokeStyle = this.renderOptions.borderColor;
      this.context.lineWidth = this.renderOptions.borderWidth;
      this.context.strokeRect(x, y, size, size);
    }

    // Draw number
    this.drawNumber(food, x, y, size);
  }

  /**
   * Render food block with animation effects
   */
  private renderWithAnimation(food: NumberedFood): void {
    const { x, y } = food.position;
    
    // Calculate animated size
    const pulseScale = 1 + Math.sin(this.animationState.pulsePhase) * 0.1;
    const animatedSize = this.gridSize * pulseScale;
    const offset = (this.gridSize - animatedSize) / 2;

    // Draw shadow if enabled
    if (this.renderOptions.enableShadow) {
      this.drawShadow(x + offset, y + offset, animatedSize);
    }

    // Draw animated background
    this.context.fillStyle = food.color;
    this.context.fillRect(x + offset, y + offset, animatedSize, animatedSize);

    // Draw glowing border if enabled
    if (this.renderOptions.enableBorder) {
      const glowAlpha = 0.5 + this.animationState.glowIntensity * 0.5;
      this.context.strokeStyle = this.renderOptions.borderColor + Math.floor(glowAlpha * 255).toString(16).padStart(2, '0');
      this.context.lineWidth = this.renderOptions.borderWidth;
      this.context.strokeRect(x + offset, y + offset, animatedSize, animatedSize);
    }

    // Draw number (not animated to maintain readability)
    this.drawNumber(food, x, y, this.gridSize);
  }

  /**
   * Draw the number on the food block
   */
  private drawNumber(food: NumberedFood, x: number, y: number, size: number): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Set text properties
    this.context.fillStyle = this.renderOptions.textColor;
    this.context.font = `${this.renderOptions.fontSize}px ${this.renderOptions.fontFamily}`;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';

    // Draw text shadow for better visibility
    this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.context.fillText(food.number.toString(), centerX + 1, centerY + 1);

    // Draw main text
    this.context.fillStyle = this.renderOptions.textColor;
    this.context.fillText(food.number.toString(), centerX, centerY);

    // Reset text properties
    this.context.textAlign = 'start';
    this.context.textBaseline = 'alphabetic';
  }

  /**
   * Draw shadow effect
   */
  private drawShadow(x: number, y: number, size: number): void {
    const shadowOffset = 2;
    this.context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.context.fillRect(
      x + shadowOffset,
      y + shadowOffset,
      size,
      size
    );
  }

  /**
   * Update animation state
   */
  private updateAnimation(deltaTime: number): void {
    this.animationState.time += deltaTime;
    this.animationState.pulsePhase = this.animationState.time * 0.003;
    this.animationState.glowIntensity = 0.5 + Math.sin(this.animationState.time * 0.005) * 0.5;
  }

  /**
   * Update grid size
   */
  public updateGridSize(gridSize: number): void {
    this.gridSize = gridSize;
    this.renderOptions.fontSize = Math.max(10, Math.floor(gridSize * 0.4));
  }

  /**
   * Update canvas context
   */
  public updateContext(context: CanvasRenderingContext2D): void {
    this.context = context;
  }

  /**
   * Update rendering options
   */
  public updateOptions(options: Partial<NumberedFoodRenderOptions>): void {
    Object.assign(this.renderOptions, options);
    
    // Recalculate font size if grid size changed
    if (options.fontSize === undefined) {
      this.renderOptions.fontSize = Math.max(10, Math.floor(this.gridSize * 0.4));
    }
  }

  /**
   * Get current rendering options
   */
  public getOptions(): Required<NumberedFoodRenderOptions> {
    return { ...this.renderOptions };
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
  public getAnimationState(): NumberedFoodAnimationState {
    return { ...this.animationState };
  }
}