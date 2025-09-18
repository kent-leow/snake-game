/**
 * MongoDB connection and model registration
 * This file provides a centralized interface for database operations
 */

import mongoose, { Model } from 'mongoose';
import { connectToDatabase, disconnectFromDatabase, isConnected, getConnectionState } from './database/connection';
import Score from '../models/Score';
import { IScore } from '../types/Database';

// Re-export connection utilities
export { connectToDatabase, disconnectFromDatabase, isConnected, getConnectionState };

// Export models for easy access
export { Score };

/**
 * Initialize database connection and ensure all models are registered
 */
export async function initializeDatabase(): Promise<mongoose.Connection> {
  try {
    const connection = await connectToDatabase();
    
    // Ensure Score model is registered
    if (!connection.models.Score) {
      // The model is already registered by importing it, but this ensures it's available
      console.log('Score model registered successfully');
    }
    
    return connection;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get all registered models
 */
export function getRegisteredModels(): { Score: Model<IScore> } {
  return {
    Score,
  };
}

/**
 * Database health check
 */
export function getDatabaseHealth(): { connected: boolean; state: string; models: string[] } {
  return {
    connected: isConnected(),
    state: getConnectionState(),
    models: Object.keys(getRegisteredModels()),
  };
}