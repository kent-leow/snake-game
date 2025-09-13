# Phase-by-Phase Development Plan

## Development Overview

### Timeline: 2-3 Weeks for MVP + 3-4 Weeks for Full Features
**Total Duration**: 5-7 weeks  
**Development Model**: Iterative with continuous deployment  
**Validation**: Manual testing with real user feedback  

## Phase 1: MVP Core Foundation (5-7 Days)

### Objective
Establish the foundational game infrastructure with basic snake mechanics and core framework setup.

### Requirements Addressed
- **FR-001**: Classic snake movement controls
- **FR-002**: Snake growth on food consumption  
- **FR-003**: Game over on collision (walls/self)
- **FR-011**: Main Menu page
- **FR-012**: Snake Game page  
- **FR-015**: Page navigation system
- **FR-016**: Game controls (start/pause/restart)

### Technical Deliverables

#### Project Setup (Day 1)
```bash
# Initialize Next.js with TypeScript
npx create-next-app@latest snake-play --typescript --tailwind --eslint
cd snake-play

# Setup Docker for MongoDB
touch docker-compose.yml
mkdir -p lib/mongodb
touch lib/mongodb/connection.ts

# Configure TypeScript strict mode
# Update tsconfig.json with strict configuration
```

#### Core Infrastructure (Day 1-2)
- **Next.js Configuration**: 
  - TypeScript strict mode setup
  - ESLint and Prettier configuration
  - Environment variable setup
- **Docker MongoDB**:
  - docker-compose.yml for local database
  - MongoDB connection utility
  - Basic database initialization
- **Project Structure**:
  ```
  pages/
    ├── index.tsx (Main Menu)
    ├── game.tsx (Game Page)  
    └── api/
  components/
    ├── Layout.tsx
    ├── Navigation.tsx
    └── GameCanvas.tsx
  lib/
    ├── game-engine/
    ├── mongodb/
    └── types/
  ```

#### Game Engine Foundation (Day 2-3)
```typescript
// lib/game-engine/types.ts
interface GameState {
  snake: SnakeSegment[];
  food: FoodBlock;
  score: number;
  gameStatus: 'playing' | 'paused' | 'gameover';
  direction: Direction;
}

interface SnakeSegment {
  x: number;
  y: number;
}

interface FoodBlock {
  x: number;
  y: number;
}

type Direction = 'up' | 'down' | 'left' | 'right';
```

```typescript
// lib/game-engine/snake.ts
export class Snake {
  constructor(
    public segments: SnakeSegment[],
    public direction: Direction
  ) {}

  move(): void {
    // Move snake based on direction
  }

  grow(): void {
    // Add segment to snake
  }

  checkCollision(boundaries: Boundaries): boolean {
    // Check wall and self collision
  }
}
```

#### Canvas Rendering (Day 3-4)
```typescript
// components/GameCanvas.tsx
const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx) {
      const gameLoop = () => {
        clearCanvas(ctx);
        drawSnake(ctx, gameState.snake);
        drawFood(ctx, gameState.food);
        requestAnimationFrame(gameLoop);
      };
      
      gameLoop();
    }
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={600}
      className="border border-gray-400"
    />
  );
};
```

#### Basic UI and Navigation (Day 4-5)
- **Main Menu**: Simple landing page with "Start Game" button
- **Game Page**: Canvas component with basic UI overlay
- **Navigation**: React Router setup between pages
- **Game Controls**: Keyboard event handling for arrow keys

#### Game Loop Implementation (Day 5-7)
```typescript
// lib/game-engine/game-loop.ts
export class GameLoop {
  private gameState: GameState;
  private isRunning: boolean = false;
  
  constructor(initialState: GameState) {
    this.gameState = initialState;
  }
  
  start(): void {
    this.isRunning = true;
    this.loop();
  }
  
  private loop(): void {
    if (!this.isRunning) return;
    
    this.updateGame();
    this.checkCollisions();
    this.renderFrame();
    
    setTimeout(() => this.loop(), 1000 / 10); // 10 FPS initially
  }
  
  private updateGame(): void {
    this.gameState.snake.move();
    // Check food consumption
    // Update score
  }
}
```

