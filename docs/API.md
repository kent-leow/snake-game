# Score API Documentation

## Overview

The Score API provides RESTful endpoints for managing game scores, including score creation, retrieval, and leaderboard functionality. The API is built with Next.js 13+ App Router and includes comprehensive validation, security measures, and error handling.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required for the Score API endpoints. Rate limiting is implemented to prevent abuse.

## Rate Limiting

- **Score Submission**: Maximum 5 submissions per minute per client IP
- **Other Endpoints**: No rate limiting currently applied

## Endpoints

### 1. Scores Collection

#### GET /api/scores

Retrieve scores with pagination and sorting options.

**Parameters:**
- `limit` (optional): Number of scores to return (1-100, default: 50)
- `offset` (optional): Number of scores to skip (default: 0)  
- `sortBy` (optional): Field to sort by (default: 'score')
  - Valid values: 'score', 'timestamp', 'createdAt', 'playerName', 'gameMetrics.totalFood', 'gameMetrics.totalCombos', 'gameMetrics.gameTimeSeconds'
- `order` (optional): Sort order (default: 'desc')
  - Valid values: 'asc', 'desc'

**Example Request:**
```http
GET /api/scores?limit=10&offset=0&sortBy=score&order=desc
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "playerName": "ProGamer",
      "score": 15000,
      "timestamp": "2023-12-01T12:00:00.000Z",
      "gameMetrics": {
        "totalFood": 150,
        "totalCombos": 45,
        "longestCombo": 12,
        "maxSpeedLevel": 8,
        "gameTimeSeconds": 420,
        "finalSnakeLength": 75
      },
      "comboStats": {
        "totalComboPoints": 7500,
        "basePoints": 7500,
        "comboEfficiency": 30.0,
        "averageComboLength": 3.3
      },
      "createdAt": "2023-12-01T12:00:00.000Z",
      "updatedAt": "2023-12-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1000,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST /api/scores

Create a new score record.

**Request Body:**
```json
{
  "playerName": "ProGamer",
  "score": 15000,
  "gameMetrics": {
    "totalFood": 150,
    "totalCombos": 45,
    "longestCombo": 12,
    "maxSpeedLevel": 8,
    "gameTimeSeconds": 420,
    "finalSnakeLength": 75
  },
  "comboStats": {
    "totalComboPoints": 7500,
    "basePoints": 7500,
    "comboEfficiency": 30.0,
    "averageComboLength": 3.3
  },
  "metadata": {
    "browserInfo": "Chrome/119.0.0.0",
    "screenResolution": "1920x1080",
    "gameVersion": "1.0.0",
    "difficulty": "normal"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "playerName": "ProGamer",
    "score": 15000,
    "timestamp": "2023-12-01T12:00:00.000Z",
    "gameMetrics": { ... },
    "comboStats": { ... },
    "metadata": { ... },
    "createdAt": "2023-12-01T12:00:00.000Z",
    "updatedAt": "2023-12-01T12:00:00.000Z"
  },
  "message": "Score saved successfully"
}
```

### 2. Player Scores

#### GET /api/scores/player/[name]

Retrieve scores for a specific player.

**Parameters:**
- `name` (required): Player name (URL encoded)
- `limit` (optional): Number of scores to return (1-50, default: 10)

**Example Request:**
```http
GET /api/scores/player/ProGamer?limit=5
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "playerName": "ProGamer",
    "scores": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "playerName": "ProGamer",
        "score": 15000,
        "timestamp": "2023-12-01T12:00:00.000Z"
      }
    ],
    "bestScore": 15000,
    "totalGames": 25,
    "averageScore": 8500
  }
}
```

### 3. Leaderboard

#### GET /api/scores/leaderboard

Retrieve top scores leaderboard for different time periods.

**Parameters:**
- `period` (optional): Time period for leaderboard (default: 'all')
  - Valid values: 'daily', 'weekly', 'monthly', 'all'
- `limit` (optional): Number of scores to return (1-100, default: 10)

**Example Request:**
```http
GET /api/scores/leaderboard?period=weekly&limit=10
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "period": "weekly",
    "leaderboard": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "playerName": "ProGamer",
        "score": 15000,
        "timestamp": "2023-12-01T12:00:00.000Z"
      }
    ],
    "lastUpdated": "2023-12-01T12:30:00.000Z"
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": ["Additional error details"] // Optional
}
```

### Common HTTP Status Codes

- `200 OK`: Successful GET request
- `201 Created`: Successful POST request
- `400 Bad Request`: Invalid request data or parameters
- `403 Forbidden`: Security check failed
- `405 Method Not Allowed`: HTTP method not supported
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: Database temporarily unavailable

### Error Types

#### Validation Errors (400)
```json
{
  "error": "Validation failed",
  "message": "Invalid score data",
  "details": [
    "Player name is required",
    "Score must be a positive integer"
  ]
}
```

#### Security Errors (403)
```json
{
  "error": "Security check failed",
  "message": "Game completed too quickly - suspicious timing detected"
}
```

#### Rate Limit Errors (429)
```json
{
  "error": "Rate limit exceeded",
  "message": "Please wait before submitting another score"
}
```

#### Database Errors (503)
```json
{
  "error": "Database temporarily unavailable",
  "message": "Please try again later"
}
```

## Data Models

### Score Object

```typescript
interface Score {
  _id: string;
  playerName: string;
  score: number;
  timestamp: Date;
  gameMetrics: GameMetrics;
  comboStats: ComboStats;
  metadata?: GameMetadata;
  createdAt: Date;
  updatedAt: Date;
}
```

### Game Metrics

```typescript
interface GameMetrics {
  totalFood: number;         // Total food items consumed
  totalCombos: number;       // Number of combo sequences
  longestCombo: number;      // Longest combo in the game
  maxSpeedLevel: number;     // Highest speed level reached
  gameTimeSeconds: number;   // Total game duration
  finalSnakeLength: number;  // Snake length at game end
}
```

### Combo Stats

```typescript
interface ComboStats {
  totalComboPoints: number;   // Points earned from combos
  basePoints: number;         // Base points from food
  comboEfficiency: number;    // Percentage of food eaten in combos
  averageComboLength: number; // Average length of combos
}
```

### Game Metadata (Optional)

```typescript
interface GameMetadata {
  browserInfo?: string;       // Browser user agent
  screenResolution?: string;  // Screen resolution (e.g., "1920x1080")
  gameVersion?: string;       // Game version
  difficulty?: 'easy' | 'normal' | 'hard'; // Difficulty level
}
```

## Validation Rules

### Player Name
- Required
- 1-20 characters
- Letters, numbers, spaces, hyphens, and underscores only

### Score
- Required
- Non-negative integer
- Maximum: 1,000,000

### Game Metrics
- All fields required
- All numeric values must be non-negative integers
- Game time: 1-7200 seconds (2 hours max)
- Longest combo cannot exceed total food
- Total combos cannot exceed total food

### Security Checks
- Game time vs. score ratio validation
- Score vs. game metrics consistency check
- Combo statistics validation
- Suspicious pattern detection

## Usage Examples

### JavaScript/TypeScript Client

```typescript
// Submit a score
const submitScore = async (scoreData) => {
  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scoreData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};

