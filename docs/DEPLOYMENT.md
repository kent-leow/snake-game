# Deployment Guide - Score API

## Overview

This guide covers the deployment of the Score API endpoints implemented in Task T-2.4.2. The API is built with Next.js 13+ App Router and requires MongoDB for data persistence.

## Prerequisites

### System Requirements
- Node.js 18+ 
- MongoDB 5.0+
- Docker & Docker Compose (for local development)
- npm or yarn package manager

### Environment Variables

Create `.env.local` file in project root:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://snake_user:snake_password@localhost:27017/snake_game?authSource=admin
MONGODB_DB_NAME=snake_game

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Rate Limiting (Redis in production)
REDIS_URL=redis://localhost:6379

# Optional: Monitoring
NODE_ENV=production
```

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start MongoDB

Using Docker Compose:
```bash
npm run db:up
```

Or manually with Docker:
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -e MONGO_INITDB_DATABASE=snake_game \
  mongo:5.0
```

### 3. Validate Database Setup

```bash
npm run db:validate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at:
- http://localhost:3000/api/scores
- http://localhost:3000/api/scores/player/[name]
- http://localhost:3000/api/scores/leaderboard

## Production Deployment

### 1. Build Application

```bash
npm run build
```

### 2. Production Database Setup

#### MongoDB Atlas (Recommended)

1. Create MongoDB Atlas cluster
2. Configure network access and authentication
3. Get connection string
4. Update `MONGODB_URI` in environment variables

#### Self-hosted MongoDB

```bash
# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh --eval "
use snake_game;
db.createUser({
  user: 'snake_user',
  pwd: 'secure_password',
  roles: [{ role: 'readWrite', db: 'snake_game' }]
});
"
```

### 3. Environment Configuration

Production `.env.local`:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snake_game
MONGODB_DB_NAME=snake_game
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production-secret-key
```

### 4. Deployment Options

#### Option A: Vercel (Recommended for Next.js)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard

#### Option B: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t snake-game-api .
docker run -p 3000:3000 --env-file .env.local snake-game-api
```

#### Option C: PM2 (Node.js Process Manager)

1. Install PM2:
```bash
npm install -g pm2
```

2. Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'snake-game-api',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

3. Deploy:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Database Migration & Indexing

### Create Required Indexes

Run this script after deployment:

```javascript
// MongoDB index creation script
db.scores.createIndex({ score: -1 });
db.scores.createIndex({ timestamp: -1 });
db.scores.createIndex({ playerName: 1, score: -1 });
db.scores.createIndex({ "gameMetrics.totalCombos": -1 });
db.scores.createIndex({ "gameMetrics.gameTimeSeconds": -1 });
db.scores.createIndex({ createdAt: -1 });

// Compound indexes for performance
db.scores.createIndex({
  score: -1,
  "gameMetrics.totalCombos": -1,
  timestamp: -1
});

db.scores.createIndex({
  playerName: 1,
  score: -1,
  timestamp: -1
});
```

### Data Validation Schema

Ensure MongoDB schema validation:

```javascript
db.runCommand({
  collMod: "scores",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["playerName", "score", "gameMetrics", "comboStats"],
      properties: {
        playerName: {
          bsonType: "string",
          minLength: 1,
          maxLength: 20
        },
        score: {
          bsonType: "int",
          minimum: 0,
          maximum: 1000000
        },
        gameMetrics: {
          bsonType: "object",
          required: ["totalFood", "totalCombos", "longestCombo", "maxSpeedLevel", "gameTimeSeconds", "finalSnakeLength"]
        }
      }
    }
  }
});
```

## Performance Optimization

### 1. Database Optimization

- Enable MongoDB connection pooling
- Configure appropriate indexes
- Use lean queries where possible
- Implement query result caching

### 2. API Performance

- Enable gzip compression
- Implement response caching
- Use CDN for static assets
- Monitor query performance

### 3. Rate Limiting (Production)

For production, replace in-memory rate limiting with Redis:

```javascript
// lib/redis.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(clientId, maxRequests = 5, windowMs = 60000) {
  const key = `rate_limit:${clientId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }
  
  return current > maxRequests;
}
```

