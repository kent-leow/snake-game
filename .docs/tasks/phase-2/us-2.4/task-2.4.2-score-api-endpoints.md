# Task: Implement Score API Endpoints

## Task Header
- **ID**: T-2.4.2
- **Title**: Implement Score API Endpoints
- **Story ID**: US-2.4
- **Type**: backend
- **Priority**: high
- **Effort Estimate**: 4-6 hours
- **Complexity**: moderate

## Objective
Create robust Next.js API routes for score management, including saving new scores, retrieving high scores, and handling error scenarios with proper validation and security measures.

## Description
Implement RESTful API endpoints that handle score persistence, retrieval, and validation while providing proper error handling, security measures, and performance optimization.

## Acceptance Criteria Covered
- GIVEN game over WHEN score achieved THEN score is automatically saved to database
- GIVEN high scores WHEN viewing THEN personal best scores display in descending order
- GIVEN database unavailable WHEN saving THEN graceful fallback occurs

## Implementation Notes
- Follow RESTful conventions for API design
- Implement proper error handling and validation
- Add security measures to prevent score manipulation
- Ensure API performance for high-traffic scenarios

## Technical Specifications

### File Targets
#### New Files
- `pages/api/scores/index.ts` - Main scores endpoint (GET, POST)
- `pages/api/scores/player/[name].ts` - Player-specific scores
- `pages/api/scores/leaderboard.ts` - Top scores leaderboard
- `src/lib/api/scoreService.ts` - Score business logic
- `src/lib/api/errorHandler.ts` - Centralized error handling

#### Modified Files
- `src/lib/mongodb.ts` - Ensure proper connection handling

### API Endpoint Specifications

#### Main Scores Endpoint
```typescript
// pages/api/scores/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { ScoreService } from '@/lib/api/scoreService';
import { handleApiError } from '@/lib/api/errorHandler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getScores(req, res);
      case 'POST':
        return await createScore(req, res);
      default:
        return res.status(405).json({ 
          error: 'Method not allowed',
          allowedMethods: ['GET', 'POST']
        });
    }
  } catch (error) {
    return handleApiError(error, res);
  }
}

async function getScores(req: NextApiRequest, res: NextApiResponse) {
  const { 
    limit = 50, 
    offset = 0, 
    sortBy = 'score',
    order = 'desc' 
  } = req.query;

  const scoreService = new ScoreService();
  const result = await scoreService.getScores({
    limit: Number(limit),
    offset: Number(offset),
    sortBy: sortBy as string,
    order: order as 'asc' | 'desc'
  });

  res.status(200).json({
    success: true,
    data: result.scores,
    pagination: {
      total: result.total,
      limit: Number(limit),
      offset: Number(offset),
      hasMore: result.total > Number(offset) + Number(limit)
    }
  });
}

async function createScore(req: NextApiRequest, res: NextApiResponse) {
  const scoreData = req.body;
  
  // Rate limiting check
  const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (await ScoreService.isRateLimited(clientId as string)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Please wait before submitting another score'
    });
  }

  const scoreService = new ScoreService();
  const result = await scoreService.createScore(scoreData);

  res.status(201).json({
    success: true,
    data: result,
    message: 'Score saved successfully'
  });
}
```

#### Player Scores Endpoint
```typescript
// pages/api/scores/player/[name].ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name } = req.query;
  const { limit = 10 } = req.query;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    const scoreService = new ScoreService();
    const scores = await scoreService.getPlayerScores(name, Number(limit));

    res.status(200).json({
      success: true,
      data: {
        playerName: name,
        scores,
        bestScore: scores[0]?.score || 0,
        totalGames: scores.length
      }
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
```

#### Leaderboard Endpoint
```typescript
// pages/api/scores/leaderboard.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { period = 'all', limit = 10 } = req.query;

  try {
    const scoreService = new ScoreService();
    const leaderboard = await scoreService.getLeaderboard({
      period: period as 'daily' | 'weekly' | 'monthly' | 'all',
      limit: Number(limit)
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        leaderboard,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleApiError(error, res);
  }
}
```

