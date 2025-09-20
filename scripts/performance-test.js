#!/usr/bin/env node

/**
 * Performance Testing Script for Snake Game Production
 * 
 * This script validates that the application meets performance requirements:
 * - Initial load completes within 5 seconds
 * - API responses complete within 2 seconds
 * - Health checks work correctly
 * - Concurrent user handling
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

class PerformanceTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      loadTime: [],
      apiResponses: [],
      healthChecks: [],
      concurrencyTests: [],
      errors: [],
    };
    
    // Performance thresholds
    this.thresholds = {
      LOAD_TIME_MAX: 5000, // 5 seconds
      API_RESPONSE_MAX: 2000, // 2 seconds
      HEALTH_CHECK_MAX: 1000, // 1 second
      CONCURRENT_USERS: 10,
    };
  }

  /**
   * Log messages with timestamp and type
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️ ',
      success: '✅',
      warning: '⚠️ ',
      error: '❌',
    }[level] || '';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  /**
   * Make HTTP request with timing
   */
  async makeRequest(url, options = {}) {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || 10000,
        ...options,
      }, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime: endTime - startTime,
            url: url,
          });
        });
      });
      
      req.on('error', (error) => {
        const endTime = performance.now();
        reject({
          error: error.message,
          responseTime: endTime - startTime,
          url: url,
        });
      });
      
      req.on('timeout', () => {
        const endTime = performance.now();
        req.destroy();
        reject({
          error: 'Request timeout',
          responseTime: endTime - startTime,
          url: url,
        });
      });
      
      req.end();
    });
  }

  /**
   * Test page load performance
   */
  async testPageLoadPerformance() {
    this.log('info', 'Testing page load performance...');
    
    const pages = [
      { path: '/', name: 'Home Page' },
      { path: '/game', name: 'Game Page' },
      { path: '/scores', name: 'Scores Page' },
      { path: '/settings', name: 'Settings Page' },
    ];

    for (const page of pages) {
      try {
        const url = `${this.baseUrl}${page.path}`;
        const result = await this.makeRequest(url);
        
        this.results.loadTime.push({
          page: page.name,
          url: url,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          passed: result.responseTime < this.thresholds.LOAD_TIME_MAX && result.statusCode === 200,
        });
        
        if (result.responseTime < this.thresholds.LOAD_TIME_MAX && result.statusCode === 200) {
          this.log('success', `${page.name}: ${result.responseTime.toFixed(2)}ms ✓`);
        } else {
          this.log('error', `${page.name}: ${result.responseTime.toFixed(2)}ms (>${this.thresholds.LOAD_TIME_MAX}ms) ✗`);
        }
        
      } catch (error) {
        this.results.errors.push({
          test: 'Page Load',
          page: page.name,
          error: error.error || error.message,
        });
        this.log('error', `${page.name}: Failed - ${error.error || error.message}`);
      }
    }
  }

  /**
   * Test API response performance
   */
  async testApiPerformance() {
    this.log('info', 'Testing API response performance...');
    
    const endpoints = [
      { path: '/api/health', method: 'GET', name: 'Health Check' },
      { path: '/api/scores', method: 'GET', name: 'Scores API' },
      { path: '/api/scores/leaderboard', method: 'GET', name: 'Leaderboard API' },
      { path: '/health.txt', method: 'GET', name: 'Health Text' },
    ];

    for (const endpoint of endpoints) {
      try {
        const url = `${this.baseUrl}${endpoint.path}`;
        const result = await this.makeRequest(url, { method: endpoint.method });
        
        this.results.apiResponses.push({
          endpoint: endpoint.name,
          url: url,
          method: endpoint.method,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          passed: result.responseTime < this.thresholds.API_RESPONSE_MAX && result.statusCode < 400,
        });
        
        if (result.responseTime < this.thresholds.API_RESPONSE_MAX && result.statusCode < 400) {
          this.log('success', `${endpoint.name}: ${result.responseTime.toFixed(2)}ms (${result.statusCode}) ✓`);
        } else {
          this.log('error', `${endpoint.name}: ${result.responseTime.toFixed(2)}ms (${result.statusCode}) ✗`);
        }
        
      } catch (error) {
        this.results.errors.push({
          test: 'API Performance',
          endpoint: endpoint.name,
          error: error.error || error.message,
        });
        this.log('error', `${endpoint.name}: Failed - ${error.error || error.message}`);
      }
    }
  }

  /**
   * Test health check functionality
   */
  async testHealthChecks() {
    this.log('info', 'Testing health check functionality...');
    
    const healthEndpoints = [
      { path: '/api/health', method: 'GET', name: 'Health API (GET)' },
      { path: '/api/health', method: 'HEAD', name: 'Health API (HEAD)' },
      { path: '/health.txt', method: 'GET', name: 'Health Text File' },
      { path: '/healthz', method: 'GET', name: 'Health Alias' },
      { path: '/ping', method: 'GET', name: 'Ping Endpoint' },
    ];

    for (const endpoint of healthEndpoints) {
      try {
        const url = `${this.baseUrl}${endpoint.path}`;
        const result = await this.makeRequest(url, { method: endpoint.method });
        
        const isHealthy = result.statusCode >= 200 && result.statusCode < 300;
        
        this.results.healthChecks.push({
          endpoint: endpoint.name,
          url: url,
          method: endpoint.method,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          healthy: isHealthy,
          passed: result.responseTime < this.thresholds.HEALTH_CHECK_MAX && isHealthy,
        });
        
        if (result.responseTime < this.thresholds.HEALTH_CHECK_MAX && isHealthy) {
          this.log('success', `${endpoint.name}: ${result.responseTime.toFixed(2)}ms (${result.statusCode}) ✓`);
        } else {
          this.log('error', `${endpoint.name}: ${result.responseTime.toFixed(2)}ms (${result.statusCode}) ✗`);
        }
        
      } catch (error) {
        this.results.errors.push({
          test: 'Health Check',
          endpoint: endpoint.name,
          error: error.error || error.message,
        });
        this.log('error', `${endpoint.name}: Failed - ${error.error || error.message}`);
      }
    }
  }

  /**
   * Test concurrent user handling
   */
  async testConcurrentUsers() {
    this.log('info', `Testing concurrent user handling (${this.thresholds.CONCURRENT_USERS} users)...`);
    
    const requests = Array.from({ length: this.thresholds.CONCURRENT_USERS }, (_, i) => {
      return this.makeRequest(`${this.baseUrl}/api/health`).then(result => ({
        user: i + 1,
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        success: result.statusCode === 200,
      })).catch(error => ({
        user: i + 1,
        responseTime: error.responseTime || 0,
        statusCode: 0,
        success: false,
        error: error.error || error.message,
      }));
    });

    try {
      const startTime = performance.now();
      const results = await Promise.all(requests);
      const totalTime = performance.now() - startTime;
      
      const successfulRequests = results.filter(r => r.success).length;
      const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      this.results.concurrencyTests.push({
        totalUsers: this.thresholds.CONCURRENT_USERS,
        successfulRequests,
        successRate: (successfulRequests / this.thresholds.CONCURRENT_USERS) * 100,
        averageResponseTime,
        totalTime,
        passed: successfulRequests >= this.thresholds.CONCURRENT_USERS * 0.9, // 90% success rate
      });
      
      this.log('info', `Concurrent test results:`);
      this.log('info', `  Successful requests: ${successfulRequests}/${this.thresholds.CONCURRENT_USERS}`);
      this.log('info', `  Success rate: ${((successfulRequests / this.thresholds.CONCURRENT_USERS) * 100).toFixed(1)}%`);
      this.log('info', `  Average response time: ${averageResponseTime.toFixed(2)}ms`);
      this.log('info', `  Total time: ${totalTime.toFixed(2)}ms`);
      
      if (successfulRequests >= this.thresholds.CONCURRENT_USERS * 0.9) {
        this.log('success', 'Concurrent user test passed ✓');
      } else {
        this.log('error', 'Concurrent user test failed ✗');
      }
      
    } catch (error) {
      this.results.errors.push({
        test: 'Concurrent Users',
        error: error.message,
      });
      this.log('error', `Concurrent user test failed: ${error.message}`);
    }
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      thresholds: this.thresholds,
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errorCount: this.results.errors.length,
      },
      results: this.results,
    };

    // Calculate summary statistics
    const allTests = [
      ...this.results.loadTime,
      ...this.results.apiResponses,
      ...this.results.healthChecks,
      ...this.results.concurrencyTests,
    ];

    report.summary.totalTests = allTests.length;
    report.summary.passedTests = allTests.filter(test => test.passed).length;
    report.summary.failedTests = allTests.filter(test => !test.passed).length;

    return report;
  }

  /**
   * Run all performance tests
   */
  async runAllTests() {
    console.log('🚀 Starting Performance Testing Suite');
    console.log(`Target URL: ${this.baseUrl}\n`);
    
    try {
      await this.testPageLoadPerformance();
      console.log('');
      
      await this.testApiPerformance();
      console.log('');
      
      await this.testHealthChecks();
      console.log('');
      
      await this.testConcurrentUsers();
      console.log('');
      
      const report = this.generateReport();
      
      console.log('📊 Performance Test Summary:');
      console.log(`   Total Tests: ${report.summary.totalTests}`);
      console.log(`   Passed: ${report.summary.passedTests}`);
      console.log(`   Failed: ${report.summary.failedTests}`);
      console.log(`   Errors: ${report.summary.errorCount}`);
      
      const allPassed = report.summary.failedTests === 0 && report.summary.errorCount === 0;
      
      if (allPassed) {
        this.log('success', 'All performance tests passed! 🎉');
        return true;
      } else {
        this.log('error', 'Some performance tests failed! 💥');
        
        if (this.results.errors.length > 0) {
          console.log('\n❌ Errors:');
          this.results.errors.forEach(error => {
            console.log(`   ${error.test}: ${error.error}`);
          });
        }
        
        return false;
      }
      
    } catch (error) {
      this.log('error', `Test suite failed: ${error.message}`);
      return false;
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:3000';
  
  if (!baseUrl) {
    console.error('❌ Error: Please provide a base URL for testing');
    console.log('Usage: node performance-test.js <base-url>');
    console.log('Example: node performance-test.js https://your-app.vercel.app');
    process.exit(1);
  }
  
  const tester = new PerformanceTester(baseUrl);
  const success = await tester.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// Only run main if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Performance testing failed with error:', error.message);
    process.exit(1);
  });
}

module.exports = { PerformanceTester };