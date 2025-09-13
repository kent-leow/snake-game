import mongoose from 'mongoose';

interface ConnectionOptions {
  bufferCommands?: boolean;
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(options?: ConnectionOptions): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is required');
    }

    const opts: mongoose.ConnectOptions = {
      bufferCommands: options?.bufferCommands ?? false,
      maxPoolSize: options?.maxPoolSize ?? 10,
      serverSelectionTimeoutMS: options?.serverSelectionTimeoutMS ?? 10000,
      socketTimeoutMS: options?.socketTimeoutMS ?? 45000,
    };

    cached.promise = mongoose.connect(mongoUrl, opts).then((mongoose) => {
      return mongoose.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (global.mongoose?.conn) {
    await mongoose.disconnect();
    global.mongoose.conn = null;
    global.mongoose.promise = null;
  }
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getConnectionState(): string {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

// Global mongoose cache type declaration
declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}