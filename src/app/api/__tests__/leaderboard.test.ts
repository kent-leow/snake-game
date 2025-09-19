/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../scores/leaderboard/route';
import { ScoreService } from '@/lib/api/scoreService';

// Mock the ScoreService
jest.mock('@/lib/api/scoreService');
const MockScoreService = ScoreService as jest.MockedClass<typeof ScoreService>;

// Mock console.error to avoid test output noise
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('/api/scores/leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockScoreService.prototype.getLeaderboard = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockLeaderboard = [
    { _id: '1', playerName: 'Player1', score: 5000, timestamp: new Date() },
    { _id: '2', playerName: 'Player2', score: 4500, timestamp: new Date() },
    { _id: '3', playerName: 'Player3', score: 4000, timestamp: new Date() },
  ];

  describe('GET /api/scores/leaderboard', () => {
    it('should return all-time leaderboard by default', async () => {
      MockScoreService.prototype.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          period: 'all',
          leaderboard: mockLeaderboard,
          lastUpdated: expect.any(String),
        },
      });

      expect(MockScoreService.prototype.getLeaderboard).toHaveBeenCalledWith({
        period: 'all',
        limit: 10,
      });
    });

    it('should handle daily leaderboard', async () => {
      MockScoreService.prototype.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard?period=daily');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.period).toBe('daily');
      expect(MockScoreService.prototype.getLeaderboard).toHaveBeenCalledWith({
        period: 'daily',
        limit: 10,
      });
    });

    it('should handle weekly leaderboard', async () => {
      MockScoreService.prototype.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard?period=weekly');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.period).toBe('weekly');
      expect(MockScoreService.prototype.getLeaderboard).toHaveBeenCalledWith({
        period: 'weekly',
        limit: 10,
      });
    });

    it('should handle monthly leaderboard', async () => {
      MockScoreService.prototype.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard?period=monthly');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.period).toBe('monthly');
      expect(MockScoreService.prototype.getLeaderboard).toHaveBeenCalledWith({
        period: 'monthly',
        limit: 10,
      });
    });

    it('should handle custom limit parameter', async () => {
      MockScoreService.prototype.getLeaderboard.mockResolvedValue(mockLeaderboard.slice(0, 5));

      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard?limit=5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(MockScoreService.prototype.getLeaderboard).toHaveBeenCalledWith({
        period: 'all',
        limit: 5,
      });
    });

    it('should handle combined parameters', async () => {
      MockScoreService.prototype.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard?period=weekly&limit=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(MockScoreService.prototype.getLeaderboard).toHaveBeenCalledWith({
        period: 'weekly',
        limit: 20,
      });
    });

    it('should validate period parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard?period=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid period');
      expect(data.message).toBe('Period must be one of: daily, weekly, monthly, all');
    });

    it('should validate limit parameter upper bound', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard?limit=200');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid limit');
      expect(data.message).toBe('Limit must be between 1 and 100');
    });

    it('should validate limit parameter lower bound', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard?limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid limit');
      expect(data.message).toBe('Limit must be between 1 and 100');
    });

    it('should handle empty leaderboard', async () => {
      MockScoreService.prototype.getLeaderboard.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.leaderboard).toEqual([]);
    });

    it('should include lastUpdated timestamp', async () => {
      MockScoreService.prototype.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const beforeRequest = new Date().toISOString();
      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard');
      const response = await GET(request);
      const afterRequest = new Date().toISOString();
      const data = await response.json();

      expect(data.data.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(data.data.lastUpdated >= beforeRequest).toBe(true);
      expect(data.data.lastUpdated <= afterRequest).toBe(true);
    });

    it('should handle service errors', async () => {
      MockScoreService.prototype.getLeaderboard.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle validation errors from service', async () => {
      const { ValidationError } = require('@/lib/api/errorHandler');
      MockScoreService.prototype.getLeaderboard.mockRejectedValue(
        new ValidationError('Invalid limit', ['Limit must be between 1 and 100'])
      );

      const request = new NextRequest('http://localhost:3000/api/scores/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Unsupported Methods', () => {
    it('should reject POST requests', async () => {
      const { POST } = require('../scores/leaderboard/route');
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
      expect(data.allowedMethods).toEqual(['GET']);
    });

    it('should reject PUT requests', async () => {
      const { PUT } = require('../scores/leaderboard/route');
      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should reject DELETE requests', async () => {
      const { DELETE } = require('../scores/leaderboard/route');
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should reject PATCH requests', async () => {
      const { PATCH } = require('../scores/leaderboard/route');
      const response = await PATCH();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });
  });
});