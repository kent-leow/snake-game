# MongoDB Score Schema Implementation

## Overview

This document describes the implementation of the MongoDB score schema for the Snake game, providing comprehensive score tracking with detailed game analytics.

## Schema Design

### Core Components

#### 1. Score Model (`src/models/Score.ts`)
- **Purpose**: Mongoose schema for storing game scores with comprehensive validation
- **Features**: 
  - Input validation with custom validators
  - Cross-field validation for data integrity
  - Performance-optimized indexes
  - Comprehensive error handling

#### 2. Database Types (`src/types/Database.ts`)
- **Purpose**: TypeScript interfaces for type safety and code consistency
- **Components**:
  - `IScore`: Main score document interface
  - `ScoreInput`: Input validation interface
  - `GameMetrics`: Detailed game statistics
  - `ComboStats`: Combo-related metrics
  - `LeaderboardEntry`: Public score display interface

#### 3. Validation Utilities (`src/utils/scoreValidation.ts`)
- **Purpose**: Comprehensive score data validation before database operations
- **Features**:
  - Field-level validation
  - Cross-field consistency checks
  - Input sanitization
  - Error message formatting

#### 4. MongoDB Connection (`src/lib/mongodb.ts`)
- **Purpose**: Centralized database connection and model registration
- **Features**:
  - Connection pooling
  - Health monitoring
  - Model registration
  - Error handling

## Database Schema Structure

```typescript
interface ScoreDocument {
  // Basic Information
  playerName: string;          // 1-20 chars, alphanumeric + spaces/hyphens/underscores
  score: number;               // Integer, 0-1,000,000
  timestamp: Date;             // Auto-generated

  // Game Metrics
  gameMetrics: {
    totalFood: number;         // Total food consumed
    totalCombos: number;       // Number of combos achieved
    longestCombo: number;      // Longest single combo
    maxSpeedLevel: number;     // Highest speed level reached
    gameTimeSeconds: number;   // Game duration (1-7200 seconds)
    finalSnakeLength: number;  // Final length of snake
  };

  // Combo Statistics
  comboStats: {
    totalComboPoints: number;    // Points from combos
    basePoints: number;          // Points from regular food
    comboEfficiency: number;     // Percentage (0-100)
    averageComboLength: number;  // Average length of combos
  };

  // Optional Metadata
  metadata?: {
    browserInfo?: string;        // Browser information
    screenResolution?: string;   // Format: "1920x1080"
    gameVersion?: string;        // Game version
    difficulty?: 'easy' | 'normal' | 'hard';
  };

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}
```

## Validation Rules

### Player Name
- Required field
- 1-20 characters
- Only letters, numbers, spaces, hyphens, underscores
- Trimmed whitespace

### Score
- Required integer
- Range: 0 to 1,000,000
- Must be reasonable relative to food consumed

### Game Metrics
- All fields required and non-negative integers
- Game time: 1 second to 2 hours
- Cross-validation ensures logical consistency

### Combo Stats
- All fields required and non-negative
- Efficiency: 0-100%
- Must align with overall score calculation

### Metadata (Optional)
- Browser info: max 200 characters
- Screen resolution: format "WIDTHxHEIGHT"
- Game version: max 10 characters
- Difficulty: enum values only

## Database Indexes

### Performance Indexes
```typescript
// Single field indexes
{ score: -1 }                    // High scores first
{ timestamp: -1 }                // Recent scores first
{ playerName: 1, score: -1 }     // Player's best scores
{ 'gameMetrics.totalCombos': -1 } // Most combos
{ createdAt: -1 }                // Recently created

// Compound indexes
{ score: -1, 'gameMetrics.totalCombos': -1, timestamp: -1 } // Leaderboards
{ playerName: 1, score: -1, timestamp: -1 }                // Player queries
```

## Usage Examples

### Creating a Score Record
```typescript
import { Score } from '../lib/mongodb';
import { validateScoreData } from '../utils/scoreValidation';

const scoreData = {
  playerName: 'Player1',
  score: 1250,
  gameMetrics: {
    totalFood: 50,
    totalCombos: 10,
    longestCombo: 5,
    maxSpeedLevel: 3,
    gameTimeSeconds: 120,
    finalSnakeLength: 55,
  },
  comboStats: {
    totalComboPoints: 750,
    basePoints: 500,
    comboEfficiency: 80,
    averageComboLength: 3.2,
  }
};

// Validate before saving
const validation = validateScoreData(scoreData);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// Save to database
const score = new Score(scoreData);
await score.save();
```

### Querying High Scores
```typescript
// Get top 10 scores
const topScores = await Score
  .find()
  .sort({ score: -1 })
  .limit(10)
  .select('playerName score gameMetrics.totalCombos timestamp');

// Get player's best scores
const playerScores = await Score
  .find({ playerName: 'Player1' })
  .sort({ score: -1 })
  .limit(5);
```

## Error Handling

### Validation Errors
- Field-level validation with specific error messages
- Cross-field consistency checks
- Input sanitization for security

### Database Errors
- Connection error handling
- Duplicate key handling
- Transaction support for complex operations

## Testing

### Unit Tests
- **Score Model Tests**: Schema validation, indexes, cross-field validation
- **Validation Utility Tests**: All validation rules, edge cases, sanitization
- **Connection Tests**: Model registration, health checks, error handling

### Test Coverage
- 35+ test cases covering all validation scenarios
- Performance tests for database operations
- Integration tests with game systems

## Performance Considerations

### Query Optimization
- Strategic indexing for common query patterns
- Efficient sorting and filtering
- Limited result sets to prevent memory issues

### Validation Performance
- Lightweight validation before expensive database operations
- Early validation failures to save resources
- Optimized validation order for common cases

## Security Features

### Input Validation
- SQL injection prevention through Mongoose
- Input sanitization for player names
- Strict data type validation

### Data Integrity
- Cross-field validation prevents inconsistent data
- Range checks prevent unrealistic values
- Required field validation ensures complete records

## Future Enhancements

### Planned Features
- Score aggregation for leaderboards
- Player statistics and achievements
- Game session tracking
- Performance analytics

### Schema Evolution
- Version tracking for migrations
- Backward compatibility considerations
- Index optimization based on usage patterns

## Dependencies

### Required Packages
- `mongoose`: ^8.18.1 - MongoDB ODM
- `@types/mongoose`: ^5.11.96 - TypeScript definitions

### Environment Variables
- `MONGO_URL`: MongoDB connection string

## Deployment Notes

### Database Setup
1. Ensure MongoDB is running and accessible
2. Set `MONGO_URL` environment variable
3. Run database validation: `npm run db:validate`
4. Initialize connection: `npm run db:up`

### Production Considerations
- Configure appropriate connection pooling
- Set up database monitoring
- Implement backup strategies
- Monitor index performance

---

_This implementation provides a robust, scalable foundation for score tracking with comprehensive validation and analytics capabilities._