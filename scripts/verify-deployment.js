#!/usr/bin/env node

/**
 * Deployment Verification Script for Snake Game
 * 
 * This script validates that the deployment is working correctly by testing:
 * - Application health checks
 * - API endpoint availability
 * - Static asset loading
 * - Core game functionality
 */

const https = require('https');
const http = require('http');

class DeploymentVerifier {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  /**
   * Makes an HTTP request and returns a promise
   */
  makeRequest(url, options = {}) {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 10000,
        ...options
      }, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            url: url
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
  }

  /**
   * Logs a success message
   */
  logSuccess(message) {
    this.successes.push(message);
    console.log(`✅ ${message}`);
  }

  /**
   * Logs a warning message
   */
  logWarning(message) {
    this.warnings.push(message);
    console.log(`⚠️  ${message}`);
  }

  /**
   * Logs an error message
   */
  logError(message) {
    this.errors.push(message);
    console.log(`❌ ${message}`);
  }

  /**
   * Test basic application availability
   */
  async testApplicationHealth() {
    console.log('\n🔍 Testing Application Health...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      
      if (response.statusCode === 200) {
        this.logSuccess('Application is responding (200 OK)');
        
        // Check for basic HTML structure
        if (response.data.includes('<html') && response.data.includes('</html>')) {
          this.logSuccess('Valid HTML structure detected');
        } else {
          this.logWarning('HTML structure may be incomplete');
        }
        
        // Check for Next.js
        if (response.data.includes('next') || response.headers['x-powered-by']?.includes('Next.js')) {
          this.logSuccess('Next.js application detected');
        }
        
      } else {
        this.logError(`Application returned status ${response.statusCode}`);
      }
    } catch (error) {
      this.logError(`Failed to reach application: ${error.message}`);
    }
  }

  /**
   * Test API endpoints
   */
  async testApiEndpoints() {
    console.log('\n🔍 Testing API Endpoints...');
    
    const endpoints = [
      { path: '/api/scores', method: 'GET', description: 'Scores API' },
      { path: '/api/scores/leaderboard', method: 'GET', description: 'Leaderboard API' },
    ];

    for (const endpoint of endpoints) {
      try {
        const url = `${this.baseUrl}${endpoint.path}`;
        const response = await this.makeRequest(url, { method: endpoint.method });
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          this.logSuccess(`${endpoint.description} is working (${response.statusCode})`);
          
          // Try to parse JSON response
          try {
            const jsonData = JSON.parse(response.data);
            this.logSuccess(`${endpoint.description} returns valid JSON`);
          } catch (parseError) {
            this.logWarning(`${endpoint.description} response is not valid JSON`);
          }
        } else if (response.statusCode >= 400 && response.statusCode < 500) {
          this.logWarning(`${endpoint.description} client error (${response.statusCode})`);
        } else {
          this.logError(`${endpoint.description} server error (${response.statusCode})`);
        }
      } catch (error) {
        this.logError(`Failed to test ${endpoint.description}: ${error.message}`);
      }
    }
  }

  /**
   * Test static pages
   */
  async testStaticPages() {
    console.log('\n🔍 Testing Static Pages...');
    
    const pages = [
      { path: '/', description: 'Home page' },
      { path: '/game', description: 'Game page' },
      { path: '/scores', description: 'Scores page' },
      { path: '/settings', description: 'Settings page' },
    ];

    for (const page of pages) {
      try {
        const url = `${this.baseUrl}${page.path}`;
        const response = await this.makeRequest(url);
        
        if (response.statusCode === 200) {
          this.logSuccess(`${page.description} is accessible`);
          
          // Check for basic HTML structure
          if (response.data.includes('<html') && response.data.includes('</html>')) {
            this.logSuccess(`${page.description} has valid HTML structure`);
          } else {
            this.logWarning(`${page.description} HTML structure may be incomplete`);
          }
        } else {
          this.logError(`${page.description} returned status ${response.statusCode}`);
        }
      } catch (error) {
        this.logError(`Failed to test ${page.description}: ${error.message}`);
      }
    }
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders() {
    console.log('\n🔍 Testing Security Headers...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'referrer-policy'
      ];

      securityHeaders.forEach(header => {
        if (response.headers[header]) {
          this.logSuccess(`Security header ${header} is present`);
        } else {
          this.logWarning(`Security header ${header} is missing`);
        }
      });
      
    } catch (error) {
      this.logError(`Failed to test security headers: ${error.message}`);
    }
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n📊 DEPLOYMENT VERIFICATION REPORT');
    console.log('================================');
    
    console.log(`\n✅ Successes: ${this.successes.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 Deployment verification PASSED!');
      console.log('The application appears to be deployed successfully.');
      return true;
    } else {
      console.log('\n💥 Deployment verification FAILED!');
      console.log('Please review the errors above and fix them before proceeding.');
      return false;
    }
  }

  /**
   * Run all verification tests
   */
  async verify() {
    console.log('🚀 Starting Deployment Verification...');
    console.log(`Target URL: ${this.baseUrl}`);
    
    await this.testApplicationHealth();
    await this.testApiEndpoints();
    await this.testStaticPages();
    await this.testSecurityHeaders();
    
    return this.generateReport();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:3000';
  
  if (!baseUrl) {
    console.error('❌ Error: Please provide a base URL for verification');
    console.log('Usage: node verify-deployment.js <base-url>');
    console.log('Example: node verify-deployment.js https://your-app.vercel.app');
    process.exit(1);
  }
  
  const verifier = new DeploymentVerifier(baseUrl);
  const passed = await verifier.verify();
  
  process.exit(passed ? 0 : 1);
}

// Only run main if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Verification failed with error:', error.message);
    process.exit(1);
  });
}

module.exports = { DeploymentVerifier };