## Monitoring & Logging

### 1. Health Check Endpoint

Add to `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connection';

export async function GET() {
  try {
    await connectToDatabase();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    }, { status: 503 });
  }
}
```

### 2. Logging Configuration

Use structured logging in production:

```javascript
// lib/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;
```

### 3. Metrics Collection

Implement basic metrics:

```typescript
// lib/metrics.js
export class ApiMetrics {
  private static requests: Map<string, number> = new Map();
  private static errors: Map<string, number> = new Map();
  
  static recordRequest(endpoint: string) {
    const current = this.requests.get(endpoint) || 0;
    this.requests.set(endpoint, current + 1);
  }
  
  static recordError(endpoint: string) {
    const current = this.errors.get(endpoint) || 0;
    this.errors.set(endpoint, current + 1);
  }
  
  static getStats() {
    return {
      requests: Object.fromEntries(this.requests),
      errors: Object.fromEntries(this.errors)
    };
  }
}
```

## Security Considerations

### 1. Production Security Headers

Add to `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  }
};
```

### 2. CORS Configuration

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

export const config = {
  matcher: '/api/:path*'
};
```

## Backup & Recovery

### 1. Database Backup

```bash
# MongoDB backup script
#!/bin/bash
BACKUP_NAME="snake_game_backup_$(date +%Y%m%d_%H%M%S)"
mongodump --uri="$MONGODB_URI" --out="/backups/$BACKUP_NAME"
tar -czf "/backups/$BACKUP_NAME.tar.gz" "/backups/$BACKUP_NAME"
rm -rf "/backups/$BACKUP_NAME"
```

### 2. Automated Backup (Cron)

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

## Testing in Production

### 1. Smoke Tests

Create basic API tests:

```bash
#!/bin/bash
API_BASE="https://yourdomain.com/api"

# Test health endpoint
curl -f "$API_BASE/health" || exit 1

# Test scores endpoint
curl -f "$API_BASE/scores?limit=1" || exit 1

# Test leaderboard
curl -f "$API_BASE/scores/leaderboard?limit=1" || exit 1

echo "All smoke tests passed!"
```

### 2. Load Testing

Use Artillery.js or similar:

```yaml
# artillery-config.yml
config:
  target: 'https://yourdomain.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/scores"
      - get:
          url: "/api/scores/leaderboard"
```

Run: `artillery run artillery-config.yml`

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI format
   - Verify network connectivity
   - Check authentication credentials

2. **Rate Limiting Too Aggressive**
   - Adjust rate limiting parameters
   - Implement user-specific limits
   - Consider Redis for better tracking

3. **High Memory Usage**
   - Enable MongoDB query result limiting
   - Implement proper pagination
   - Monitor heap usage

4. **Slow Query Performance**
   - Check database indexes
   - Analyze query execution plans
   - Consider query optimization

### Logs to Monitor

- API request/response times
- Database query performance
- Rate limiting triggers
- Validation failures
- Security check failures

### Performance Metrics

- Request latency (p50, p95, p99)
- Throughput (requests/second)
- Error rate
- Database connection pool usage
- Memory and CPU usage

## Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Review error logs
   - Check performance metrics
   - Validate backup integrity

2. **Monthly**
   - Update dependencies
   - Review security headers
   - Analyze usage patterns

3. **Quarterly**
   - Security audit
   - Performance optimization review
   - Database maintenance

### Emergency Procedures

1. **API Down**
   - Check service health endpoint
   - Verify database connectivity
   - Review recent deployments
   - Check resource usage

2. **Database Issues**
   - Switch to read-only mode if possible
   - Restore from latest backup
   - Contact database administrator

3. **Performance Degradation**
   - Enable query logging
   - Check for unusual traffic patterns
   - Scale resources if needed
   - Implement temporary rate limiting

## Rollback Procedures

### Quick Rollback (Vercel)

```bash
vercel rollback [deployment-url]
```

### Docker Rollback

```bash
docker stop snake-game-api
docker run -p 3000:3000 --env-file .env.local snake-game-api:previous-tag
```

### Database Schema Rollback

Keep migration scripts for schema changes and have rollback procedures documented.