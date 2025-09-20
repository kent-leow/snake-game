import mongoose from 'mongoose';

interface ConnectionOptions {
  bufferCommands?: boolean;
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  retryWrites?: boolean;
  w?: any; // WriteConcern can be string or number
}

interface MongoConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

// Function to get or initialize the cache
function getCache() {
  if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
  }
  return global.mongoose;
}

/**
 * Get MongoDB configuration based on environment
 */
function getMongoConfig(options?: ConnectionOptions): MongoConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Primary URI (production uses MONGODB_URI, development uses MONGO_URL)
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  
  if (!uri) {
    const envVar = isProduction ? 'MONGODB_URI' : 'MONGO_URL';
    throw new Error(`${envVar} environment variable is required`);
  }

  // Detect Atlas connection
  const isAtlas = uri.includes('mongodb+srv://') || uri.includes('.mongodb.net');
  
  // Base connection options
  const baseOptions: mongoose.ConnectOptions = {
    bufferCommands: options?.bufferCommands ?? false,
    serverSelectionTimeoutMS: options?.serverSelectionTimeoutMS ?? (isProduction ? 5000 : 10000),
    socketTimeoutMS: options?.socketTimeoutMS ?? (isProduction ? 10000 : 45000),
    maxPoolSize: options?.maxPoolSize ?? (isProduction ? 10 : 5),
    minPoolSize: isProduction ? 2 : 1,
    maxIdleTimeMS: isProduction ? 30000 : 60000,
    family: 4, // IPv4
  };

  // Atlas-specific options
  if (isAtlas) {
    baseOptions.retryWrites = options?.retryWrites ?? true;
    baseOptions.w = options?.w ?? 'majority';
    baseOptions.compressors = ['zlib'];
    baseOptions.zlibCompressionLevel = 6;
  }

  // Development-specific options
  if (!isProduction) {
    baseOptions.autoIndex = true;
    baseOptions.autoCreate = true;
  }

  return {
    uri,
    options: baseOptions
  };
}

export async function connectToDatabase(
  options?: ConnectionOptions
): Promise<mongoose.Connection> {
  const cached = getCache();
  
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const config = getMongoConfig(options);
    
    console.log(`Connecting to MongoDB (${process.env.NODE_ENV || 'development'})...`);
    
    cached.promise = mongoose.connect(config.uri, config.options).then(mongoose => {
      console.log('MongoDB connected successfully');
      return mongoose.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection failed:', e);
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
