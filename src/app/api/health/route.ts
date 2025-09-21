import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, isConnected } from '../../../lib/database/connection';

/**
 * Health Check API Endpoint
 * 
 * Provides comprehensive system health information including:
 * - Database connectivity
 * - System performance metrics
 * - Service availability
 * - Performance thresholds validation
 */

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  services: {
    database: 'ok' | 'error' | 'timeout';
    api: 'ok';
  };
  performance: {
    memory: {
      usage: number;
      total: number;
      percentage: number;
    };
    uptime: number;
    pid: number;
  };
  environment: string;
  version: string;
}

interface DatabaseHealthResult {
  status: 'ok' | 'error' | 'timeout';
  responseTime?: number;
  error?: string;
}

/**
 * Check database connectivity and performance
 */
async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const startTime = Date.now();
  const timeout = 3000; // 3 seconds timeout for serverless
  
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database health check timeout')), timeout);
    });
    
    // Race between database check and timeout
    await Promise.race([
      connectToDatabase(),
      timeoutPromise
    ]);
    
    const responseTime = Date.now() - startTime;
    
    // Verify connection is actually working
    if (!isConnected()) {
      return {
        status: 'error',
        responseTime,
        error: 'Database connection not established'
      };
    }
    
    // Additional check: try a simple operation
    try {
      const mongoose = require('mongoose');
      const db = mongoose.connection.db;
      
      // Simple ping operation with shorter timeout
      await Promise.race([
        db.admin().ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), 2000))
      ]);
      
      return {
        status: 'ok',
        responseTime: Date.now() - startTime
      };
    } catch (pingError) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: `Database ping failed: ${pingError instanceof Error ? pingError.message : 'Unknown error'}`
      };
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (responseTime >= timeout) {
      return {
        status: 'timeout',
        responseTime,
        error: 'Database health check timed out'
      };
    }
    
    return {
      status: 'error',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * Get system memory information
 */
function getMemoryInfo() {
  const memUsage = process.memoryUsage();
  
  return {
    usage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
  };
}

/**
 * GET /api/health - Health check endpoint
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Check database health
    const databaseHealth = await checkDatabaseHealth();
    
    // Get system information
    const memoryInfo = getMemoryInfo();
    const uptime = process.uptime();
    
    // Determine overall system status
    let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
    
    if (databaseHealth.status === 'error') {
      overallStatus = 'error';
    } else if (databaseHealth.status === 'timeout' || memoryInfo.percentage > 90) {
      overallStatus = 'degraded';
    }
    
    // Build health check response
    const healthCheck: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      services: {
        database: databaseHealth.status,
        api: 'ok',
      },
      performance: {
        memory: memoryInfo,
        uptime: Math.round(uptime),
        pid: process.pid,
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };
    
    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    // Add performance headers
    const response = NextResponse.json(healthCheck, { status: httpStatus });
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Health-Check-Duration', `${Date.now() - startTime}ms`);
    
    return response;
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorResponse: HealthCheckResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      services: {
        database: 'error',
        api: 'ok',
      },
      performance: {
        memory: getMemoryInfo(),
        uptime: Math.round(process.uptime()),
        pid: process.pid,
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };
    
    return NextResponse.json(errorResponse, { status: 503 });
  }
}

/**
 * HEAD /api/health - Lightweight health check
 */
export async function HEAD(_request: NextRequest): Promise<NextResponse> {
  try {
    // Quick database connectivity check
    const isDbConnected = isConnected();
    const memoryInfo = getMemoryInfo();
    
    // Simple health determination
    const isHealthy = isDbConnected && memoryInfo.percentage < 95;
    
    const response = new NextResponse(null, { 
      status: isHealthy ? 200 : 503 
    });
    
    response.headers.set('X-Database-Status', isDbConnected ? 'ok' : 'error');
    response.headers.set('X-Memory-Usage', `${memoryInfo.percentage}%`);
    response.headers.set('X-Health-Status', isHealthy ? 'ok' : 'degraded');
    
    return response;
    
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

/**
 * OPTIONS /api/health - CORS support
 */
export async function OPTIONS(_request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}