import { connectToDatabase } from '@/lib/database/connection';
import Score from '@/models/Score';
import { validateScoreData } from '@/utils/scoreValidation';
import { ValidationError, SecurityError, DatabaseError } from './errorHandler';
import { ScoreInput, IScore } from '@/types/Database';

/**
 * Options for retrieving scores with pagination and sorting
 */
interface GetScoresOptions {
  limit: number;
  offset: number;
  sortBy: string;
  order: 'asc' | 'desc';
}

/**
 * Options for leaderboard queries
 */
interface LeaderboardOptions {
  period: 'daily' | 'weekly' | 'monthly' | 'all';
  limit: number;
}

/**
 * Result interface for score queries
 */
interface GetScoresResult {
  scores: any[];
  total: number;
}

/**
 * In-memory rate limiting cache (consider Redis for production)
 */
declare global {
  var rateLimitCache: Record<string, number> | undefined;
}

/**
 * Service class for handling score-related business logic
 */
export class ScoreService {
  /**
   * Create a new score record with validation and security checks
   */
  async createScore(scoreData: any): Promise<IScore> {
    try {
      // Ensure database connection
      await connectToDatabase();

      // Validate input data
      const validation = validateScoreData(scoreData);
      if (!validation.isValid) {
        throw new ValidationError('Invalid score data', validation.errors);
      }

      // Additional security checks
      await this.performSecurityChecks(scoreData);

      // Save to database
      const score = new Score({
        ...scoreData,
        timestamp: new Date(),
      });

      await score.save();
      return score;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof SecurityError) {
        throw error;
      }
      
      // Log and wrap database errors
      console.error('Database error in createScore:', error);
      throw new DatabaseError('Failed to save score', error as Error);
    }
  }

  /**
   * Retrieve scores with pagination and sorting
   */
  async getScores(options: GetScoresOptions): Promise<GetScoresResult> {
    try {
      // Ensure database connection
      await connectToDatabase();

      const { limit, offset, sortBy, order } = options;

      // Validate sort field
      const allowedSortFields = [
        'score',
        'timestamp',
        'createdAt',
        'playerName',
        'gameMetrics.totalFood',
        'gameMetrics.totalCombos',
        'gameMetrics.gameTimeSeconds',
      ];

      if (!allowedSortFields.includes(sortBy)) {
        throw new ValidationError('Invalid sort field', [`Sort field must be one of: ${allowedSortFields.join(', ')}`]);
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sortBy] = order === 'desc' ? -1 : 1;

      // Add secondary sort for consistent ordering
      if (sortBy !== 'timestamp') {
        sortObj.timestamp = -1;
      }

      // Execute query with proper error handling
      const [scores, total] = await Promise.all([
        Score.find({})
          .sort(sortObj)
          .limit(limit)
          .skip(offset)
          .lean()
          .exec(),
        Score.countDocuments({}).exec(),
      ]);

      return { scores, total };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      console.error('Database error in getScores:', error);
      throw new DatabaseError('Failed to retrieve scores', error as Error);
    }
  }

  /**
   * Get scores for a specific player
   */
  async getPlayerScores(playerName: string, limit: number): Promise<any[]> {
    try {
      // Ensure database connection
      await connectToDatabase();

      // Validate input
      if (!playerName || typeof playerName !== 'string') {
        throw new ValidationError('Invalid player name', ['Player name must be a non-empty string']);
      }

      if (limit < 1 || limit > 50) {
        throw new ValidationError('Invalid limit', ['Limit must be between 1 and 50']);
      }

      // Query player scores
      const scores = await Score.find({ playerName })
        .sort({ score: -1, timestamp: -1 })
        .limit(limit)
        .lean()
        .exec();

      return scores;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      console.error('Database error in getPlayerScores:', error);
      throw new DatabaseError('Failed to retrieve player scores', error as Error);
    }
  }

  /**
   * Get leaderboard based on time period
   */
  async getLeaderboard(options: LeaderboardOptions): Promise<any[]> {
    try {
      // Ensure database connection
      await connectToDatabase();

      const { period, limit } = options;

      // Validate limit
      if (limit < 1 || limit > 100) {
        throw new ValidationError('Invalid limit', ['Limit must be between 1 and 100']);
      }

      // Build date filter based on period
      let dateFilter = {};
      const now = new Date();

      switch (period) {
        case 'daily':
          const dayStart = new Date(now);
          dayStart.setHours(0, 0, 0, 0);
          dateFilter = { timestamp: { $gte: dayStart } };
          break;

        case 'weekly':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          dateFilter = { timestamp: { $gte: weekStart } };
          break;

        case 'monthly':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { timestamp: { $gte: monthStart } };
          break;

        case 'all':
        default:
          // No date filter for all-time leaderboard
          break;
      }

      // Query leaderboard
      const leaderboard = await Score.find(dateFilter)
        .sort({ score: -1, timestamp: 1 })
        .limit(limit)
        .lean()
        .exec();

      return leaderboard;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      console.error('Database error in getLeaderboard:', error);
      throw new DatabaseError('Failed to retrieve leaderboard', error as Error);
    }
  }

  /**
   * Perform security checks on score data
   */
  private async performSecurityChecks(scoreData: ScoreInput): Promise<void> {
    // Check for suspicious score patterns
    if (scoreData.score > 100000) {
      console.warn('High score submission detected:', {
        playerName: scoreData.playerName,
        score: scoreData.score,
        timestamp: new Date().toISOString(),
      });
    }

    // Check game time vs score ratio for plausibility
    const expectedMinTime = scoreData.gameMetrics.totalFood * 0.3; // 0.3s per food minimum
    if (scoreData.gameMetrics.gameTimeSeconds < expectedMinTime) {
      throw new SecurityError('Game completed too quickly - suspicious timing detected');
    }

    // Check score vs game metrics consistency
    const maxPossibleScore = scoreData.gameMetrics.totalFood * 100; // Generous upper bound
    if (scoreData.score > maxPossibleScore) {
      throw new SecurityError('Score exceeds maximum possible based on game metrics');
    }

    // Check for impossible combo statistics
    if (scoreData.gameMetrics.longestCombo > scoreData.gameMetrics.totalFood) {
      throw new SecurityError('Longest combo cannot exceed total food consumed');
    }

    // Check for impossible efficiency
    if (scoreData.comboStats.comboEfficiency > 100) {
      throw new SecurityError('Combo efficiency cannot exceed 100%');
    }

    // Check for negative values in critical fields (additional layer beyond schema validation)
    const criticalFields = [
      scoreData.score,
      scoreData.gameMetrics.totalFood,
      scoreData.gameMetrics.gameTimeSeconds,
      scoreData.comboStats.basePoints,
    ];

    if (criticalFields.some(field => field < 0)) {
      throw new SecurityError('Critical game metrics cannot be negative');
    }
  }

  /**
   * Simple rate limiting implementation (consider Redis for production)
   */
  static async isRateLimited(clientId: string): Promise<boolean> {
    try {
      const key = `score_submission_${clientId}`;
      const now = Date.now();
      const windowMs = 60000; // 1 minute window
      const maxSubmissions = 5; // Max 5 submissions per minute

      // Initialize cache if needed
      if (!global.rateLimitCache) {
        global.rateLimitCache = {};
      }

      // Clean up old entries periodically
      const cache = global.rateLimitCache;
      const cutoff = now - windowMs;
      
      for (const cacheKey in cache) {
        if (cache[cacheKey] < cutoff) {
          delete cache[cacheKey];
        }
      }

      // Count submissions in current window
      const submissions = Object.keys(cache)
        .filter(cacheKey => cacheKey.startsWith(key))
        .filter(cacheKey => cache[cacheKey] > cutoff);

      if (submissions.length >= maxSubmissions) {
        return true;
      }

      // Record this submission
      const submissionKey = `${key}_${now}`;
      cache[submissionKey] = now;

      return false;
    } catch (error) {
      // If rate limiting fails, err on the side of caution but don't block
      console.error('Rate limiting error:', error);
      return false;
    }
  }

  /**
   * Get database statistics for monitoring
   */
  async getDatabaseStats(): Promise<{
    totalScores: number;
    uniquePlayers: number;
    highestScore: number;
    averageScore: number;
  }> {
    try {
      await connectToDatabase();

      const [
        totalScores,
        uniquePlayersResult,
        highestScoreResult,
        averageScoreResult,
      ] = await Promise.all([
        Score.countDocuments({}).exec(),
        Score.distinct('playerName').exec(),
        Score.findOne({}).sort({ score: -1 }).lean().exec(),
        Score.aggregate([
          { $group: { _id: null, avgScore: { $avg: '$score' } } }
        ]).exec(),
      ]);

      return {
        totalScores,
        uniquePlayers: uniquePlayersResult.length,
        highestScore: highestScoreResult?.score || 0,
        averageScore: Math.round(averageScoreResult[0]?.avgScore || 0),
      };
    } catch (error) {
      console.error('Database error in getDatabaseStats:', error);
      throw new DatabaseError('Failed to retrieve database statistics', error as Error);
    }
  }
}