### Validation Criteria
- [ ] Snake moves smoothly in 4 directions using arrow keys
- [ ] Snake grows by one segment when eating food
- [ ] Game ends when snake hits walls or itself
- [ ] Main menu navigates to game page
- [ ] Game page displays canvas with playable game
- [ ] TypeScript compiles without errors
- [ ] Docker MongoDB container starts successfully

### Risk Mitigation
- **Canvas Performance**: Start with simple rectangles, optimize later
- **TypeScript Complexity**: Use `any` temporarily for complex game state, refine later
- **Docker Issues**: Provide alternative local MongoDB installation guide

---

## Phase 2: Combo System Implementation (5-7 Days)

### Objective  
Implement the core innovation of numbered food blocks and combo mechanics with database integration.

### Requirements Addressed
- **FR-004**: 5 simultaneous food blocks with numbers
- **FR-005**: Order-based eating for combo points  
- **FR-006**: Base scoring: 10pts per food block
- **FR-007**: Combo scoring: 5pts per combo
- **FR-008**: Speed increase per combo
- **FR-009**: Speed reset on combo break
- **FR-027**: High score storage (local)

### Technical Deliverables

#### Numbered Food System (Day 1-2)
```typescript
// lib/game-engine/food-manager.ts
interface FoodBlock {
  x: number;
  y: number;
  number: number; // 1-5
  id: string;
}

export class FoodManager {
  private foodBlocks: FoodBlock[] = [];
  
  generateFoodSet(): FoodBlock[] {
    // Generate 5 food blocks with numbers 1-5
    // Ensure no overlap with snake or other food
    return this.foodBlocks;
  }
  
  removeFood(id: string): void {
    // Remove consumed food and generate replacement
  }
  
  isValidComboConsumption(foodNumber: number, currentCombo: number): boolean {
    // Check if food number follows combo sequence
    return foodNumber === (currentCombo % 5) + 1;
  }
}
```

#### Combo Logic Implementation (Day 2-3)
```typescript
// lib/game-engine/combo-system.ts
export class ComboSystem {
  private currentCombo: number = 0;
  private comboProgress: number = 0; // 0-4 (which number in sequence)
  
  processFoodConsumption(foodNumber: number): ComboResult {
    const expectedNumber = (this.comboProgress % 5) + 1;
    
    if (foodNumber === expectedNumber) {
      this.comboProgress++;
      
      if (this.comboProgress === 5) {
        // Complete combo
        this.currentCombo++;
        this.comboProgress = 0;
        return {
          type: 'combo_complete',
          bonusPoints: 5,
          speedIncrease: true
        };
      }
      
      return {
        type: 'combo_progress',
        bonusPoints: 0,
        speedIncrease: false
      };
    } else {
      // Combo broken
      this.resetCombo();
      return {
        type: 'combo_broken',
        bonusPoints: 0,
        speedIncrease: false,
        speedReset: true
      };
    }
  }
  
  resetCombo(): void {
    this.comboProgress = 0;
  }
}
```

#### Enhanced Scoring System (Day 3-4)
```typescript
// lib/game-engine/score-manager.ts
export class ScoreManager {
  private score: number = 0;
  private basePointsPerFood: number = 10;
  private comboBonus: number = 5;
  
  calculateScore(foodConsumed: boolean, comboResult: ComboResult): number {
    let points = 0;
    
    if (foodConsumed) {
      points += this.basePointsPerFood;
    }
    
    if (comboResult.type === 'combo_complete') {
      points += this.comboBonus;
    }
    
    this.score += points;
    return points;
  }
  
  getCurrentScore(): number {
    return this.score;
  }
}
```

#### Speed Progression System (Day 4-5)
```typescript
// lib/game-engine/speed-manager.ts
export class SpeedManager {
  private baseSpeed: number = 150; // ms between moves
  private currentSpeed: number = 150;
  private speedIncrement: number = 10; // ms decrease per combo
  private minSpeed: number = 50;
  
  increaseSpeed(): void {
    this.currentSpeed = Math.max(
      this.currentSpeed - this.speedIncrement,
      this.minSpeed
    );
  }
  
  resetSpeed(): void {
    this.currentSpeed = this.baseSpeed;
  }
  
  getCurrentSpeed(): number {
    return this.currentSpeed;
  }
}
```

