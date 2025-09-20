#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Script for Snake Game Production
 * 
 * This script helps set up and configure MongoDB Atlas cluster for production deployment.
 * It provides guidance and validation for Atlas configuration.
 */

const https = require('https');
const { URL } = require('url');

class AtlasSetupHelper {
  constructor() {
    this.requiredEnvVars = [
      'MONGODB_URI',
      'MONGODB_DB',
      'NODE_ENV'
    ];
  }

  /**
   * Log informational message
   */
  logInfo(message) {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Log success message
   */
  logSuccess(message) {
    console.log(`✅ ${message}`);
  }

  /**
   * Log warning message
   */
  logWarning(message) {
    console.log(`⚠️  ${message}`);
  }

  /**
   * Log error message
   */
  logError(message) {
    console.log(`❌ ${message}`);
  }

  /**
   * Validate MongoDB URI format
   */
  validateMongoURI(uri) {
    try {
      const url = new URL(uri);
      
      // Check if it's a MongoDB URI
      if (!url.protocol.startsWith('mongodb')) {
        throw new Error('URI must start with mongodb:// or mongodb+srv://');
      }

      // Check for Atlas-specific format
      if (uri.includes('mongodb+srv://')) {
        if (!uri.includes('.mongodb.net')) {
          this.logWarning('URI appears to be SRV format but not pointing to MongoDB Atlas');
        } else {
          this.logSuccess('Valid MongoDB Atlas SRV URI detected');
        }
      }

      // Check for required parameters
      const requiredParams = ['retryWrites', 'w'];
      const urlParams = new URLSearchParams(url.search);
      
      requiredParams.forEach(param => {
        if (!urlParams.has(param)) {
          this.logWarning(`Missing recommended parameter: ${param}`);
        }
      });

      return true;
    } catch (error) {
      this.logError(`Invalid MongoDB URI: ${error.message}`);
      return false;
    }
  }

  /**
   * Check environment variables
   */
  checkEnvironmentVariables() {
    this.logInfo('Checking environment variables...');
    
    const missing = [];
    const present = [];

    this.requiredEnvVars.forEach(varName => {
      if (process.env[varName]) {
        present.push(varName);
        this.logSuccess(`${varName} is set`);
      } else {
        missing.push(varName);
        this.logError(`${varName} is missing`);
      }
    });

    if (missing.length > 0) {
      this.logError(`Missing required environment variables: ${missing.join(', ')}`);
      return false;
    }

    // Validate MongoDB URI if present
    if (process.env.MONGODB_URI) {
      return this.validateMongoURI(process.env.MONGODB_URI);
    }

    return true;
  }

  /**
   * Test database connection
   */
  async testConnection() {
    this.logInfo('Testing database connection...');
    
    try {
      // Import mongoose dynamically to avoid issues if not installed
      const mongoose = require('mongoose');
      
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI not set');
      }

      // Connection options optimized for Atlas
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // IPv4
        retryWrites: true,
        w: 'majority'
      };

      this.logInfo('Connecting to MongoDB Atlas...');
      const startTime = Date.now();
      
      await mongoose.connect(uri, options);
      
      const connectionTime = Date.now() - startTime;
      this.logSuccess(`Connected successfully in ${connectionTime}ms`);

      // Test basic operations
      const testCollectionName = 'connection_test';
      const db = mongoose.connection.db;
      
      // Create a test document
      const testDoc = { 
        test: true, 
        timestamp: new Date(), 
        connectionTest: 'atlas-setup-script' 
      };
      
      const insertStartTime = Date.now();
      const result = await db.collection(testCollectionName).insertOne(testDoc);
      const insertTime = Date.now() - insertStartTime;
      
      this.logSuccess(`Test document inserted in ${insertTime}ms`);

      // Read the test document back
      const readStartTime = Date.now();
      const retrieved = await db.collection(testCollectionName).findOne({ _id: result.insertedId });
      const readTime = Date.now() - readStartTime;
      
      this.logSuccess(`Test document retrieved in ${readTime}ms`);

      // Clean up test document
      await db.collection(testCollectionName).deleteOne({ _id: result.insertedId });
      this.logInfo('Test document cleaned up');

      // Performance check
      const totalOperationTime = insertTime + readTime;
      if (totalOperationTime < 2000) {
        this.logSuccess(`Performance check passed: ${totalOperationTime}ms < 2000ms`);
      } else {
        this.logWarning(`Performance check marginal: ${totalOperationTime}ms >= 2000ms`);
      }

      await mongoose.disconnect();
      this.logSuccess('Disconnected successfully');

      return true;
    } catch (error) {
      this.logError(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate Atlas configuration recommendations
   */
  generateRecommendations() {
    this.logInfo('MongoDB Atlas Configuration Recommendations:');
    console.log('\n📋 Atlas Cluster Setup:');
    console.log('   • Cluster Name: snake-game-prod');
    console.log('   • Tier: M0 (Free tier for MVP)');
    console.log('   • Region: us-east-1 (closest to Vercel)');
    console.log('   • MongoDB Version: 6.0 or later');
    
    console.log('\n🔒 Security Configuration:');
    console.log('   • Enable authentication');
    console.log('   • Create dedicated database user: snake_app_user');
    console.log('   • Grant readWrite permissions to snake-game database only');
    console.log('   • Add IP whitelist: 0.0.0.0/0 (for Vercel) or specific IPs');
    
    console.log('\n⚡ Performance Settings:');
    console.log('   • Enable connection pooling (maxPoolSize: 10)');
    console.log('   • Set appropriate timeouts (serverSelection: 5s, socket: 45s)');
    console.log('   • Use retryWrites=true for reliability');
    
    console.log('\n📊 Monitoring:');
    console.log('   • Enable Atlas monitoring');
    console.log('   • Set up alerts for connection issues');
    console.log('   • Monitor query performance');
    
    console.log('\n🌐 Vercel Environment Variables:');
    console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snake-game?retryWrites=true&w=majority');
    console.log('   MONGODB_DB=snake-game');
    console.log('   NODE_ENV=production');
  }

  /**
   * Run complete setup validation
   */
  async runSetup() {
    console.log('🚀 MongoDB Atlas Setup for Snake Game\n');
    
    let allPassed = true;

    // Check environment variables
    if (!this.checkEnvironmentVariables()) {
      allPassed = false;
    }

    console.log('');

    // Test connection if environment is properly set
    if (process.env.MONGODB_URI) {
      if (!await this.testConnection()) {
        allPassed = false;
      }
    } else {
      this.logWarning('Skipping connection test - MONGODB_URI not set');
    }

    console.log('');

    // Generate recommendations
    this.generateRecommendations();

    console.log('\n📝 Setup Status:');
    if (allPassed) {
      this.logSuccess('MongoDB Atlas setup validation passed!');
      console.log('   Your database is ready for production deployment.');
    } else {
      this.logError('MongoDB Atlas setup validation failed!');
      console.log('   Please address the issues above before deploying to production.');
    }

    return allPassed;
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new AtlasSetupHelper();
  setup.runSetup()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Setup failed with error:', error.message);
      process.exit(1);
    });
}

module.exports = { AtlasSetupHelper };