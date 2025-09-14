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

/**
 * Food system configuration constants
 */
export const FOOD_CONFIG = {
  SPAWN_ATTEMPTS: 100,
  MIN_DISTANCE_FROM_SNAKE: 1, // Grid units
  SPECIAL_FOOD_PROBABILITY: 0.1, // 10% chance
  FOOD_EXPIRY_TIME: 30000, // 30 seconds
  ANIMATION_SPEED: 0.005,
  GLOW_SPEED: 0.003,
  PULSE_AMPLITUDE: 0.1,
  SPARKLE_COUNT: 6,
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

/**
 * Collision detection configuration constants
 */
export const COLLISION_CONFIG = {
  RESPONSE_TIME_TARGET: 50, // Maximum response time in milliseconds
  BOUNDARY_TOLERANCE: 0, // Pixel tolerance for boundary detection
  SELF_COLLISION_ENABLED: true,
  BOUNDARY_COLLISION_ENABLED: true,
  ENABLE_PERFORMANCE_MONITORING: false,
  CACHE_COLLISION_RESULTS: true,
} as const;

/**
 * Performance-related configuration constants
 */
export const PERFORMANCE_CONFIG = {
  TARGET_FPS: 60,
  MIN_FPS_MOBILE: 30,
  MAX_DELTA_TIME: 100, // Cap delta time to prevent spiral of death
  PERFORMANCE_SAMPLE_SIZE: 60,
  FPS_UPDATE_INTERVAL: 1000,
  FRAME_TIME_WARNING_THRESHOLD: 16.67, // 60 FPS = 16.67ms per frame
  
  // Adaptive quality thresholds
  HIGH_PERFORMANCE_THRESHOLD: 55, // FPS above this = high performance
  MEDIUM_PERFORMANCE_THRESHOLD: 35, // FPS above this = medium performance
  LOW_PERFORMANCE_THRESHOLD: 20, // FPS below this = low performance
  
  // Frame drop tolerances
  MAX_FRAME_DROP_RATIO: 0.1, // 10% frame drops acceptable
  SEVERE_FRAME_DROP_RATIO: 0.25, // 25% frame drops = severe issues
  
  // Performance monitoring intervals
  PERFORMANCE_CHECK_INTERVAL: 60, // frames between performance checks
  QUALITY_ADJUSTMENT_COOLDOWN: 5000, // ms between quality adjustments
} as const;

/**
 * Device performance tiers and their recommended settings
 */
export const DEVICE_PERFORMANCE_TIERS = {
  HIGH: {
    targetFPS: 60,
    enableGrid: true,
    enableParticles: true,
    enableSmoothAnimation: true,
    maxSnakeLength: 100,
    enableShadows: true,
  },
  MEDIUM: {
    targetFPS: 60,
    enableGrid: true,
    enableParticles: false,
    enableSmoothAnimation: true,
    maxSnakeLength: 75,
    enableShadows: false,
  },
  LOW: {
    targetFPS: 30,
    enableGrid: false,
    enableParticles: false,
    enableSmoothAnimation: false,
    maxSnakeLength: 50,
    enableShadows: false,
  },
} as const;

/**
 * Game loop timing constants
 */
export const GAME_LOOP_CONFIG = {
  FIXED_TIMESTEP: 16.67, // 60 FPS in milliseconds
  MAX_UPDATES_PER_FRAME: 5, // Prevent spiral of death
  INTERPOLATION_ENABLED: true,
  VSYNC_ENABLED: true,
} as const;
