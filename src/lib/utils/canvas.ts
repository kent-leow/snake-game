import type { Position, SnakeSegment } from '../game/types';
import { GAME_CONFIG } from '../game/constants';

/**
 * Canvas utility functions for the Snake game
 */

/**
 * Clear the entire canvas
 */
export function clearCanvas(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  context.fillStyle = GAME_CONFIG.COLORS.BACKGROUND;
  context.fillRect(0, 0, width, height);
}

/**
 * Draw a grid on the canvas
 */
export function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number = GAME_CONFIG.GRID_SIZE
): void {
  context.strokeStyle = GAME_CONFIG.COLORS.GRID_LINE;
  context.lineWidth = 0.5;

  // Draw vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

/**
 * Draw a rectangle at given position
 */
export function drawRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

/**
 * Draw a rounded rectangle
 */
export function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string
): void {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

/**
 * Draw a circle at given position
 */
export function drawCircle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
  context.fill();
}

/**
 * Draw snake segment
 */
export function drawSnakeSegment(
  context: CanvasRenderingContext2D,
  segment: SnakeSegment,
  gridSize: number = GAME_CONFIG.GRID_SIZE,
  isHead: boolean = false
): void {
  const color = isHead
    ? GAME_CONFIG.COLORS.SNAKE_HEAD
    : GAME_CONFIG.COLORS.SNAKE_BODY;
  const padding = 1;

  drawRoundedRect(
    context,
    segment.x + padding,
    segment.y + padding,
    gridSize - padding * 2,
    gridSize - padding * 2,
    3,
    color
  );
}

/**
 * Draw food item
 */
export function drawFood(
  context: CanvasRenderingContext2D,
  position: Position,
  gridSize: number = GAME_CONFIG.GRID_SIZE,
  color: string = GAME_CONFIG.COLORS.FOOD
): void {
  const padding = 2;
  const size = gridSize - padding * 2;

  drawCircle(
    context,
    position.x + padding,
    position.y + padding,
    size / 2,
    color
  );
}

/**
 * Draw text at given position
 */
export function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string = '16px Arial',
  color: string = '#ffffff',
  align: CanvasTextAlign = 'left'
): void {
  context.fillStyle = color;
  context.font = font;
  context.textAlign = align;
  context.fillText(text, x, y);
}

/**
 * Draw border around canvas
 */
export function drawBorder(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  borderWidth: number = 2,
  color: string = GAME_CONFIG.COLORS.BORDER
): void {
  context.strokeStyle = color;
  context.lineWidth = borderWidth;
  context.strokeRect(0, 0, width, height);
}

/**
 * Convert pixel coordinates to grid coordinates
 */
export function pixelToGrid(
  pixelCoord: number,
  gridSize: number = GAME_CONFIG.GRID_SIZE
): number {
  return Math.floor(pixelCoord / gridSize) * gridSize;
}

/**
 * Convert grid coordinates to pixel coordinates
 */
export function gridToPixel(
  gridCoord: number,
  gridSize: number = GAME_CONFIG.GRID_SIZE
): number {
  return gridCoord * gridSize;
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Generate random position within canvas bounds aligned to grid
 */
export function getRandomGridPosition(
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number = GAME_CONFIG.GRID_SIZE
): Position {
  const maxX = Math.floor(canvasWidth / gridSize) - 1;
  const maxY = Math.floor(canvasHeight / gridSize) - 1;

  return {
    x: Math.floor(Math.random() * maxX) * gridSize,
    y: Math.floor(Math.random() * maxY) * gridSize,
  };
}

/**
 * Get canvas context with anti-aliasing disabled for pixel-perfect rendering
 */
export function setupCanvasContext(
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) return null;

  // Disable anti-aliasing for crisp pixel art
  context.imageSmoothingEnabled = false;

  return context;
}
