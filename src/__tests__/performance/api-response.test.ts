/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, HEAD } from '../../app/api/health/route';

// Mock the database connection
jest.mock('../../lib/database/connection', () => ({
  connectToDatabase: jest.fn(),
  isConnected: jest.fn(),
}));

// Mock mongoose
jest.mock('mongoose', () => ({
  connection: {
    db: {
      admin: () => ({
        ping: jest.fn().mockResolvedValue({}),
      }),
    },
  },
}));

describe('API Response Performance Tests', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Health Check API Performance', () => {
    it('should respond within 2 seconds for healthy status', async () => {
      const { connectToDatabase, isConnected } = require('../../lib/database/connection');
      connectToDatabase.mockResolvedValue({});
      isConnected.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/health');
      
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // 2 second threshold
      
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.services.database).toBe('ok');
    });

    it('should respond quickly even with database timeout', async () => {
      const { connectToDatabase } = require('../../lib/database/connection');
      
      // Mock database timeout
      connectToDatabase.mockRejectedValue(new Error('Database timeout'));

      const request = new NextRequest('http://localhost:3000/api/health');
      
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(503);
      expect(responseTime).toBeLessThan(6000); // Should timeout within 6 seconds (5s timeout + overhead)
      
      const data = await response.json();
      expect(data.status).toBe('error');
      expect(data.services.database).toBe('error');
    });

    it('should provide lightweight HEAD response quickly', async () => {
      const { isConnected } = require('../../lib/database/connection');
      isConnected.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/health');
      
      const startTime = Date.now();
      const response = await HEAD(request);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // HEAD should be very fast
      
      // Check headers
      expect(response.headers.get('X-Database-Status')).toBe('ok');
      expect(response.headers.get('X-Health-Status')).toBe('ok');
    });

    it('should handle database connection check performance', async () => {
      const { connectToDatabase, isConnected } = require('../../lib/database/connection');
      
      // Mock slow database connection
      connectToDatabase.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      );
      isConnected.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/health');
      
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeGreaterThan(1000); // Should take at least 1 second
      expect(responseTime).toBeLessThan(2000); // But still under 2 seconds
      expect(data.services.database).toBe('ok');
    });
  });

  describe('Health Check Response Headers', () => {
    it('should include performance timing headers', async () => {
      const { connectToDatabase, isConnected } = require('../../lib/database/connection');
      connectToDatabase.mockResolvedValue({});
      isConnected.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      
      expect(response.headers.has('X-Health-Check-Duration')).toBe(true);
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should include database status in HEAD response', async () => {
      const { isConnected } = require('../../lib/database/connection');
      isConnected.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await HEAD(request);
      
      expect(response.status).toBe(503);
      expect(response.headers.get('X-Database-Status')).toBe('error');
      expect(response.headers.get('X-Health-Status')).toBe('degraded');
    });
  });

  describe('Memory Performance Monitoring', () => {
    it('should report memory usage in health check', async () => {
      const { connectToDatabase, isConnected } = require('../../lib/database/connection');
      connectToDatabase.mockResolvedValue({});
      isConnected.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.performance.memory).toMatchObject({
        usage: expect.any(Number),
        total: expect.any(Number),
        percentage: expect.any(Number),
      });
      
      expect(data.performance.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(data.performance.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should detect high memory usage', async () => {
      const { connectToDatabase, isConnected } = require('../../lib/database/connection');
      connectToDatabase.mockResolvedValue({});
      isConnected.mockReturnValue(true);

      // Mock process.memoryUsage to return high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        rss: 1000 * 1024 * 1024, // 1000MB
        heapUsed: 950 * 1024 * 1024, // 950MB
        heapTotal: 1000 * 1024 * 1024, // 1000MB (95% usage)
        external: 0,
        arrayBuffers: 0,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.performance.memory.percentage).toBeGreaterThan(90);
      expect(data.status).toBe('degraded'); // Should be degraded due to high memory
      
      // Restore original memoryUsage
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('API Endpoint Response Times', () => {
    it('should measure actual API response time performance', async () => {
      // This test measures the actual time taken by the API endpoint
      const performanceTests = [
        { name: 'Healthy Database', setupMock: () => {
          const { connectToDatabase, isConnected } = require('../../lib/database/connection');
          connectToDatabase.mockResolvedValue({});
          isConnected.mockReturnValue(true);
        }},
        { name: 'Database Error', setupMock: () => {
          const { connectToDatabase } = require('../../lib/database/connection');
          connectToDatabase.mockRejectedValue(new Error('Connection failed'));
        }},
      ];

      for (const test of performanceTests) {
        test.setupMock();
        
        const request = new NextRequest('http://localhost:3000/api/health');
        
        const measurements = [];
        const iterations = 5;
        
        // Run multiple iterations to get average response time
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          await GET(request);
          const endTime = performance.now();
          
          measurements.push(endTime - startTime);
        }
        
        const averageTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
        const maxTime = Math.max(...measurements);
        
        console.log(`${test.name}: Average ${averageTime.toFixed(2)}ms, Max ${maxTime.toFixed(2)}ms`);
        
        // Performance assertions
        expect(averageTime).toBeLessThan(1000); // Average under 1 second
        expect(maxTime).toBeLessThan(2000); // Max under 2 seconds
      }
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle multiple concurrent health check requests', async () => {
      const { connectToDatabase, isConnected } = require('../../lib/database/connection');
      connectToDatabase.mockResolvedValue({});
      isConnected.mockReturnValue(true);

      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, () => {
        const request = new NextRequest('http://localhost:3000/api/health');
        return GET(request);
      });

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const averageTime = totalTime / concurrentRequests;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Concurrent requests shouldn't take significantly longer than sequential
      expect(averageTime).toBeLessThan(1000); // Average per request under 1 second
      expect(totalTime).toBeLessThan(5000); // Total time under 5 seconds
      
      console.log(`Concurrent test: ${concurrentRequests} requests in ${totalTime.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms)`);
    });

    it('should maintain performance under database stress', async () => {
      const { connectToDatabase, isConnected } = require('../../lib/database/connection');
      
      // Mock database with slight delay to simulate load
      connectToDatabase.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
      );
      isConnected.mockReturnValue(true);

      const requests = Array.from({ length: 5 }, () => {
        const request = new NextRequest('http://localhost:3000/api/health');
        return GET(request);
      });

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should handle the load reasonably well
      expect(totalTime).toBeLessThan(2000); // Under 2 seconds for 5 concurrent requests
    });
  });
});