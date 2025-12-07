import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  loadEnvironment,
  getConfig,
  isDevelopment,
  isProduction,
  isTest,
} from '../src/config/index.js';

describe('Configuration Management', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Loading', () => {
    it('should load development configuration by default', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.WEAVIATE_URL = 'http://localhost:8080';
      process.env.CLAUDE_API_KEY = 'test-key';
      process.env.JWT_SECRET = 'test-secret-key-that-is-32-chars!';
      process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

      loadEnvironment();
      const config = getConfig();

      expect(config.env).toBe('development');
      expect(config.port).toBe(3000);
      expect(config.database.url).toBe('postgresql://localhost:5432/test');
    });

    it('should detect environment correctly', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.WEAVIATE_URL = 'http://localhost:8080';
      process.env.CLAUDE_API_KEY = 'test-key';
      process.env.JWT_SECRET = 'test-secret-key-that-is-32-chars!';
      process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

      loadEnvironment('production');

      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isTest()).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error on missing required fields', () => {
      process.env = {}; // Clear all env vars

      expect(() => loadEnvironment()).toThrow('Invalid configuration');
    });

    it('should use default values for optional fields', () => {
      process.env.NODE_ENV = 'test';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.WEAVIATE_URL = 'http://localhost:8080';
      process.env.CLAUDE_API_KEY = 'test-key';
      process.env.JWT_SECRET = 'test-secret-key-that-is-32-chars!';
      process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

      loadEnvironment();
      const config = getConfig();

      expect(config.features.analytics).toBe(true); // Default true
      expect(config.external.webhookSecret).toBeUndefined(); // Optional
    });
  });
});
