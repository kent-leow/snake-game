/**
 * @jest-environment node
 */

import { connectToDatabase, disconnectFromDatabase, isConnected, getConnectionState } from '../../lib/database/connection';
import mongoose from 'mongoose';

// Mock environment variables for testing
const originalEnv = process.env;

describe('Atlas Connection Tests', () => {
  beforeEach(() => {
    // Reset mongoose connection state
    if (mongoose.connection.readyState !== 0) {
      mongoose.disconnect();
    }
    
    // Clear global cache
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  describe('Environment Detection', () => {
    it('should detect production environment and use MONGODB_URI', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/test?retryWrites=true&w=majority'
      };

      // Mock mongoose.connect to avoid actual connection
      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      
      try {
        await connectToDatabase();
        
        expect(mockConnect).toHaveBeenCalledWith(
          expect.stringContaining('mongodb+srv://'),
          expect.objectContaining({
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000
          })
        );
      } finally {
        mockConnect.mockRestore();
      }
    });

    it('should detect development environment and use MONGO_URL', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        MONGO_URL: 'mongodb://localhost:27017/test'
      };

      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      
      try {
        await connectToDatabase();
        
        expect(mockConnect).toHaveBeenCalledWith(
          'mongodb://localhost:27017/test',
          expect.objectContaining({
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 10000,
            autoIndex: true,
            autoCreate: true
          })
        );
      } finally {
        mockConnect.mockRestore();
      }
    });

    it('should throw error when no URI is provided', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production'
        // No MONGODB_URI or MONGO_URL
      };

      await expect(connectToDatabase()).rejects.toThrow('MONGODB_URI environment variable is required');
    });
  });

  describe('Atlas-specific Configuration', () => {
    it('should apply Atlas-specific options for SRV connection strings', async () => {
      process.env = {
        ...originalEnv,
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority'
      };

      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      
      try {
        await connectToDatabase();
        
        expect(mockConnect).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            retryWrites: true,
            w: 'majority',
            compressors: ['zlib'],
            zlibCompressionLevel: 6,
            family: 4
          })
        );
      } finally {
        mockConnect.mockRestore();
      }
    });

    it('should apply Atlas-specific options for .mongodb.net domains', async () => {
      process.env = {
        ...originalEnv,
        MONGODB_URI: 'mongodb://user:pass@cluster.mongodb.net:27017/db'
      };

      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      
      try {
        await connectToDatabase();
        
        expect(mockConnect).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            retryWrites: true,
            w: 'majority',
            compressors: ['zlib']
          })
        );
      } finally {
        mockConnect.mockRestore();
      }
    });
  });

  describe('Connection Pooling', () => {
    it('should configure production connection pooling', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/db'
      };

      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      
      try {
        await connectToDatabase();
        
        expect(mockConnect).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 30000
          })
        );
      } finally {
        mockConnect.mockRestore();
      }
    });

    it('should configure development connection pooling', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        MONGO_URL: 'mongodb://localhost:27017/test'
      };

      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      
      try {
        await connectToDatabase();
        
        expect(mockConnect).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            maxPoolSize: 5,
            minPoolSize: 1,
            maxIdleTimeMS: 60000
          })
        );
      } finally {
        mockConnect.mockRestore();
      }
    });
  });

  describe('Connection Caching', () => {
    it('should reuse existing connection', async () => {
      process.env = {
        ...originalEnv,
        MONGO_URL: 'mongodb://localhost:27017/test'
      };

      const mockConnection = { readyState: 1 } as mongoose.Connection;
      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue({
        connection: mockConnection
      } as any);
      
      try {
        const conn1 = await connectToDatabase();
        const conn2 = await connectToDatabase();
        
        expect(conn1).toBe(conn2);
        expect(mockConnect).toHaveBeenCalledTimes(1);
      } finally {
        mockConnect.mockRestore();
      }
    });

    it('should handle connection errors and reset cache', async () => {
      process.env = {
        ...originalEnv,
        MONGO_URL: 'mongodb://localhost:27017/test'
      };

      const mockConnect = jest.spyOn(mongoose, 'connect')
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mongoose);
      
      try {
        await expect(connectToDatabase()).rejects.toThrow('Connection failed');
        
        // Second attempt should work
        await connectToDatabase();
        
        expect(mockConnect).toHaveBeenCalledTimes(2);
      } finally {
        mockConnect.mockRestore();
      }
    });
  });

  describe('Connection State Management', () => {
    it('should report correct connection state', () => {
      // Mock mongoose connection states using Object.defineProperty
      const mockConnection = mongoose.connection;
      
      Object.defineProperty(mockConnection, 'readyState', {
        value: 0,
        configurable: true
      });
      expect(getConnectionState()).toBe('disconnected');
      expect(isConnected()).toBe(false);
      
      Object.defineProperty(mockConnection, 'readyState', {
        value: 1,
        configurable: true
      });
      expect(getConnectionState()).toBe('connected');
      expect(isConnected()).toBe(true);
      
      Object.defineProperty(mockConnection, 'readyState', {
        value: 2,
        configurable: true
      });
      expect(getConnectionState()).toBe('connecting');
      expect(isConnected()).toBe(false);
      
      Object.defineProperty(mockConnection, 'readyState', {
        value: 3,
        configurable: true
      });
      expect(getConnectionState()).toBe('disconnecting');
      expect(isConnected()).toBe(false);
    });
  });

  describe('Performance Configuration', () => {
    it('should set appropriate timeouts for production', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/db'
      };

      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      
      try {
        await connectToDatabase();
        
        expect(mockConnect).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000
          })
        );
      } finally {
        mockConnect.mockRestore();
      }
    });

    it('should allow custom timeout overrides', async () => {
      process.env = {
        ...originalEnv,
        MONGO_URL: 'mongodb://localhost:27017/test'
      };

      const mockConnect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      
      try {
        await connectToDatabase({
          serverSelectionTimeoutMS: 2000,
          socketTimeoutMS: 5000
        });
        
        expect(mockConnect).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            serverSelectionTimeoutMS: 2000,
            socketTimeoutMS: 5000
          })
        );
      } finally {
        mockConnect.mockRestore();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle connection timeout gracefully', async () => {
      process.env = {
        ...originalEnv,
        MONGO_URL: 'mongodb://localhost:27017/test'
      };

      const timeoutError = new Error('Server selection timed out');
      const mockConnect = jest.spyOn(mongoose, 'connect').mockRejectedValue(timeoutError);
      
      try {
        await expect(connectToDatabase()).rejects.toThrow('Server selection timed out');
      } finally {
        mockConnect.mockRestore();
      }
    });

    it('should handle authentication errors', async () => {
      process.env = {
        ...originalEnv,
        MONGODB_URI: 'mongodb+srv://invalid:pass@cluster.mongodb.net/db'
      };

      const authError = new Error('Authentication failed');
      const mockConnect = jest.spyOn(mongoose, 'connect').mockRejectedValue(authError);
      
      try {
        await expect(connectToDatabase()).rejects.toThrow('Authentication failed');
      } finally {
        mockConnect.mockRestore();
      }
    });
  });
});