// Game state types
export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  gameOver: boolean;
  level: number;
}

// Position and direction types
export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Snake and food types
export interface SnakeSegment {
  x: number;
  y: number;
}

export interface Snake {
  segments: SnakeSegment[];
  direction: Direction;
  nextDirection?: Direction;
}

export interface Food extends Position {
  type: 'normal' | 'special';
  points: number;
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
  | { type: 'EAT_FOOD'; payload: Food };

// Navigation types
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