#### Database Integration (Day 5-6)
```typescript
// models/Score.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IScore extends Document {
  playerName: string;
  score: number;
  comboCount: number;
  timestamp: Date;
}

const ScoreSchema: Schema = new Schema({
  playerName: { type: String, required: true, maxlength: 20 },
  score: { type: Number, required: true, min: 0 },
  comboCount: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

ScoreSchema.index({ score: -1 }); // For leaderboard queries
ScoreSchema.index({ timestamp: -1 }); // For recent scores

export default mongoose.models.Score || mongoose.model<IScore>('Score', ScoreSchema);
```

```typescript
// pages/api/scores.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb/connection';
import Score from '../../models/Score';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  
  switch (req.method) {
    case 'GET':
      try {
        const scores = await Score.find()
          .sort({ score: -1 })
          .limit(10)
          .lean();
        res.status(200).json(scores);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scores' });
      }
      break;
      
    case 'POST':
      try {
        const { playerName, score, comboCount } = req.body;
        const newScore = new Score({ playerName, score, comboCount });
        await newScore.save();
        res.status(201).json(newScore);
      } catch (error) {
        res.status(500).json({ error: 'Failed to save score' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

#### Integration and Testing (Day 6-7)
- **System Integration**: Connect all components together
- **Manual Testing**: Validate combo mechanics work correctly
- **Database Testing**: Ensure scores save and load properly
- **Performance Testing**: Verify smooth gameplay at various speeds

### Validation Criteria
- [ ] 5 food blocks with numbers 1-5 display simultaneously
- [ ] Eating in sequence (1→2→3→4→5) awards combo bonus
- [ ] Eating out of sequence breaks combo and resets speed
- [ ] Speed increases noticeably after each combo
- [ ] Base score (10pts) + combo bonus (5pts) calculated correctly
- [ ] High scores save to MongoDB and display correctly
- [ ] Docker MongoDB persists data between restarts

### Performance Targets
- Maintain 30+ FPS during gameplay
- Combo detection responds within 1 frame
- Database operations complete within 500ms

---

## Phase 3: UI Polish and Deployment (3-5 Days)

### Objective
Complete the user interface, add visual polish, and deploy to production.

### Requirements Addressed  
- **FR-013**: High Score page
- **FR-022**: Snake movement animation
- **FR-026**: Score display with animations

### Technical Deliverables

#### High Score Page (Day 1-2)
```typescript
// pages/highscore.tsx
const HighScorePage: React.FC = () => {
  const [scores, setScores] = useState<IScore[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchHighScores();
  }, []);
  
  const fetchHighScores = async () => {
    try {
      const response = await fetch('/api/scores');
      const data = await response.json();
      setScores(data);
    } catch (error) {
      console.error('Failed to fetch scores:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">High Scores</h1>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="max-w-md mx-auto">
          {scores.map((score, index) => (
            <div key={score._id} className="flex justify-between items-center p-4 border-b">
              <span className="font-semibold">#{index + 1}</span>
              <span>{score.playerName}</span>
              <span className="font-bold">{score.score}</span>
            </div>
          ))}
        </div>
      )}
      <div className="text-center mt-8">
        <Link href="/" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
          Back to Menu
        </Link>
      </div>
    </div>
  );
};
```

#### Enhanced Game UI (Day 2-3)
```typescript
// components/GameUI.tsx
const GameUI: React.FC<GameUIProps> = ({ gameState, onPause, onRestart }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white">
      <div className="flex justify-between items-center">
        <div className="text-xl">
          Score: <span className="font-bold text-yellow-400">{gameState.score}</span>
        </div>
        <div className="text-lg">
          Combo: <span className="font-bold text-green-400">{gameState.comboCount}</span>
        </div>
        <div className="space-x-2">
          <button onClick={onPause} className="bg-blue-500 px-4 py-2 rounded">
            {gameState.gameStatus === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <button onClick={onRestart} className="bg-red-500 px-4 py-2 rounded">
            Restart
          </button>
        </div>
      </div>
      
      {/* Combo Progress Indicator */}
      <div className="mt-2">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((number) => (
            <div
              key={number}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                gameState.comboProgress >= number
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {number}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

#### Visual Polish and Animations (Day 3-4)
```typescript
// Enhanced rendering with animations
const drawSnake = (ctx: CanvasRenderingContext2D, snake: SnakeSegment[]) => {
  snake.forEach((segment, index) => {
    // Head has different color/style
    if (index === 0) {
      ctx.fillStyle = '#4CAF50';
      ctx.strokeStyle = '#2E7D32';
    } else {
      ctx.fillStyle = '#8BC34A';
      ctx.strokeStyle = '#558B2F';
    }
    
    ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
  });
};

const drawFood = (ctx: CanvasRenderingContext2D, food: FoodBlock[]) => {
  food.forEach((block) => {
    // Different colors for each number
    const colors = ['#FF5722', '#FF9800', '#FFC107', '#FFEB3B', '#CDDC39'];
    ctx.fillStyle = colors[block.number - 1];
    
    // Draw food block
    ctx.fillRect(block.x * GRID_SIZE, block.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    
    // Draw number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      block.number.toString(),
      block.x * GRID_SIZE + GRID_SIZE / 2,
      block.y * GRID_SIZE + GRID_SIZE / 2 + 4
    );
  });
};
```

#### Production Deployment (Day 4-5)
```bash
# Vercel deployment configuration
# vercel.json
{
  "version": 2,
  "env": {
    "MONGODB_URI": "@mongodb-uri-prod"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}

# Environment variables setup
vercel env add MONGODB_URI production
# MongoDB Atlas connection string

# Deploy to production
vercel --prod
```

```typescript
// Production MongoDB connection
// lib/mongodb/connection.ts
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      bufferMaxEntries: 0,
      useFindAndModify: false,
      useCreateIndex: true,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### Validation Criteria
- [ ] High score page displays top 10 scores correctly
- [ ] Game UI shows current score, combo count, and progress
- [ ] Visual animations enhance gameplay experience
- [ ] Production deployment successful on Vercel
- [ ] MongoDB Atlas connection working in production
- [ ] All pages load within 3 seconds
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

### Deployment Checklist
- [ ] Environment variables configured in Vercel
- [ ] MongoDB Atlas cluster configured and accessible
- [ ] Domain name configured (if custom domain desired)
- [ ] SSL certificate active
- [ ] Performance monitoring enabled

---

## Post-MVP Enhancement Phases

### Phase 4: Audio System (4-6 Days)
- Background music integration
- Sound effects for game events  
- Audio controls and volume management
- Browser autoplay policy compliance

### Phase 5: Mobile and Advanced Features (3-5 Days)
- Touch controls for mobile devices
- Responsive design optimization
- Settings page with customization options
- Advanced animations and visual effects

## Risk Management and Mitigation

### Phase-Specific Risks

**Phase 1 Risks**:
- **Canvas Learning Curve**: Mitigate with simple rectangle-based graphics initially
- **TypeScript Complexity**: Start with loose typing, tighten progressively

**Phase 2 Risks**:
- **Combo Logic Complexity**: Prototype the algorithm separately before integration
- **Database Connection Issues**: Test thoroughly with Docker setup

**Phase 3 Risks**:
- **Deployment Issues**: Practice deployment to Vercel early in development
- **Performance Problems**: Profile and optimize before production deployment

### Cross-Phase Risk Mitigation
- **Frequent Commits**: Commit working code frequently to avoid large rollbacks
- **Incremental Testing**: Test each feature as it's developed
- **Documentation**: Document complex logic for future maintenance
- **Backup Plans**: Keep previous working versions as fallback options

## Success Metrics

### Technical Metrics
- **Performance**: Maintain 30+ FPS during gameplay
- **Reliability**: Zero game-breaking bugs in production
- **Load Time**: All pages load within 3 seconds
- **Compatibility**: Works on latest 2 versions of major browsers

### User Experience Metrics
- **Engagement**: Players complete multiple games
- **Retention**: Players return to beat high scores
- **Usability**: New players understand mechanics within 2 minutes
- **Performance**: Smooth gameplay without lag or stuttering

This phase-by-phase plan provides clear milestones, specific deliverables, and measurable validation criteria for successful project completion.