// Get player scores
const getPlayerScores = async (playerName, limit = 10) => {
  const response = await fetch(
    `/api/scores/player/${encodeURIComponent(playerName)}?limit=${limit}`
  );
  return response.json();
};

// Get leaderboard
const getLeaderboard = async (period = 'all', limit = 10) => {
  const response = await fetch(
    `/api/scores/leaderboard?period=${period}&limit=${limit}`
  );
  return response.json();
};
```

### cURL Examples

```bash
# Submit a score
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "TestPlayer",
    "score": 1000,
    "gameMetrics": {
      "totalFood": 50,
      "totalCombos": 10,
      "longestCombo": 5,
      "maxSpeedLevel": 3,
      "gameTimeSeconds": 120,
      "finalSnakeLength": 25
    },
    "comboStats": {
      "totalComboPoints": 500,
      "basePoints": 500,
      "comboEfficiency": 20,
      "averageComboLength": 2.5
    }
  }'

# Get scores
curl "http://localhost:3000/api/scores?limit=5&sortBy=score&order=desc"

# Get player scores
curl "http://localhost:3000/api/scores/player/TestPlayer?limit=5"

# Get leaderboard
curl "http://localhost:3000/api/scores/leaderboard?period=weekly&limit=10"
```

## Performance Considerations

- Database queries are optimized with proper indexing
- Pagination is recommended for large datasets
- Rate limiting prevents API abuse
- Efficient sorting using MongoDB indexes
- Lean queries for better performance

## Security Features

- Input validation and sanitization
- Rate limiting per client IP
- Security checks for suspicious game patterns
- Protection against score manipulation
- Error handling without information leakage

## Testing

The API includes comprehensive test coverage:
- Unit tests for service layer
- Integration tests for API endpoints
- Error handling tests
- Rate limiting tests
- Security validation tests

Run tests with:
```bash
npm test src/lib/api/__tests__/
npm test src/app/api/__tests__/
```