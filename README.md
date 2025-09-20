# Snake Game

A modern, responsive Snake game built with Next.js, React, and TypeScript. Features include high scores, combo systems, mobile controls, and real-time gameplay.

## Features

- 🎮 Classic Snake gameplay with modern UI
- 📱 Responsive design for desktop and mobile
- 🏆 High score tracking and leaderboards
- ⚡ Combo system for bonus points
- 🎯 Multiple difficulty levels
- 💾 Local storage for game persistence
- 🌐 RESTful API for score management
- 📊 Player statistics and performance tracking

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- MongoDB (for score persistence)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd snake-play
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database** (Optional for basic gameplay)
   ```bash
   # Start MongoDB with Docker
   npm run db:up
   
   # Verify database setup
   npm run db:validate
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run type-check` - Run TypeScript type checking
- `npm run validate` - Run all quality checks

### Database Scripts

- `npm run db:up` - Start MongoDB container
- `npm run db:down` - Stop MongoDB container
- `npm run db:logs` - View MongoDB logs
- `npm run db:shell` - Access MongoDB shell
- `npm run db:reset` - Reset database with fresh data

### Atlas Management Scripts

- `node scripts/setup-atlas.js` - Validate Atlas configuration and setup
- `node scripts/test-connection.js` - Test database connection and performance
- `node scripts/verify-deployment.js` - Verify full deployment functionality

### Performance Testing Scripts

- `node scripts/performance-test.js <url>` - Comprehensive performance testing
- `npm run validate` - Run all quality checks (linting, tests, formatting)

## Database Configuration

### Local Development (MongoDB with Docker)

For local development, the application uses Docker to run MongoDB:

```bash
# Start MongoDB container
npm run db:up

# View database logs
npm run db:logs

# Access MongoDB shell
npm run db:shell

# Stop and reset database
npm run db:reset
```

### Production (MongoDB Atlas)

For production deployment, the application uses MongoDB Atlas:

#### 1. Create MongoDB Atlas Cluster

