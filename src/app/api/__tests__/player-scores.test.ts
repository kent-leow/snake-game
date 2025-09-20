/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../scores/player/[name]/route';
import { ScoreService } from '@/lib/api/scoreService';

// Mock the ScoreService
jest.mock('@/lib/api/scoreService');
const MockScoreService = ScoreService as jest.MockedClass<typeof ScoreService>;

// Mock console.error to avoid test output noise
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('/api/scores/player/[name]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockScoreService.prototype.getPlayerScores = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockPlayerScores = [
    { _id: '1', playerName: 'TestPlayer', score: 1000, timestamp: new Date() },
    { _id: '2', playerName: 'TestPlayer', score: 900, timestamp: new Date() },
    { _id: '3', playerName: 'TestPlayer', score: 800, timestamp: new Date() },
  ];

  describe('GET /api/scores/player/[name]', () => {
    it('should return player scores successfully', async () => {
      MockScoreService.prototype.getPlayerScores.mockResolvedValue(mockPlayerScores);

      const request = new NextRequest('http://localhost:3000/api/scores/player/TestPlayer');
  const response = await GET(request, { params: Promise.resolve({ name: 'TestPlayer' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      // Convert timestamps to ISO strings for comparison
      const expectedScores = mockPlayerScores.map(score => ({
        ...score,
        timestamp: score.timestamp.toISOString(),
      }));
      expect(data).toEqual({
        success: true,
        data: {
          playerName: 'TestPlayer',
          scores: expectedScores,
          bestScore: 1000,
          totalGames: 3,
          averageScore: 900, // (1000 + 900 + 800) / 3 = 900
        },
      });

      expect(MockScoreService.prototype.getPlayerScores).toHaveBeenCalledWith('TestPlayer', 10);
    });

    it('should handle encoded player names', async () => {
      MockScoreService.prototype.getPlayerScores.mockResolvedValue(mockPlayerScores);

      const encodedName = encodeURIComponent('Player Name');
      const request = new NextRequest(`http://localhost:3000/api/scores/player/${encodedName}`);
  const response = await GET(request, { params: Promise.resolve({ name: encodedName }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(MockScoreService.prototype.getPlayerScores).toHaveBeenCalledWith('Player Name', 10);
      expect(data.data.playerName).toBe('Player Name');
    });

    it('should handle custom limit parameter', async () => {
      MockScoreService.prototype.getPlayerScores.mockResolvedValue(mockPlayerScores.slice(0, 2));

      const request = new NextRequest('http://localhost:3000/api/scores/player/TestPlayer?limit=2');
  const response = await GET(request, { params: Promise.resolve({ name: 'TestPlayer' }) });
      const data = await response.json();

      expect(MockScoreService.prototype.getPlayerScores).toHaveBeenCalledWith('TestPlayer', 2);
      expect(data.data.totalGames).toBe(2);
    });

    it('should validate limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores/player/TestPlayer?limit=100');
  const response = await GET(request, { params: Promise.resolve({ name: 'TestPlayer' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid limit');
      expect(data.message).toBe('Limit must be between 1 and 50');
    });

    it('should validate limit parameter lower bound', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores/player/TestPlayer?limit=0');
  const response = await GET(request, { params: Promise.resolve({ name: 'TestPlayer' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid limit');
    });

    it('should handle empty player name', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores/player/');
  const response = await GET(request, { params: Promise.resolve({ name: '' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid player name');
      expect(data.message).toBe('Player name is required and must be a string');
    });

    it('should handle missing player name', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores/player/test');
  const response = await GET(request, { params: Promise.resolve({ name: undefined as any }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid player name');
    });

    it('should handle player with no scores', async () => {
      MockScoreService.prototype.getPlayerScores.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/scores/player/NewPlayer');
  const response = await GET(request, { params: Promise.resolve({ name: 'NewPlayer' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual({
        playerName: 'NewPlayer',
        scores: [],
        bestScore: 0,
        totalGames: 0,
        averageScore: 0,
      });
    });

    it('should handle service errors', async () => {
      MockScoreService.prototype.getPlayerScores.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/scores/player/TestPlayer');
  const response = await GET(request, { params: Promise.resolve({ name: 'TestPlayer' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle validation errors from service', async () => {
      const { ValidationError } = require('@/lib/api/errorHandler');
      MockScoreService.prototype.getPlayerScores.mockRejectedValue(
        new ValidationError('Invalid player name', ['Player name must be a non-empty string'])
      );

      const request = new NextRequest('http://localhost:3000/api/scores/player/TestPlayer');
  const response = await GET(request, { params: Promise.resolve({ name: 'TestPlayer' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Unsupported Methods', () => {
    it('should reject POST requests', async () => {
      const { POST } = require('../scores/player/[name]/route');
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
      expect(data.allowedMethods).toEqual(['GET']);
    });

    it('should reject PUT requests', async () => {
      const { PUT } = require('../scores/player/[name]/route');
      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should reject DELETE requests', async () => {
      const { DELETE } = require('../scores/player/[name]/route');
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should reject PATCH requests', async () => {
      const { PATCH } = require('../scores/player/[name]/route');
      const response = await PATCH();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });
  });
});