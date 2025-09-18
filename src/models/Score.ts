import { Schema, model, models, Model } from 'mongoose';
import { IScore } from '../types/Database';

/**
 * Mongoose schema for game scores with comprehensive validation and indexing
 */
const ScoreSchema = new Schema<IScore>(
  {
    // Player information
    playerName: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true,
      maxlength: [20, 'Player name cannot exceed 20 characters'],
      minlength: [1, 'Player name cannot be empty'],
      validate: {
        validator: (name: string): boolean => /^[a-zA-Z0-9\s\-_]+$/.test(name),
        message:
          'Player name can only contain letters, numbers, spaces, hyphens, and underscores',
      },
    },

    // Core score data
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
      max: [1000000, 'Score seems unrealistically high'],
      validate: {
        validator: Number.isInteger as (value: number) => boolean,
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
        required: [true, 'Total food count is required'],
        min: [0, 'Total food cannot be negative'],
        validate: {
          validator: Number.isInteger as (value: number) => boolean,
          message: 'Total food must be an integer',
        },
      },
      totalCombos: {
        type: Number,
        required: [true, 'Total combos count is required'],
        min: [0, 'Total combos cannot be negative'],
        validate: {
          validator: Number.isInteger as (value: number) => boolean,
          message: 'Total combos must be an integer',
        },
      },
      longestCombo: {
        type: Number,
        required: [true, 'Longest combo is required'],
        min: [0, 'Longest combo cannot be negative'],
        max: [100, 'Longest combo seems unrealistically high'],
        validate: {
          validator: Number.isInteger as (value: number) => boolean,
          message: 'Longest combo must be an integer',
        },
      },
      maxSpeedLevel: {
        type: Number,
        required: [true, 'Max speed level is required'],
        min: [0, 'Max speed level cannot be negative'],
        max: [50, 'Max speed level seems unrealistically high'],
        validate: {
          validator: Number.isInteger as (value: number) => boolean,
          message: 'Max speed level must be an integer',
        },
      },
      gameTimeSeconds: {
        type: Number,
        required: [true, 'Game time is required'],
        min: [1, 'Game time must be at least 1 second'],
        max: [7200, 'Game time cannot exceed 2 hours'],
        validate: {
          validator: (value: number): boolean => value > 0 && Number.isFinite(value),
          message: 'Game time must be a positive number',
        },
      },
      finalSnakeLength: {
        type: Number,
        required: [true, 'Final snake length is required'],
        min: [1, 'Snake length must be at least 1'],
        max: [10000, 'Snake length seems unrealistically high'],
        validate: {
          validator: Number.isInteger as (value: number) => boolean,
          message: 'Snake length must be an integer',
        },
      },
    },

    // Combo statistics
    comboStats: {
      totalComboPoints: {
        type: Number,
        required: [true, 'Total combo points is required'],
        min: [0, 'Total combo points cannot be negative'],
        validate: {
          validator: Number.isInteger as (value: number) => boolean,
          message: 'Total combo points must be an integer',
        },
      },
      basePoints: {
        type: Number,
        required: [true, 'Base points is required'],
        min: [0, 'Base points cannot be negative'],
        validate: {
          validator: Number.isInteger as (value: number) => boolean,
          message: 'Base points must be an integer',
        },
      },
      comboEfficiency: {
        type: Number,
        required: [true, 'Combo efficiency is required'],
        min: [0, 'Combo efficiency cannot be negative'],
        max: [100, 'Combo efficiency cannot exceed 100%'],
        validate: {
          validator: (value: number): boolean => Number.isFinite(value),
          message: 'Combo efficiency must be a valid number',
        },
      },
      averageComboLength: {
        type: Number,
        required: [true, 'Average combo length is required'],
        min: [0, 'Average combo length cannot be negative'],
        max: [50, 'Average combo length seems unrealistically high'],
        validate: {
          validator: (value: number): boolean => Number.isFinite(value),
          message: 'Average combo length must be a valid number',
        },
      },
    },

    // Optional metadata
    metadata: {
      browserInfo: {
        type: String,
        maxlength: [200, 'Browser info too long'],
        trim: true,
      },
      screenResolution: {
        type: String,
        maxlength: [20, 'Screen resolution string too long'],
        trim: true,
        validate: {
          validator: (resolution: string): boolean =>
            !resolution || /^\d+x\d+$/.test(resolution),
          message: 'Screen resolution must be in format "1920x1080"',
        },
      },
      gameVersion: {
        type: String,
        maxlength: [10, 'Game version string too long'],
        trim: true,
      },
      difficulty: {
        type: String,
        enum: {
          values: ['easy', 'normal', 'hard'],
          message: 'Difficulty must be easy, normal, or hard',
        },
        default: 'normal',
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'scores',
    versionKey: false, // Disable __v field
  }
);

// Create indexes for efficient querying
ScoreSchema.index({ score: -1 }); // High scores first
ScoreSchema.index({ timestamp: -1 }); // Recent scores first
ScoreSchema.index({ playerName: 1, score: -1 }); // Player's best scores
ScoreSchema.index({ 'gameMetrics.totalCombos': -1 }); // Most combos
ScoreSchema.index({ 'gameMetrics.gameTimeSeconds': -1 }); // Longest games
ScoreSchema.index({ createdAt: -1 }); // Recently created scores

// Compound index for leaderboards
ScoreSchema.index({
  score: -1,
  'gameMetrics.totalCombos': -1,
  timestamp: -1,
});

// Compound index for player queries
ScoreSchema.index({
  playerName: 1,
  score: -1,
  timestamp: -1,
});

// Add custom validation for cross-field consistency
ScoreSchema.pre('validate', function (next) {
  // Validate that total score is reasonable based on game metrics
  const minExpectedScore = this.gameMetrics.totalFood * 10; // Base points only
  if (this.score < minExpectedScore) {
    next(new Error('Score too low for amount of food consumed'));
    return;
  }

  // Validate combo consistency
  if (this.gameMetrics.totalCombos > this.gameMetrics.totalFood) {
    next(new Error('Cannot have more combos than total food consumed'));
    return;
  }

  // Validate longest combo doesn't exceed total combos
  if (this.gameMetrics.longestCombo > this.gameMetrics.totalFood) {
    next(new Error('Longest combo cannot exceed total food consumed'));
    return;
  }

  // Validate score components add up reasonably
  const totalCalculatedPoints = this.comboStats.basePoints + this.comboStats.totalComboPoints;
  if (this.score > totalCalculatedPoints * 1.1) { // Allow 10% variance for bonuses
    next(new Error('Score significantly higher than calculated points'));
    return;
  }

  next();
});

// Create and export the model
const Score: Model<IScore> = models.Score || model<IScore>('Score', ScoreSchema);

export default Score;
export { ScoreSchema };