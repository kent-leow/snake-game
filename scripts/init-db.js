// MongoDB Database Initialization Script
// This script runs when the MongoDB container starts for the first time

// Switch to the snake_game database
db = db.getSiblingDB('snake_game');

// Create collections with initial configuration
db.createCollection('game_scores', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['playerName', 'score', 'timestamp'],
      properties: {
        playerName: {
          bsonType: 'string',
          description: 'Player name must be a string and is required',
        },
        score: {
          bsonType: 'int',
          minimum: 0,
          description: 'Score must be a non-negative integer and is required',
        },
        timestamp: {
          bsonType: 'date',
          description: 'Timestamp must be a date and is required',
        },
        gameMode: {
          bsonType: 'string',
          enum: ['classic', 'speed', 'challenge'],
          description: 'Game mode must be one of the allowed values',
        },
        difficulty: {
          bsonType: 'string',
          enum: ['easy', 'medium', 'hard'],
          description: 'Difficulty must be one of the allowed values',
        },
      },
    },
  },
});

db.createCollection('game_sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sessionId', 'startTime'],
      properties: {
        sessionId: {
          bsonType: 'string',
          description: 'Session ID must be a string and is required',
        },
        startTime: {
          bsonType: 'date',
          description: 'Start time must be a date and is required',
        },
        endTime: {
          bsonType: 'date',
          description: 'End time must be a date',
        },
        playerName: {
          bsonType: 'string',
          description: 'Player name must be a string',
        },
      },
    },
  },
});

// Create indexes for better performance
db.game_scores.createIndex({ score: -1 }); // For high score queries
db.game_scores.createIndex({ timestamp: -1 }); // For recent scores
db.game_scores.createIndex({ playerName: 1, score: -1 }); // For player-specific scores

db.game_sessions.createIndex({ sessionId: 1 }, { unique: true }); // Unique session IDs
db.game_sessions.createIndex({ startTime: -1 }); // For recent sessions

// Insert some sample data for development
db.game_scores.insertMany([
  {
    playerName: 'Demo Player',
    score: 150,
    timestamp: new Date(),
    gameMode: 'classic',
    difficulty: 'medium',
  },
  {
    playerName: 'Test User',
    score: 200,
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    gameMode: 'speed',
    difficulty: 'hard',
  },
]);

console.log('Database initialization completed successfully');
console.log('Collections created: game_scores, game_sessions');
console.log('Indexes created for performance optimization');
console.log('Sample data inserted for development testing');
