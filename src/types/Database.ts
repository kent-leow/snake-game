import { Document } from 'mongoose';

/**
 * Game metrics interface for storing detailed game statistics
 */
export interface GameMetrics {
  totalFood: number;
  totalCombos: number;
  longestCombo: number;
  maxSpeedLevel: number;
  gameTimeSeconds: number;
  finalSnakeLength: number;
}

/**
 * Combo statistics interface for tracking combo-related metrics
 */
export interface ComboStats {
  totalComboPoints: number;
  basePoints: number;
  comboEfficiency: number; // Percentage of food eaten in combos
  averageComboLength: number;
}

/**
 * Optional metadata interface for additional game information
 */
export interface GameMetadata {
  browserInfo?: string;
  screenResolution?: string;
  gameVersion?: string;
  difficulty?: 'easy' | 'normal' | 'hard';
}

/**
 * Complete score document interface extending Mongoose Document
 */
export interface IScore extends Document {
  // Basic score information
  playerName: string;
  score: number;
  timestamp: Date;

  // Game metrics
  gameMetrics: GameMetrics;

  // Combo statistics
  comboStats: ComboStats;

  // Optional metadata
  metadata?: GameMetadata;

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input interface for creating new score records
 */
export interface ScoreInput {
  playerName: string;
  score: number;
  gameMetrics: GameMetrics;
  comboStats: ComboStats;
  metadata?: GameMetadata;
}

/**
 * Query interface for filtering scores
 */
export interface ScoreQuery {
  playerName?: string;
  minScore?: number;
  maxScore?: number;
  startDate?: Date;
  endDate?: Date;
  difficulty?: string;
  limit?: number;
  offset?: number;
}

/**
 * Leaderboard entry interface for public score displays
 */
export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  timestamp: Date;
  gameMetrics: {
    totalFood: number;
    totalCombos: number;
    longestCombo: number;
    gameTimeSeconds: number;
  };
}

/**
 * Score validation result interface
 */
export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}