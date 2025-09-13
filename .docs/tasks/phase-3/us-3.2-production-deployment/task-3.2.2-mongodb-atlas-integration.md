# Task: MongoDB Atlas Integration

## Task Header
- **ID**: 3.2.2
- **Title**: MongoDB Atlas Integration
- **Story ID**: US-3.2
- **Type**: database
- **Priority**: critical
- **Effort Estimate**: 4-6 hours
- **Complexity**: moderate

## Task Content
### Objective
Set up MongoDB Atlas cluster for production database and integrate with Vercel deployment for score persistence in production environment.

### Description
Create MongoDB Atlas cluster, configure security settings, set up database connection strings, and integrate with Vercel environment variables for production score persistence.

### Acceptance Criteria Covered
- GIVEN production environment WHEN users play THEN scores save to MongoDB Atlas successfully
- GIVEN environment variables WHEN configured THEN production database connectivity works
- GIVEN production database WHEN accessed THEN responds within 2 seconds for score operations

### Implementation Notes
- Create MongoDB Atlas cluster with appropriate tier
- Configure database access security and IP whitelisting
- Set up production database connection string
- Test database connectivity and performance

## Technical Specifications
### File Targets
#### New Files
- `scripts/setup-atlas.js` - Atlas cluster setup script
- `scripts/test-connection.js` - Database connection testing

#### Modified Files
- `.env.production` - Production environment variables (example only)
- `src/lib/mongodb.ts` - Update connection logic for production
- `src/pages/api/scores.ts` - Verify production database connection

#### Test Files
- `src/__tests__/database/atlas-connection.test.ts` - Connection testing

### MongoDB Atlas Configuration
```javascript
// Atlas Cluster Configuration
const clusterConfig = {
  name: 'snake-game-prod',
  tier: 'M0', // Free tier for MVP
  region: 'us-east-1', // Closest to Vercel deployment
  version: '6.0',
  backup: {
    enabled: true,
    frequency: 'daily'
  }
};

// Database Schema
const databases = {
  'snake-game': {
    collections: {
      'scores': {
        indexes: [
          { score: -1 }, // Descending score for high score queries
          { timestamp: -1 }, // Recent scores
          { playerName: 1, score: -1 } // Player-specific queries
        ]
      }
    }
  }
};
```

### Environment Variables
```bash
# Production Environment Variables (Vercel)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snake-game?retryWrites=true&w=majority
MONGODB_DB=snake-game
NODE_ENV=production

# Development fallback
MONGODB_URI_DEV=mongodb://localhost:27017/snake-game-dev
```

### Connection Configuration
```typescript
// src/lib/mongodb.ts updates
interface MongoConfig {
  uri: string;
  options: {
    maxPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    family: number;
  };
}

const getMongoConfig = (): MongoConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    uri: isProduction 
      ? process.env.MONGODB_URI!
      : process.env.MONGODB_URI_DEV!,
    options: {
      maxPoolSize: isProduction ? 10 : 5,
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 2000,
      family: 4, // IPv4
    }
  };
};
```

### Security Configuration
- **Network Access**: Configure IP whitelist to allow Vercel deployment IPs
- **Database Access**: Create dedicated user with minimal required permissions
- **Connection Security**: Enable TLS/SSL for all connections
- **Authentication**: Use MongoDB's built-in authentication

## Testing Requirements
### Unit Tests
- Database connection configuration is valid
- Connection timeout settings work correctly
- Error handling for connection failures

### Integration Tests
- Vercel can connect to MongoDB Atlas successfully
- Score operations (read/write) work in production
- Performance meets 2-second response requirement

### E2E Scenarios
- Production game saves scores to Atlas correctly
- High score page retrieves data from Atlas
- Error scenarios handle database unavailability gracefully

## Dependencies
### Prerequisite Tasks
- 3.2.1 (Vercel Deployment Configuration)
- Score persistence functionality (from Phase 2)

### Blocking Tasks
- None within this story

### External Dependencies
- MongoDB Atlas account and permissions
- Vercel environment variable access
- Network connectivity between Vercel and Atlas

## Risks and Considerations
### Technical Risks
- Connection timeout issues
- IP whitelisting configuration problems
- Performance degradation with Atlas free tier

### Implementation Challenges
- Environment variable management between dev/prod
- Connection pooling optimization
- Error handling for network issues

### Mitigation Strategies
- Use connection pooling to optimize performance
- Implement retry logic for transient failures
- Monitor connection performance and error rates
- Set up appropriate timeout configurations
- Consider Atlas performance monitoring tools
- Plan for potential upgrade from free tier if needed