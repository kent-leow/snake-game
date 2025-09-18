// Legacy game state types (kept for backward compatibility)
export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  gameOver: boolean;
  level: number;
}

// Import and re-export new state management types
export { 
  GameStateEnum as GameStateType, 
  type GameStateData,
  GameStateManager 
} from './gameState';
export { 
  StateTransitionAction, 
  type StateTransitionResult,
  StateTransitionManager 
} from './stateTransitions';
export { GameStateMachine } from './gameStateMachine';

// Game over related types (reexported from gameOverState)
export type { GameOverState, GameStatistics } from './gameOverState';

// Position and direction types
export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Snake and food types
export interface SnakeSegment extends Position {
  id: string;
}

export interface Snake {
  segments: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction;
  isGrowing: boolean;
}

export interface Food extends Position {
  type: 'normal' | 'special';
  points: number;
}

// Enhanced food interface with additional properties for the food system
export interface EnhancedFood extends Food {
  id: string;
  timestamp: number;
  value: number;
}

// Food spawn configuration
export interface FoodSpawnOptions {
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
  occupiedPositions: Position[];
}

// Scoring system types
export interface ScoreEvent {
  type: 'food' | 'combo' | 'bonus';
  points: number;
  timestamp: number;
  position?: Position;
}

export interface ScoreStatistics {
  totalScore: number;
  totalEvents: number;
  averageScore: number;
  scoreBreakdown: Record<string, number>;
  highestSingleScore: number;
  longestCombo: number;
}

// Enhanced scoring types for combo integration
export interface ScoreBreakdown {
  basePoints: number;
  comboBonus: number;
  totalPoints: number;
  timestamp: number;
}

export interface GameScore {
  currentScore: number;
  totalCombos: number;
  basePointsEarned: number;
  comboBonusEarned: number;
  averageComboLength: number;
}

// Snake growth types
export interface GrowthEvent {
  segments: number;
  timestamp: number;
  reason: 'food' | 'bonus' | 'manual';
}

export interface GrowthStatistics {
  totalGrowth: number;
  currentLength: number;
  growthEvents: number;
  averageGrowthRate: number;
  largestGrowthEvent: number;
}

// Game configuration types
export interface GameConfig {
  gridSize: number;
  gameSpeed: number;
  enableSound: boolean;
}

export type GameSpeed = 'slow' | 'normal' | 'fast';
export type GridSize = 'small' | 'medium' | 'large';

// Game actions and events
export type GameAction = 
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_SCORE'; payload: number }
  | { type: 'CHANGE_DIRECTION'; payload: Direction }
  | { type: 'MOVE_SNAKE' }
  | { type: 'EAT_FOOD'; payload: Food }
  | { type: 'QUEUE_DIRECTION'; payload: Direction };// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
}

// High score types
export interface HighScore {
  id: string;
  playerName: string;
  score: number;
  date: Date;
  level: number;
}

// Settings types
export interface GameSettings {
  gameSpeed: GameSpeed;
  gridSize: GridSize;
  enableSound: boolean;
  playerName: string;
}

// Utility types
export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface GameStats {
  totalGames: number;
  highScore: number;
  averageScore: number;
  totalPlayTime: number;
}

// Input and movement types
export interface InputState {
  currentDirection: Direction;
  queuedDirections: Direction[];
  lastInputTime: number;
}

export interface MovementOptions {
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
  enableWrapAround?: boolean;
}

export interface CollisionInfo {
  type: 'wall' | 'self' | 'food' | 'none';
  position: Position;
  segmentIndex?: number;
}

// Enhanced collision result with additional information
export interface CollisionResult {
  hasCollision: boolean;
  collisionType: 'wall' | 'self' | 'food' | 'none';
  position: Position;
  segmentIndex?: number;
  food?: Food;
}

// Bounding box for collision detection
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type KeyboardKey = 
  | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  | 'w' | 'a' | 's' | 'd'
  | 'W' | 'A' | 'S' | 'D';