1. **Sign up for MongoDB Atlas**: Visit [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Create a new cluster**:
   - Choose M0 (free tier) for MVP
   - Select region closest to your deployment (e.g., us-east-1 for Vercel)
   - Name: `snake-game-prod`

#### 2. Configure Database Security

1. **Create Database User**:
   - Username: `snake_app_user` (or your preferred name)
   - Password: Generate a strong password
   - Permissions: `readWrite` on `snake-game` database only

2. **Configure IP Whitelist**:
   - For Vercel: Add `0.0.0.0/0` (allows all IPs)
   - For specific deployments: Add your server IPs

#### 3. Get Connection String

1. Click **Connect** → **Connect your application**
2. Copy the connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/snake-game?retryWrites=true&w=majority
   ```
3. Replace `username`, `password`, and `cluster` with your actual values

#### 4. Test Atlas Connection

Use the provided scripts to validate your Atlas setup:

```bash
# Set up Atlas configuration
MONGODB_URI="your_atlas_connection_string" node scripts/setup-atlas.js

# Test connection and performance
MONGODB_URI="your_atlas_connection_string" node scripts/test-connection.js
```

#### 5. Performance Considerations

- **Connection Pooling**: Automatically configured (10 connections for production)
- **Timeouts**: Optimized for production (5s server selection, 10s socket timeout)
- **Indexing**: Pre-configured indexes for optimal query performance
- **Compression**: Enabled for Atlas connections to reduce bandwidth
- **Response Time**: Target <2 seconds for all score operations

## Deployment

### Vercel Deployment (Recommended)

This application is optimized for deployment on Vercel:

1. **Connect to Vercel**
   - Push your code to GitHub
   - Import the project in Vercel
   - Vercel will automatically detect Next.js and configure build settings

2. **Environment Variables**
   Set the following environment variables in Vercel:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snake-game?retryWrites=true&w=majority
   MONGODB_DB=snake-game
   NODE_ENV=production
   ```

   For MongoDB Atlas setup:
   - Create a MongoDB Atlas cluster (M0 free tier recommended for MVP)
   - Create a database user with readWrite permissions to `snake-game` database
   - Add IP whitelist: `0.0.0.0/0` (for Vercel) or specific IPs
   - Use the connection string format above with your credentials

3. **Automatic Deployment**
   - Pushes to `main` branch trigger automatic deployments
   - Preview deployments are created for pull requests

4. **Verify Deployment**
   ```bash
   # Run the verification script after deployment
   node scripts/verify-deployment.js https://your-app.vercel.app
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Verify deployment**
   ```bash
   node scripts/verify-deployment.js http://localhost:3000
   ```

## Performance Optimization

### Production Performance Features

The application is optimized for production performance with the following features:

#### Load Time Optimization
- **Target**: < 5 seconds initial load time
- **Image Optimization**: WebP and AVIF format support with automatic optimization
- **Code Splitting**: Automatic route-based code splitting
- **Bundle Compression**: Gzip compression enabled
- **Static Asset Caching**: Long-term caching for static resources
- **Tree Shaking**: Unused code elimination

#### API Performance
- **Target**: < 2 seconds API response time
- **Database Connection Pooling**: Optimized for Atlas (10 connections production)
- **Query Optimization**: Pre-configured indexes for fast queries
- **Response Caching**: Strategic caching for health checks and static data
- **Compression**: Database response compression for Atlas connections

#### Monitoring & Health Checks

**Health Check Endpoints:**
- `GET /api/health` - Comprehensive health status with metrics
- `HEAD /api/health` - Lightweight health check for load balancers
- `GET /health.txt` - Simple OK response for basic monitoring
- `GET /healthz` - Kubernetes-style health check alias
- `GET /ping` - Simple ping endpoint

**Performance Monitoring:**
```bash
# Test application performance
node scripts/performance-test.js https://your-app.vercel.app

# Monitor database performance
node scripts/test-connection.js

# Validate deployment health
node scripts/verify-deployment.js https://your-app.vercel.app
```

#### Performance Metrics Tracked
- **Load Time**: Page load performance tracking
- **API Response Time**: Endpoint response time monitoring
- **Memory Usage**: Application memory consumption
- **Game Frame Rate**: Real-time game performance (when applicable)
- **Database Connectivity**: Connection health and response times
- **Uptime Monitoring**: System availability tracking

#### Performance Thresholds
- **Load Time**: < 5 seconds for initial page load
- **API Response**: < 2 seconds for all API endpoints
- **Health Checks**: < 1 second response time
- **Memory Usage**: < 100MB heap usage alert threshold
- **Database**: < 2 seconds for score operations
- **Uptime Target**: 99% availability

#### Optimization Strategies
- **Client-Side**: Service worker caching, lazy loading, code splitting
- **Server-Side**: Connection pooling, query optimization, response compression
- **Database**: Optimized indexes, connection timeouts, retry logic
- **CDN**: Static asset distribution via Vercel Edge Network
- **Monitoring**: Real-time performance tracking and alerting

### Performance Testing

Run comprehensive performance tests:

```bash
# Test against local development
npm run build && npm start
node scripts/performance-test.js http://localhost:3000

# Test against production deployment
node scripts/performance-test.js https://your-app.vercel.app

# Database performance testing
MONGODB_URI="your_connection_string" node scripts/test-connection.js
```

The performance testing suite validates:
- Page load times across all routes
- API endpoint response times
- Database connection performance
- Concurrent user handling
- Health check functionality
- Memory usage thresholds

## Architecture

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Modules
- **Database**: MongoDB with Mongoose
- **Testing**: Jest + Testing Library
- **Build Tool**: Turbopack
- **Deployment**: Vercel

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── game/           # Game page
│   ├── scores/         # Scores page
│   └── settings/       # Settings page
├── components/         # Reusable UI components
│   ├── game/          # Game-specific components
│   ├── ui/            # Basic UI components
│   └── navigation/    # Navigation components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
│   ├── api/          # API utilities
│   ├── database/     # Database utilities
│   └── game/         # Game logic
├── types/            # TypeScript type definitions
├── utils/            # Helper functions
└── styles/           # Global styles and CSS modules
```

## Game Controls

### Desktop
- **Arrow Keys** or **WASD** - Move snake
- **Space** - Pause/Resume
- **R** - Restart game
- **Escape** - Return to menu

### Mobile
- **Touch Controls** - Swipe gestures for movement
- **Responsive Buttons** - On-screen controls
- **Tap to Pause** - Touch anywhere to pause

## API Endpoints

### Scores
- `GET /api/scores` - Get all scores with pagination
- `POST /api/scores` - Submit a new score
- `GET /api/scores/leaderboard` - Get top scores
- `GET /api/scores/player/[name]` - Get scores for specific player

### Parameters
- `limit` - Maximum number of results (default: 10)
- `period` - Time period filter (all, daily, weekly, monthly)
- `page` - Page number for pagination

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Categories
- **Unit Tests** - Component and function testing
- **Integration Tests** - API and database testing
- **E2E Tests** - Full user workflow testing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure all quality checks pass (`npm run validate`)

## Performance

### Optimization Features
- **Tree Shaking** - Removes unused code
- **Code Splitting** - Lazy loading of components
- **Image Optimization** - Automatic image optimization
- **Static Generation** - Pre-rendered pages where possible
- **Edge Functions** - API routes optimized for edge deployment

### Monitoring
- Built-in performance monitoring
- Real-time error tracking
- User interaction analytics
- Game performance metrics

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Deployed on [Vercel](https://vercel.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Testing with [Jest](https://jestjs.io/) and [Testing Library](https://testing-library.com/)
