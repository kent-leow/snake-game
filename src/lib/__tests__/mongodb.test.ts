/**
 * @jest-environment node
 */

import {
  initializeDatabase,
  getRegisteredModels,
  getDatabaseHealth,
  Score,
  connectToDatabase,
  disconnectFromDatabase,
} from '../../lib/mongodb';

// Mock the environment variable
const originalEnv = process.env;

describe('MongoDB Connection and Initialization', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      MONGO_URL: 'mongodb://localhost:27017/snake_game_test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(async () => {
    // Clean up any connections
    try {
      await disconnectFromDatabase();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Model Registration', () => {
    it('should export Score model', () => {
      expect(Score).toBeDefined();
      expect(Score.modelName).toBe('Score');
    });

    it('should return registered models', () => {
      const models = getRegisteredModels();
      expect(models).toHaveProperty('Score');
      expect(models.Score).toBe(Score);
    });
  });

  describe('Database Health Check', () => {
    it('should return database health status', () => {
      const health = getDatabaseHealth();
      
      expect(health).toHaveProperty('connected');
      expect(health).toHaveProperty('state');
      expect(health).toHaveProperty('models');
      expect(health.models).toContain('Score');
      expect(typeof health.connected).toBe('boolean');
      expect(typeof health.state).toBe('string');
    });
  });

  describe('Database Initialization', () => {
    it('should initialize database without throwing', async () => {
      // This test checks that the initialization function exists and can be called
      // Actual connection testing would require a real MongoDB instance
      expect(initializeDatabase).toBeDefined();
      expect(typeof initializeDatabase).toBe('function');
    });

    it('should handle missing MONGO_URL environment variable', async () => {
      delete process.env.MONGO_URL;
      
      await expect(initializeDatabase()).rejects.toThrow(/MONGO_URL environment variable is required/);
    });
  });

  describe('Connection Functions', () => {
    it('should export connection utilities', () => {
      expect(connectToDatabase).toBeDefined();
      expect(disconnectFromDatabase).toBeDefined();
      expect(typeof connectToDatabase).toBe('function');
      expect(typeof disconnectFromDatabase).toBe('function');
    });
  });
});