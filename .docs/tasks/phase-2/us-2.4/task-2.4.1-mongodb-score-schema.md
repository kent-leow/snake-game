# Task: Design MongoDB Score Schema

## Task Header

- **ID**: T-2.4.1
- **Title**: Design MongoDB Score Schema
- **Story ID**: US-2.4
- **Type**: database
- **Priority**: high
- **Effort Estimate**: 3-4 hours
- **Complexity**: simple

## Objective

Design and implement a comprehensive MongoDB schema for storing game scores with all relevant game statistics, ensuring efficient querying and proper data validation.

## Description

Create a well-structured MongoDB schema that captures not only basic score information but also detailed game metrics that support the combo system and provide insights for future feature development.

## Acceptance Criteria Covered

- GIVEN score saving WHEN attempted THEN player can optionally enter name for record
- GIVEN high scores WHEN viewing THEN personal best scores display in descending order
- GIVEN API endpoints WHEN accessed THEN scores can be retrieved and saved successfully

## Implementation Notes

- Design schema to support current features and future enhancements
- Include proper indexing for efficient queries
- Add data validation for security and integrity
- Consider data privacy and optional player information

## Technical Specifications

### File Targets

#### New Files

- `src/models/Score.ts` - Mongoose schema and model definition
- `src/types/Database.ts` - TypeScript interfaces for database objects
- `src/utils/scoreValidation.ts` - Score data validation utilities

#### Modified Files

- `src/lib/mongodb.ts` - Add score model registration

### Database Schema

```typescript
import { Schema, model, models, Document } from 'mongoose';

interface IScore extends Document {
  // Basic score information
  playerName: string;
  score: number;
  timestamp: Date;

  // Game metrics
  gameMetrics: {
    totalFood: number;
    totalCombos: number;
    longestCombo: number;
    maxSpeedLevel: number;
    gameTimeSeconds: number;
    finalSnakeLength: number;
  };

  // Combo statistics
  comboStats: {
    totalComboPoints: number;
    basePoints: number;
    comboEfficiency: number; // Percentage of food eaten in combos
    averageComboLength: number;
  };

  // Optional metadata
  metadata?: {
    browserInfo: string;
    screenResolution: string;
    gameVersion: string;
    difficulty?: string;
  };
}

const ScoreSchema = new Schema<IScore>(
  {
    // Player information
    playerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, 'Player name cannot exceed 20 characters'],
      minlength: [1, 'Player name is required'],
      validate: {
        validator: (name: string) => /^[a-zA-Z0-9\s\-_]+$/.test(name),
        message:
          'Player name can only contain letters, numbers, spaces, hyphens, and underscores',
      },
    },

    // Core score data
    score: {
      type: Number,
      required: true,
      min: [0, 'Score cannot be negative'],
      max: [1000000, 'Score seems unrealistically high'],
      validate: {
        validator: Number.isInteger,
        message: 'Score must be an integer',
      },
    },

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Game metrics
    gameMetrics: {
      totalFood: {
        type: Number,
        required: true,
        min: 0,
        validate: Number.isInteger,
      },
      totalCombos: {
        type: Number,
        required: true,
        min: 0,
        validate: Number.isInteger,
      },
      longestCombo: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        validate: Number.isInteger,
      },
      maxSpeedLevel: {
        type: Number,
        required: true,
        min: 0,
        max: 50,
        validate: Number.isInteger,
      },
      gameTimeSeconds: {
        type: Number,
        required: true,
        min: 1,
        max: 7200, // 2 hours max game time
      },
      finalSnakeLength: {
        type: Number,
        required: true,
        min: 1,
        max: 10000,
        validate: Number.isInteger,
      },
    },

    // Combo statistics
    comboStats: {
      totalComboPoints: {
        type: Number,
        required: true,
        min: 0,
        validate: Number.isInteger,
      },
      basePoints: {
        type: Number,
        required: true,
        min: 0,
        validate: Number.isInteger,
      },
      comboEfficiency: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      averageComboLength: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
      },
    },

    // Optional metadata
    metadata: {
      browserInfo: {
        type: String,
        maxlength: 200,
      },
      screenResolution: {
        type: String,
        maxlength: 20,
      },
      gameVersion: {
        type: String,
        maxlength: 10,
      },
      difficulty: {
        type: String,
        enum: ['easy', 'normal', 'hard'],
        default: 'normal',
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'scores',
  }
);
```

### Indexes for Performance

```typescript
// Create indexes for efficient querying
ScoreSchema.index({ score: -1 }); // High scores first
ScoreSchema.index({ timestamp: -1 }); // Recent scores first
ScoreSchema.index({ playerName: 1, score: -1 }); // Player's best scores
ScoreSchema.index({ 'gameMetrics.totalCombos': -1 }); // Most combos
ScoreSchema.index({ 'gameMetrics.gameTimeSeconds': -1 }); // Longest games

// Compound index for leaderboards
ScoreSchema.index({
  score: -1,
  'gameMetrics.totalCombos': -1,
  timestamp: -1,
});
```

### Validation Utilities

```typescript
// src/utils/scoreValidation.ts
export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateScoreData = (
  scoreData: Partial<IScore>
): ScoreValidationResult => {
  const errors: string[] = [];

  // Basic validation
  if (!scoreData.score || scoreData.score < 0) {
    errors.push('Invalid score value');
  }

  if (!scoreData.playerName || scoreData.playerName.trim().length === 0) {
    errors.push('Player name is required');
  }

  // Game metrics validation
  if (scoreData.gameMetrics) {
    const { totalFood, totalCombos, score } = scoreData.gameMetrics;

    // Sanity check: score should be reasonable based on food eaten
    const expectedMinScore = totalFood * 10; // Base points only
    if (scoreData.score < expectedMinScore) {
      errors.push('Score too low for amount of food consumed');
    }

    // Combo validation
    if (totalCombos > totalFood / 5) {
      errors.push('Too many combos for food consumed');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

## Testing Requirements

### Unit Tests

- Test schema validation with valid data
- Test schema validation with invalid data
- Test index creation and query performance
- Test data sanitization and security

### Integration Tests

- Test database connection and model operations
- Test CRUD operations with realistic data
- Test query performance with sample datasets

### E2E Scenarios

- Save complete score record and verify all fields
- Query high scores and verify proper ordering
- Test data integrity with concurrent saves

## Dependencies

### Prerequisite Tasks

None - this is a foundational database task

### Blocking Tasks

None

### External Dependencies

- MongoDB database connection
- Mongoose ODM library

## Risks and Considerations

### Technical Risks

- **Data Integrity**: Invalid or malicious score data being saved
- **Performance**: Poor query performance with large datasets

### Implementation Challenges

- **Schema Evolution**: Future changes requiring data migration
- **Validation Balance**: Too strict validation blocking legitimate scores

### Mitigation Strategies

- Implement comprehensive data validation
- Use proper indexing for common query patterns
- Plan for schema versioning and migration
- Add monitoring for unusual score patterns
- Implement rate limiting for score submissions

---

_This task establishes a robust, scalable database foundation for persistent score tracking with comprehensive game analytics._
