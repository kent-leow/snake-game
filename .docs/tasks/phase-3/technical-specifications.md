# Technical Specifications - Phase 3

## API Endpoints

### Existing Endpoints (from Phase 2)
```typescript
// Score Management
GET    /api/scores              // Retrieve all scores
GET    /api/scores?limit=10     // Retrieve top 10 scores
POST   /api/scores              // Create new score
PUT    /api/scores/:id          // Update existing score
```

### New Endpoints (Phase 3)
```typescript
// Health Check
GET    /api/health              // System health status

// Health Check Response
interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: 'ok' | 'error';
    api: 'ok' | 'error';
  };
  performance: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
  };
}
```

## Database Schema

### MongoDB Atlas Configuration
```javascript
// Production Cluster
cluster: {
  name: 'snake-game-prod',
  tier: 'M0',  // Free tier
  region: 'us-east-1',
  version: '6.0'
}

// Indexes
db.scores.createIndex({ score: -1 });        // High score queries
db.scores.createIndex({ timestamp: -1 });    // Recent scores
db.scores.createIndex({ 
  playerName: 1, 
  score: -1 
});  // Player-specific queries
```

### Data Models (Existing from Phase 2)
```typescript
interface Score {
  id: string;
  playerName: string;
  score: number;
  timestamp: Date;
  comboCount: number;
}
```

## Component Architecture

### New Components

#### High Score Page Components
```typescript
// Main Page Component
interface HighScorePageProps {
  initialScores?: Score[];
}

// High Score Table Component  
interface HighScoreTableProps {
  scores: Score[];
  loading: boolean;
  error?: string;
  currentPlayerId?: string;
}

// Individual Score Entry Component
interface ScoreEntryProps {
  score: Score;
  rank: number;
  isCurrentPlayer?: boolean;
  viewMode: 'mobile' | 'tablet' | 'desktop';
}
```

#### Responsive Hook
```typescript
interface UseResponsiveReturn {
  viewMode: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}
```

## File Structure

### New Files
```
src/
├── pages/
│   ├── high-scores.tsx              # High score page
│   └── api/
│       └── health.ts                # Health check endpoint
├── components/
│   ├── HighScoreTable.tsx           # Score table component
│   └── ScoreEntry.tsx               # Individual score entry
├── hooks/
│   ├── useHighScores.ts             # Score data management
│   └── useResponsive.ts             # Responsive detection
├── utils/
│   └── scoreFormatter.ts            # Score formatting utilities
├── lib/
│   └── performance.ts               # Performance monitoring
├── styles/
│   ├── HighScores.module.css        # High score styling
│   └── responsive.module.css        # Responsive utilities
└── __tests__/
    ├── pages/
    │   └── high-scores.test.tsx
    ├── components/
    │   ├── HighScoreTable.test.tsx
    │   └── ScoreEntry.test.tsx
    ├── hooks/
    │   ├── useHighScores.test.tsx
    │   └── useResponsive.test.tsx
    ├── utils/
    │   └── scoreFormatter.test.ts
    ├── performance/
    │   ├── load-time.test.ts
    │   └── api-response.test.ts
    └── database/
        └── atlas-connection.test.ts

# Root level
vercel.json                          # Vercel configuration
.vercelignore                        # Deployment exclusions

# Scripts
scripts/
├── setup-atlas.js                  # Atlas setup
├── test-connection.js               # DB connection test
├── verify-deployment.js             # Deployment verification
└── performance-test.js              # Performance testing
```

### Modified Files
```
src/
├── components/
│   └── Navigation.tsx               # Add high scores link
├── types/
│   └── index.ts                     # Add new types
├── lib/
│   └── mongodb.ts                   # Production config
└── pages/
    ├── _app.tsx                     # Performance monitoring
    └── api/
        └── scores.ts                # Verify production compatibility

# Root level
next.config.js                       # Production optimizations
package.json                         # Verify dependencies
README.md                           # Deployment instructions
```

## Configuration Changes

### Environment Variables
```bash
# Production (Vercel)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/snake-game
MONGODB_DB=snake-game
NODE_ENV=production
VERCEL_URL=snake-game.vercel.app

# Development
MONGODB_URI_DEV=mongodb://localhost:27017/snake-game-dev
```

### Next.js Configuration
```javascript
// next.config.js additions
module.exports = {
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image optimization
  images: {
    domains: ['vercel.app'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Compression and optimization
  compress: true,
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  }
};
```

### Vercel Configuration
```json
{
  "version": 2,
  "name": "snake-game",
  "builds": [
    {
      "src": "package.json", 
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

## Performance Requirements

### Target Metrics
- **Initial Load Time**: < 5 seconds
- **API Response Time**: < 2 seconds  
- **Uptime**: 99%
- **Concurrent Users**: Effective handling

### Optimization Strategies
- Next.js static optimization
- Image optimization and compression
- API response caching
- MongoDB connection pooling
- Asset compression and minification

## Testing Strategy

### Unit Tests
- Component rendering and props
- Hook functionality
- Utility function accuracy
- API endpoint responses

### Integration Tests  
- Page data fetching
- Component integration
- Database connectivity
- Error handling

### E2E Tests
- Full page functionality
- Cross-browser compatibility
- Mobile responsiveness
- Performance validation

## Security Considerations

### MongoDB Atlas
- IP whitelisting for Vercel
- Database user with minimal permissions
- TLS/SSL encrypted connections
- Connection string security

### Vercel Deployment
- Environment variable security
- Asset optimization
- HTTPS enforcement
- Same-origin policy compliance