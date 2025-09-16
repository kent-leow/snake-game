import {
  connectToDatabase,
  disconnectFromDatabase,
  isConnected,
  getConnectionState,
} from '../connection';
import mongoose from 'mongoose';

// Mock environment variables
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    MONGO_URL: 'mongodb://test_user:test_password@localhost:27017/test_db',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  connection: {
    readyState: 0,
  },
}));

const mockedMongoose = mongoose as jest.Mocked<typeof mongoose>;

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global cache completely
    (global as Record<string, unknown>).mongoose = undefined;
  });

  afterEach(async () => {
    await disconnectFromDatabase();
    // Clean up global state after each test
    (global as Record<string, unknown>).mongoose = undefined;
  });

  describe('connectToDatabase', () => {
    it('should throw error when MONGO_URL is not provided', async () => {
      delete process.env.MONGO_URL;

      await expect(connectToDatabase()).rejects.toThrow(
        'MONGO_URL environment variable is required'
      );
    });

    it('should connect to database with default options', async () => {
      const mockConnection = { readyState: 1 };
      mockedMongoose.connect.mockResolvedValue({
        connection: mockConnection,
      } as any);

      process.env.MONGO_URL =
        'mongodb://test_user:test_password@localhost:27017/test_db';

      const connection = await connectToDatabase();

      expect(mockedMongoose.connect).toHaveBeenCalledWith(
        'mongodb://test_user:test_password@localhost:27017/test_db',
        {
          bufferCommands: false,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        }
      );
      expect(connection).toBe(mockConnection);
    });

    it('should connect to database with custom options', async () => {
      const mockConnection = { readyState: 1 };
      mockedMongoose.connect.mockResolvedValue({
        connection: mockConnection,
      } as any);

      process.env.MONGO_URL =
        'mongodb://test_user:test_password@localhost:27017/test_db';

      const customOptions = {
        bufferCommands: true,
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
      };

      const connection = await connectToDatabase(customOptions);

      expect(mockedMongoose.connect).toHaveBeenCalledWith(
        'mongodb://test_user:test_password@localhost:27017/test_db',
        customOptions
      );
      expect(connection).toBe(mockConnection);
    });

    it('should return cached connection if already connected', async () => {
      const mockConnection = { readyState: 1 };
      global.mongoose = { conn: mockConnection as any, promise: null };

      const connection = await connectToDatabase();

      // Should not call mongoose.connect since we have a cached connection
      expect(connection).toBe(mockConnection);
    });

    it('should handle connection errors and reset promise', async () => {
      const connectionError = new Error('Connection failed');
      mockedMongoose.connect.mockRejectedValue(connectionError);

      process.env.MONGO_URL =
        'mongodb://test_user:test_password@localhost:27017/test_db';

      await expect(connectToDatabase()).rejects.toThrow('Connection failed');
      expect(global.mongoose.promise).toBeNull();
    });
  });

  describe('disconnectFromDatabase', () => {
    it('should disconnect from database when connected', async () => {
      const mockConnection = { readyState: 1 };
      // Need to properly set up the cached reference
      if (!global.mongoose) {
        global.mongoose = { conn: null, promise: null };
      }
      global.mongoose.conn = mockConnection as any;

      await disconnectFromDatabase();

      expect(mockedMongoose.disconnect).toHaveBeenCalled();
      expect(global.mongoose.conn).toBeNull();
      expect(global.mongoose.promise).toBeNull();
    });

    it('should not call disconnect when not connected', async () => {
      global.mongoose = { conn: null, promise: null };

      await disconnectFromDatabase();

      expect(mockedMongoose.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', () => {
      Object.defineProperty(mockedMongoose.connection, 'readyState', {
        value: 1,
        writable: true,
      });
      expect(isConnected()).toBe(true);
    });

    it('should return false when not connected', () => {
      Object.defineProperty(mockedMongoose.connection, 'readyState', {
        value: 0,
        writable: true,
      });
      expect(isConnected()).toBe(false);
    });
  });

  describe('getConnectionState', () => {
    it('should return correct state for disconnected', () => {
      Object.defineProperty(mockedMongoose.connection, 'readyState', {
        value: 0,
        writable: true,
      });
      expect(getConnectionState()).toBe('disconnected');
    });

    it('should return correct state for connected', () => {
      Object.defineProperty(mockedMongoose.connection, 'readyState', {
        value: 1,
        writable: true,
      });
      expect(getConnectionState()).toBe('connected');
    });

    it('should return correct state for connecting', () => {
      Object.defineProperty(mockedMongoose.connection, 'readyState', {
        value: 2,
        writable: true,
      });
      expect(getConnectionState()).toBe('connecting');
    });

    it('should return correct state for disconnecting', () => {
      Object.defineProperty(mockedMongoose.connection, 'readyState', {
        value: 3,
        writable: true,
      });
      expect(getConnectionState()).toBe('disconnecting');
    });

    it('should return unknown for invalid state', () => {
      Object.defineProperty(mockedMongoose.connection, 'readyState', {
        value: 99,
        writable: true,
      });
      expect(getConnectionState()).toBe('unknown');
    });
  });
});
