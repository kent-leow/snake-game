/**
 * Game configuration constants
 * Contains all game-related constants for the Snake game implementation
 */

export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 20,
  INITIAL_SNAKE_LENGTH: 3,
  GAME_SPEED: 150, // milliseconds per frame
  COLORS: {
    BACKGROUND: '#1a1a1a',
    SNAKE_HEAD: '#4ade80',
    SNAKE_BODY: '#22c55e',
    FOOD: '#ef4444',
    BORDER: '#374151',
    GRID_LINE: '#2d2d2d',
  },
} as const;

export const GAME_DIRECTIONS = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
} as const;

export const DIRECTION_VECTORS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
} as const;

export const OPPOSITE_DIRECTIONS = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
} as const;

export const GAME_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
} as const;

export const FOOD_TYPES = {
  NORMAL: 'normal',
  SPECIAL: 'special',
} as const;

export const FOOD_POINTS = {
  NORMAL: 10,
  SPECIAL: 50,
} as const;

export const KEY_CODES = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  W: 'KeyW',
  A: 'KeyA',
  S: 'KeyS',
  D: 'KeyD',
  SPACE: 'Space',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
} as const;