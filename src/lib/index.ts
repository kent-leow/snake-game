export * from './game/types';
export { CollisionDetector, type CollisionResult, type BoundaryConfig } from './game/collisionDetection';
export { OptimizedCollisionDetector } from './game/optimizedCollisionDetector';

// Enhanced Game State Management
export { 
  GameStateManager, 
  GameStateEnum, 
  type GameStateData, 
  type StateChangeCallback, 
  type StateTransitionCallback 
} from './game/gameState';
export { 
  StateTransitionManager, 
  StateTransitionAction, 
  type StateTransitionResult, 
  StateTransitionUtils 
} from './game/stateTransitions';
export { 
  GameStateMachine, 
  createGameStateMachine, 
  StateMachineUtils,
  type StateMachineEvent,
  type StateMachineConfig,
  type StateMachineStatus 
} from './game/gameStateMachine';