### Service Layer Implementation
```typescript
// src/lib/api/scoreService.ts
import { Score } from '@/models/Score';
import { validateScoreData } from '@/utils/scoreValidation';

interface GetScoresOptions {
  limit: number;
  offset: number;
  sortBy: string;
  order: 'asc' | 'desc';
}

interface LeaderboardOptions {
  period: 'daily' | 'weekly' | 'monthly' | 'all';
  limit: number;
}

export class ScoreService {
  async createScore(scoreData: any) {
    // Validate input data
    const validation = validateScoreData(scoreData);
    if (!validation.isValid) {
      throw new ValidationError('Invalid score data', validation.errors);
    }

    // Additional security checks
    await this.performSecurityChecks(scoreData);

    // Save to database
    const score = new Score(scoreData);
    await score.save();

    return score;
  }

  async getScores(options: GetScoresOptions) {
    const { limit, offset, sortBy, order } = options;
    
    const sortObj: any = {};
    sortObj[sortBy] = order === 'desc' ? -1 : 1;

    const [scores, total] = await Promise.all([
      Score.find({})
        .sort(sortObj)
        .limit(limit)
        .skip(offset)
        .lean(),
      Score.countDocuments({})
    ]);

    return { scores, total };
  }

  async getPlayerScores(playerName: string, limit: number) {
    return Score.find({ playerName })
      .sort({ score: -1 })
      .limit(limit)
      .lean();
  }

  async getLeaderboard(options: LeaderboardOptions) {
    const { period, limit } = options;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'daily':
        dateFilter = { timestamp: { $gte: new Date(now.setHours(0, 0, 0, 0)) } };
        break;
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
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

    return Score.find(dateFilter)
      .sort({ score: -1, timestamp: 1 })
      .limit(limit)
      .lean();
  }

  private async performSecurityChecks(scoreData: any) {
    // Check for suspicious score patterns
    if (scoreData.score > 100000) {
      // Log for review
      console.warn('High score submission:', scoreData);
    }

    // Check game time vs score ratio
    const expectedMinTime = scoreData.gameMetrics.totalFood * 0.5; // 0.5s per food minimum
    if (scoreData.gameMetrics.gameTimeSeconds < expectedMinTime) {
      throw new SecurityError('Game completed too quickly');
    }
  }

  static async isRateLimited(clientId: string): Promise<boolean> {
    // Simple in-memory rate limiting (consider Redis for production)
    const key = `score_submission_${clientId}`;
    const lastSubmission = global.rateLimitCache?.[key];
    
    if (lastSubmission && Date.now() - lastSubmission < 60000) { // 1 minute
      return true;
    }
    
    if (!global.rateLimitCache) {
      global.rateLimitCache = {};
    }
    global.rateLimitCache[key] = Date.now();
    
    return false;
  }
}
```

### Error Handling
```typescript
// src/lib/api/errorHandler.ts
import { NextApiResponse } from 'next';

export class ValidationError extends Error {
  constructor(message: string, public details: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export function handleApiError(error: Error, res: NextApiResponse) {
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      message: error.message,
      details: error.details
    });
  }

  if (error instanceof SecurityError) {
    return res.status(403).json({
      error: 'Security check failed',
      message: error.message
    });
  }

  // Database connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    return res.status(503).json({
      error: 'Database temporarily unavailable',
      message: 'Please try again later'
    });
  }

  // Generic server error
  return res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
}
```

## Testing Requirements

### Unit Tests
- Test all API endpoints with valid data
- Test validation and error handling
- Test rate limiting functionality
- Test security checks

### Integration Tests
- Test database integration with real MongoDB
- Test API performance under load
- Test error scenarios (network issues, etc.)

### E2E Scenarios
- Submit score and verify persistence
- Retrieve leaderboard and verify ordering
- Test rate limiting with rapid submissions

## Dependencies

### Prerequisite Tasks
- T-2.4.1 (MongoDB Score Schema)

### Blocking Tasks
None

### External Dependencies
- Next.js API routes
- MongoDB connection
- Mongoose ODM

## Risks and Considerations

### Technical Risks
- **Score Manipulation**: Users submitting fake scores
- **Database Performance**: Slow queries under high load

### Implementation Challenges
- **Rate Limiting**: Preventing abuse while allowing legitimate play
- **Error Handling**: Graceful degradation when database is unavailable

### Mitigation Strategies
- Implement comprehensive input validation
- Add rate limiting and security checks
- Use database indexes for query optimization
- Implement proper error handling and logging
- Consider adding CAPTCHA for high scores

---

*This task creates a secure, performant API layer for score persistence that handles both normal operation and error scenarios gracefully.*