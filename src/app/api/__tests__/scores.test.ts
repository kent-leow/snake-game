/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '../scores/route';
import { ScoreService } from '@/lib/api/scoreService';

// Mock the ScoreService
jest.mock('@/lib/api/scoreService');
const MockScoreService = ScoreService as jest.MockedClass<typeof ScoreService>;

// Mock console.error to avoid test output noise
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('/api/scores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/scores', () => {
    beforeEach(() => {
      MockScoreService.prototype.getScores = jest.fn();
    });

    it('should return scores with default pagination', async () => {
      const mockScores = [
        { _id: '1', playerName: 'Player1', score: 1000 },
        { _id: '2', playerName: 'Player2', score: 900 },
      ];
      
      MockScoreService.prototype.getScores.mockResolvedValue({
        scores: mockScores,
        total: 100,
      });

      const request = new NextRequest('http://localhost:3000/api/scores');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockScores,
        pagination: {
          total: 100,
          limit: 50,
          offset: 0,
          hasMore: true,
        },
      });
    });

    it('should handle custom pagination parameters', async () => {
      MockScoreService.prototype.getScores.mockResolvedValue({
        scores: [],
        total: 25,
      });

      const request = new NextRequest('http://localhost:3000/api/scores?limit=10&offset=20&sortBy=timestamp&order=asc');
      const response = await GET(request);
      const data = await response.json();

      expect(MockScoreService.prototype.getScores).toHaveBeenCalledWith({
        limit: 10,
        offset: 20,
        sortBy: 'timestamp',
        order: 'asc',
      });

      expect(data.pagination).toEqual({
        total: 25,
        limit: 10,
        offset: 20,
        hasMore: false,
      });
    });

    it('should validate limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores?limit=200');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid limit');
    });

    it('should validate offset parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores?offset=-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid offset');
    });

    it('should handle service errors', async () => {
      MockScoreService.prototype.getScores.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/scores');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/scores', () => {
    beforeEach(() => {
      MockScoreService.prototype.createScore = jest.fn();
      MockScoreService.isRateLimited = jest.fn().mockResolvedValue(false);
    });

    const validScoreData = {
      playerName: 'TestPlayer',
      score: 1000,
      gameMetrics: {
        totalFood: 50,
        totalCombos: 10,
        longestCombo: 5,
        maxSpeedLevel: 3,
        gameTimeSeconds: 120,
        finalSnakeLength: 25,
      },
      comboStats: {
        totalComboPoints: 500,
        basePoints: 500,
        comboEfficiency: 20,
        averageComboLength: 2.5,
      },
    };

    it('should create a score successfully', async () => {
      const mockCreatedScore = { ...validScoreData, _id: 'mock-id', timestamp: new Date() };
      MockScoreService.prototype.createScore.mockResolvedValue(mockCreatedScore as any);

      const request = new NextRequest('http://localhost:3000/api/scores', {
        method: 'POST',
        body: JSON.stringify(validScoreData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: mockCreatedScore,
        message: 'Score saved successfully',
      });
    });

    it('should check rate limiting', async () => {
      MockScoreService.isRateLimited.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/scores', {
        method: 'POST',
        body: JSON.stringify(validScoreData),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(MockScoreService.isRateLimited).toHaveBeenCalledWith('127.0.0.1');
    });

    it('should handle validation errors', async () => {
      const { ValidationError } = require('@/lib/api/errorHandler');
      MockScoreService.prototype.createScore.mockRejectedValue(
        new ValidationError('Invalid data', ['Score is required'])
      );

      const request = new NextRequest('http://localhost:3000/api/scores', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/scores', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON');
    });

    it('should extract client ID from various headers', async () => {
      MockScoreService.prototype.createScore.mockResolvedValue({} as any);

      // Test with x-real-ip header
      const request = new NextRequest('http://localhost:3000/api/scores', {
        method: 'POST',
        body: JSON.stringify(validScoreData),
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': '192.168.1.1',
        },
      });

      await POST(request);

      expect(MockScoreService.isRateLimited).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should use fallback client ID when headers missing', async () => {
      MockScoreService.prototype.createScore.mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost:3000/api/scores', {
        method: 'POST',
        body: JSON.stringify(validScoreData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await POST(request);

      expect(MockScoreService.isRateLimited).toHaveBeenCalledWith('unknown');
    });
  });

  describe('Unsupported Methods', () => {
    it('should reject PUT requests', async () => {
      const { PUT } = require('../scores/route');
      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
      expect(data.allowedMethods).toEqual(['GET', 'POST']);
    });

    it('should reject DELETE requests', async () => {
      const { DELETE } = require('../scores/route');
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should reject PATCH requests', async () => {
      const { PATCH } = require('../scores/route');
      const response = await PATCH();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });
  });
});