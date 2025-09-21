// Game engine barrel export
export { GameEngine } from './gameEngine';
export type { GameEngineConfig, GameEngineCallbacks } from './gameEngine';

// Game state exports
export { GameStateEnum, GameStateManager } from './gameState';
export type { GameStateData, StateChangeCallback, StateTransitionCallback } from './gameState';

// Types exports
export type { 
  Direction, 
  Position, 
  Snake, 
  SnakeSegment, 
  EnhancedFood, 
  GameStateType 
} from './types';

// Multiplefood types
export type { NumberedFood } from './multipleFoodTypes';

// Game over state exports
export { GameOverManager } from './gameOverState';
export type { GameStatistics, GameOverState } from './gameOverState';