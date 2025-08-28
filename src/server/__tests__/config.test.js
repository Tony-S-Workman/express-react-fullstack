import dotenv from 'dotenv';
import path from 'path';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock path
jest.mock('path', () => ({
  resolve: jest.fn()
}));

// Import after mocking
import config from '../config';

describe('Configuration Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset process.env
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.MONGODB_URI;
    delete process.env.CORS_ORIGIN;
    delete process.env.SESSION_SECRET;
    delete process.env.JWT_SECRET;
  });

  describe('Environment Loading', () => {
    it('should load environment file based on NODE_ENV', () => {
      process.env.NODE_ENV = 'test';
      path.resolve.mockReturnValue('/test/path/env.test');
      
      // Re-import to trigger the loading
      jest.resetModules();
      require('../config');
      
      expect(dotenv.config).toHaveBeenCalledWith({ path: '/test/path/env.test' });
    });

    it('should fallback to .env file if environment file not found', () => {
      dotenv.config.mockImplementationOnce(() => { throw new Error('File not found'); });
      
      jest.resetModules();
      require('../config');
      
      expect(dotenv.config).toHaveBeenCalledTimes(2);
    });
  });

  describe('Default Values', () => {
    it('should provide default values when environment variables are not set', () => {
      const testConfig = require('../config').default;
      
      expect(testConfig.NODE_ENV).toBe('development');
      expect(testConfig.PORT).toBe(7777);
      expect(testConfig.MONGODB_URI).toBe('mongodb://localhost:27017/organizer');
      expect(testConfig.CORS_ORIGIN).toBe('http://localhost:8080');
      expect(testConfig.LOG_LEVEL).toBe('info');
    });

    it('should use environment variables when provided', () => {
      // Set environment variables before importing
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.MONGODB_URI = 'mongodb://test:27017/testdb';
      process.env.CORS_ORIGIN = 'https://test.com';
      process.env.LOG_LEVEL = 'debug';
      
      // Reset modules to reload config with new env vars
      jest.resetModules();
      const testConfig = require('../config').default;
      
      expect(testConfig.NODE_ENV).toBe('production');
      expect(testConfig.PORT).toBe(3000);
      expect(testConfig.MONGODB_URI).toBe('mongodb://test:27017/testdb');
      expect(testConfig.CORS_ORIGIN).toBe('https://test.com');
      expect(testConfig.LOG_LEVEL).toBe('debug');
    });
  });

  describe('Type Conversion', () => {
    it('should convert PORT to integer', () => {
      process.env.PORT = '8080';
      
      jest.resetModules();
      const testConfig = require('../config').default;
      expect(testConfig.PORT).toBe(8080);
      expect(typeof testConfig.PORT).toBe('number');
    });

    it('should convert boolean values correctly', () => {
      process.env.ENABLE_LOGGING = 'false';
      process.env.ENABLE_METRICS = 'true';
      
      jest.resetModules();
      const testConfig = require('../config').default;
      expect(testConfig.ENABLE_LOGGING).toBe(false);
      expect(testConfig.ENABLE_METRICS).toBe(true);
    });

    it('should handle undefined boolean values', () => {
      const testConfig = require('../config').default;
      expect(testConfig.ENABLE_LOGGING).toBe(true); // default behavior
      expect(testConfig.ENABLE_METRICS).toBe(false); // default behavior
    });
  });

  describe('Validation', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should warn about missing required fields', () => {
      require('../config');
      
      expect(consoleSpy).toHaveBeenCalledWith('Warning: MONGODB_URI is not set. Using default value.');
      expect(consoleSpy).toHaveBeenCalledWith('Warning: SESSION_SECRET is not set. Using default value.');
      expect(consoleSpy).toHaveBeenCalledWith('Warning: JWT_SECRET is not set. Using default value.');
    });

    it('should not warn when required fields are provided', () => {
      process.env.MONGODB_URI = 'mongodb://test:27017/testdb';
      process.env.SESSION_SECRET = 'test-secret';
      process.env.JWT_SECRET = 'test-jwt-secret';
      
      require('../config');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
