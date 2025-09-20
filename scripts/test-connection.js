#!/usr/bin/env node

/**
 * Database Connection Testing Script
 * 
 * This script tests database connectivity and performance for both
 * development (local MongoDB) and production (MongoDB Atlas) environments.
 */

const { performance } = require('perf_hooks');

class ConnectionTester {
  constructor() {
    this.testResults = {
      connection: null,
      operations: [],
      performance: {},
      errors: []
    };
  }

  /**
   * Log with timestamp
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️ ',
      success: '✅',
      warning: '⚠️ ',
      error: '❌'
    }[level] || '';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  /**
   * Measure operation performance
   */
  async measureOperation(name, operation) {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      this.testResults.operations.push({
        name,
        duration,
        success: true,
        timestamp: new Date()
      });
      
      this.log('success', `${name} completed in ${duration.toFixed(2)}ms`);
      return { success: true, duration, result };
    } catch (error) {
      const duration = performance.now() - start;
      
      this.testResults.operations.push({
        name,
        duration,
        success: false,
        error: error.message,
        timestamp: new Date()
      });
      
      this.log('error', `${name} failed after ${duration.toFixed(2)}ms: ${error.message}`);
      this.testResults.errors.push({ operation: name, error: error.message });
      return { success: false, duration, error };
    }
  }

  /**
   * Test basic database connection
   */
  async testConnection() {
    this.log('info', 'Testing database connection...');
    
    return await this.measureOperation('Database Connection', async () => {
      const mongoose = require('mongoose');
      
      const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
      if (!uri) {
        throw new Error('No MongoDB URI found in environment variables');
      }

      // Determine connection type
      const isAtlas = uri.includes('mongodb+srv://') || uri.includes('.mongodb.net');
      const environment = isAtlas ? 'Atlas (Production)' : 'Local (Development)';
      
      this.log('info', `Connecting to ${environment}: ${uri.replace(/\/\/.*@/, '//***:***@')}`);

      // Connection options
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
        family: 4
      };

      if (isAtlas) {
        options.retryWrites = true;
        options.w = 'majority';
      }

      await mongoose.connect(uri, options);
      
      const connection = mongoose.connection;
      this.testResults.connection = {
        state: connection.readyState,
        host: connection.host,
        port: connection.port,
        name: connection.name,
        environment
      };

      return connection;
    });
  }

  /**
   * Test score collection operations
   */
  async testScoreOperations() {
    this.log('info', 'Testing score collection operations...');
    
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const scoresCollection = db.collection('scores');

    // Test document
    const testScore = {
      playerName: `test_player_${Date.now()}`,
      score: Math.floor(Math.random() * 10000),
      timestamp: new Date(),
      gameMetrics: {
        duration: 120,
        level: 5,
        combo: 3
      },
      _testDocument: true // Mark as test for cleanup
    };

    // Test Insert Operation
    const insertResult = await this.measureOperation('Score Insert', async () => {
      return await scoresCollection.insertOne(testScore);
    });

    if (!insertResult.success) return false;

    const insertedId = insertResult.result.insertedId;

    // Test Read Operation
    const readResult = await this.measureOperation('Score Read', async () => {
      return await scoresCollection.findOne({ _id: insertedId });
    });

    // Test Query with Index
    await this.measureOperation('Score Query (Top 10)', async () => {
      return await scoresCollection.find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();
    });

    // Test Player-specific Query
    await this.measureOperation('Player Score Query', async () => {
      return await scoresCollection.find({ 
        playerName: testScore.playerName 
      }).toArray();
    });

    // Test Update Operation
    await this.measureOperation('Score Update', async () => {
      return await scoresCollection.updateOne(
        { _id: insertedId },
        { $set: { verified: true } }
      );
    });

    // Test Aggregation (Leaderboard)
    await this.measureOperation('Leaderboard Aggregation', async () => {
      return await scoresCollection.aggregate([
        { $match: { score: { $gt: 0 } } },
        { $sort: { score: -1 } },
        { $limit: 10 },
        { $project: { playerName: 1, score: 1, timestamp: 1 } }
      ]).toArray();
    });

    // Cleanup test document
    await this.measureOperation('Test Cleanup', async () => {
      return await scoresCollection.deleteOne({ _id: insertedId });
    });

    return true;
  }

  /**
   * Test connection pooling and concurrent operations
   */
  async testConcurrentOperations() {
    this.log('info', 'Testing concurrent operations...');
    
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const testCollection = db.collection('connection_test');

    const concurrentOperations = Array.from({ length: 5 }, (_, i) => {
      return this.measureOperation(`Concurrent Op ${i + 1}`, async () => {
        const doc = { 
          test: true, 
          index: i, 
          timestamp: new Date(),
          _testDocument: true
        };
        
        const result = await testCollection.insertOne(doc);
        await testCollection.findOne({ _id: result.insertedId });
        await testCollection.deleteOne({ _id: result.insertedId });
        
        return result;
      });
    });

    const results = await Promise.all(concurrentOperations);
    const successCount = results.filter(r => r.success).length;
    
    this.log('info', `Concurrent operations: ${successCount}/${results.length} successful`);
    return successCount === results.length;
  }

  /**
   * Test performance requirements
   */
  validatePerformance() {
    this.log('info', 'Validating performance requirements...');
    
    const criticalOperations = [
      'Score Insert',
      'Score Read', 
      'Score Query (Top 10)',
      'Leaderboard Aggregation'
    ];

    const performanceResults = {};
    let allPassed = true;

    criticalOperations.forEach(opName => {
      const operation = this.testResults.operations.find(op => op.name === opName);
      if (operation) {
        const passed = operation.duration < 2000 && operation.success;
        performanceResults[opName] = {
          duration: operation.duration,
          requirement: '< 2000ms',
          passed
        };
        
        if (passed) {
          this.log('success', `${opName}: ${operation.duration.toFixed(2)}ms ✓`);
        } else {
          this.log('error', `${opName}: ${operation.duration.toFixed(2)}ms ✗ (requirement: < 2000ms)`);
          allPassed = false;
        }
      }
    });

    this.testResults.performance = performanceResults;
    return allPassed;
  }

  /**
   * Generate test report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      connection: this.testResults.connection,
      summary: {
        totalOperations: this.testResults.operations.length,
        successfulOperations: this.testResults.operations.filter(op => op.success).length,
        totalErrors: this.testResults.errors.length,
        averageResponseTime: this.testResults.operations
          .filter(op => op.success)
          .reduce((sum, op) => sum + op.duration, 0) / 
          this.testResults.operations.filter(op => op.success).length
      },
      operations: this.testResults.operations,
      performance: this.testResults.performance,
      errors: this.testResults.errors
    };

    return report;
  }

  /**
   * Run all connection tests
   */
  async runAllTests() {
    console.log('🧪 Database Connection Testing Suite\n');
    
    try {
      // Test connection
      const connectionResult = await this.testConnection();
      if (!connectionResult.success) {
        this.log('error', 'Connection test failed, aborting remaining tests');
        return false;
      }

      // Test score operations
      await this.testScoreOperations();

      // Test concurrent operations
      await this.testConcurrentOperations();

      // Validate performance
      const performancePassed = this.validatePerformance();

      // Disconnect
      await this.measureOperation('Database Disconnect', async () => {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
      });

      // Generate and display report
      const report = this.generateReport();
      
      console.log('\n📊 Test Report Summary:');
      console.log(`   Total Operations: ${report.summary.totalOperations}`);
      console.log(`   Successful: ${report.summary.successfulOperations}`);
      console.log(`   Errors: ${report.summary.totalErrors}`);
      console.log(`   Average Response Time: ${report.summary.averageResponseTime.toFixed(2)}ms`);

      if (this.testResults.errors.length === 0 && performancePassed) {
        this.log('success', 'All database tests passed!');
        return true;
      } else {
        this.log('error', 'Some database tests failed!');
        return false;
      }

    } catch (error) {
      this.log('error', `Test suite failed: ${error.message}`);
      return false;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ConnectionTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed with error:', error.message);
      process.exit(1);
    });
}

module.exports = { ConnectionTester };