# Database Setup - Docker MongoDB

This document describes the MongoDB database setup using Docker for local development.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed
- Project dependencies installed (`npm install`)

## Quick Start

1. **Start MongoDB container:**

   ```bash
   npm run db:up
   ```

2. **Verify setup:**

   ```bash
   npm run db:validate
   npm run db:logs
   ```

3. **Test connection in your application:**

   ```typescript
   import { connectToDatabase } from '@/lib/database/connection';

   const connection = await connectToDatabase();
   console.log('Connected to MongoDB:', connection.readyState === 1);
   ```

## Available Scripts

| Script                | Description                                       |
| --------------------- | ------------------------------------------------- |
| `npm run db:up`       | Start MongoDB container in detached mode          |
| `npm run db:down`     | Stop and remove MongoDB container                 |
| `npm run db:logs`     | View MongoDB container logs                       |
| `npm run db:shell`    | Connect to MongoDB shell                          |
| `npm run db:reset`    | Reset database (destroys all data)                |
| `npm run db:validate` | Validate Docker setup without starting containers |

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and adjust values if needed:

```bash
cp .env.example .env.local
```

Default configuration:

- **Database:** `snake_game`
- **Username:** `snake_user`
- **Password:** `snake_password`
- **Port:** `27017`
- **Connection URL:** `mongodb://snake_user:snake_password@localhost:27017/snake_game`

### Docker Compose Files

- **`docker-compose.yml`** - Base configuration for production-like setup
- **`docker-compose.dev.yml`** - Development overrides with local data persistence

## Database Schema

The database uses a comprehensive score tracking schema designed for the Snake game.

### Score Schema

See [Database Score Schema Documentation](./DATABASE_SCORE_SCHEMA.md) for complete details.

**Quick Overview:**
- **Score Model**: Comprehensive game score tracking with validation
- **Game Metrics**: Detailed statistics (food consumed, combos, speed levels)
- **Combo Analytics**: Combo efficiency and performance tracking
- **Metadata**: Optional browser and game version information
- **Validation**: Extensive input validation and sanitization

### Legacy Collections (Migration Pending)

The initialization script (`scripts/init-db.js`) creates legacy collections that will be migrated:

1. **`game_scores`** - Legacy player scores (to be replaced by new Score model)
2. **`game_sessions`** - Game session tracking (future enhancement)

### Performance Indexes

The new Score model includes optimized indexes for:
- High score queries
- Player-specific queries  
- Recent score queries
- Combo-based analytics
- Leaderboard generation

## Connection Utility

### Basic Usage

```typescript
import {
  connectToDatabase,
  disconnectFromDatabase,
  isConnected,
  getConnectionState,
} from '@/lib/database/connection';

// Connect to database
const connection = await connectToDatabase();

// Check connection status
console.log('Connected:', isConnected());
console.log('State:', getConnectionState());

// Disconnect (usually not needed in Next.js)
await disconnectFromDatabase();
```

### With Custom Options

```typescript
const connection = await connectToDatabase({
  bufferCommands: false,
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
});
```

## Troubleshooting

### Port Already in Use

If port 27017 is already in use:

1. Stop existing MongoDB: `sudo systemctl stop mongod`
2. Or change port in `docker-compose.dev.yml`

### Connection Issues

1. **Check container status:**

   ```bash
   docker ps
   ```

2. **View container logs:**

   ```bash
   npm run db:logs
   ```

3. **Test connection manually:**
   ```bash
   npm run db:shell
   ```

### Reset Database

To completely reset the database and start fresh:

```bash
npm run db:reset
```

⚠️ **Warning**: This destroys all data in the database.

## Data Persistence

- **Development**: Data persists in `./data/mongodb` directory
- **Production**: Data persists in Docker volume `mongodb_data`

## Security Notes

- Default credentials are for development only
- Change credentials for production environments
- Environment files (`.env.local`) are excluded from git
- Use secrets management for production deployments

## Testing

Unit tests for database connection are available:

```bash
npm run test src/lib/database
```

Test coverage includes:

- Connection establishment
- Error handling
- Connection state management
- Environment validation
