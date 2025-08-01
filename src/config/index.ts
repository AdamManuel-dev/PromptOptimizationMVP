/**
 * @fileoverview Centralized configuration management with environment validation
 * @lastmodified 2025-08-01T10:30:00Z
 *
 * Features: Environment-specific configs, validation, type safety
 * Main APIs: getConfig(), validateConfig(), loadEnvironment()
 * Constraints: Requires dotenv, validates all required env vars
 * Patterns: Singleton pattern, fail-fast on missing config
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Configuration schema
const ConfigSchema = z.object({
  // Application
  env: z.enum(['development', 'staging', 'production', 'test']),
  port: z.number().min(1).max(65535),
  apiVersion: z.string(),

  // Database
  database: z.object({
    url: z.string().url(),
    poolMin: z.number().min(1),
    poolMax: z.number().min(1),
  }),

  // Redis
  redis: z.object({
    url: z.string().url(),
    password: z.string().optional(),
    db: z.number().min(0).max(15),
  }),

  // Vector Database
  vectorDb: z.object({
    type: z.enum(['weaviate', 'qdrant']),
    url: z.string().url(),
    apiKey: z.string().optional(),
  }),

  // Claude API
  claude: z.object({
    apiKey: z.string().min(1),
    apiUrl: z.string().url(),
    apiVersion: z.string(),
    model: z.string(),
    maxRetries: z.number().min(0),
    timeoutMs: z.number().min(1000),
  }),

  // Security
  security: z.object({
    jwtSecret: z.string().min(32),
    jwtExpiry: z.string(),
    encryptionKey: z.string().length(32),
  }),

  // Monitoring
  monitoring: z.object({
    openTelemetryEndpoint: z.string().url().optional(),
    metricsPort: z.number().optional(),
  }),

  // Logging
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug', 'trace']),
    format: z.enum(['json', 'pretty']),
  }),

  // Rate Limiting
  rateLimit: z.object({
    windowMs: z.number().min(1000),
    maxRequests: z.number().min(1),
  }),

  // Feature Flags
  features: z.object({
    webhooks: z.boolean(),
    analytics: z.boolean(),
    patternLibrary: z.boolean(),
    abTesting: z.boolean(),
  }),

  // External Services
  external: z.object({
    webhookSecret: z.string().optional(),
    analyticsApiKey: z.string().optional(),
    sentryDsn: z.string().optional(),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

class ConfigManager {
  private static instance: ConfigManager;
  private config: Config | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  loadEnvironment(env?: Environment): void {
    const environment = env || (process.env.NODE_ENV as Environment) || 'development';

    // Load environment-specific .env file
    const envFile = environment === 'development' ? '.env' : `.env.${environment}`;
    dotenv.config({ path: envFile });

    // Parse and validate configuration
    const rawConfig = {
      env: environment,
      port: parseInt(process.env.PORT || '3000', 10),
      apiVersion: process.env.API_VERSION || 'v1',

      database: {
        url: process.env.DATABASE_URL || '',
        poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
        poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
      },

      redis: {
        url: process.env.REDIS_URL || '',
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
      },

      vectorDb: {
        type: (process.env.QDRANT_URL ? 'qdrant' : 'weaviate') as 'weaviate' | 'qdrant',
        url: process.env.WEAVIATE_URL || process.env.QDRANT_URL || '',
        apiKey: process.env.WEAVIATE_API_KEY || process.env.QDRANT_API_KEY || undefined,
      },

      claude: {
        apiKey: process.env.CLAUDE_API_KEY || '',
        apiUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com',
        apiVersion: process.env.CLAUDE_API_VERSION || '2023-06-01',
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
        maxRetries: parseInt(process.env.CLAUDE_MAX_RETRIES || '3', 10),
        timeoutMs: parseInt(process.env.CLAUDE_TIMEOUT_MS || '30000', 10),
      },

      security: {
        jwtSecret: process.env.JWT_SECRET || '',
        jwtExpiry: process.env.JWT_EXPIRY || '7d',
        encryptionKey: process.env.ENCRYPTION_KEY || '',
      },

      monitoring: {
        openTelemetryEndpoint: process.env.OPENTELEMETRY_ENDPOINT || undefined,
        metricsPort: process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT, 10) : undefined,
      },

      logging: {
        level: (process.env.LOG_LEVEL || 'info') as Config['logging']['level'],
        format: (process.env.LOG_FORMAT || 'json') as Config['logging']['format'],
      },

      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      },

      features: {
        webhooks: process.env.ENABLE_WEBHOOKS === 'true',
        analytics: process.env.ENABLE_ANALYTICS !== 'false',
        patternLibrary: process.env.ENABLE_PATTERN_LIBRARY !== 'false',
        abTesting: process.env.ENABLE_A_B_TESTING !== 'false',
      },

      external: {
        webhookSecret: process.env.WEBHOOK_SECRET || undefined,
        analyticsApiKey: process.env.ANALYTICS_API_KEY || undefined,
        sentryDsn: process.env.SENTRY_DSN || undefined,
      },
    };

    // Validate configuration
    const result = ConfigSchema.safeParse(rawConfig);
    if (!result.success) {
      const errors = result.error.format();
      console.error('Configuration validation failed:', errors);
      throw new Error(`Invalid configuration: ${JSON.stringify(errors)}`);
    }

    this.config = result.data;
  }

  getConfig(): Config {
    if (!this.config) {
      this.loadEnvironment();
    }
    return this.config!;
  }

  isProduction(): boolean {
    return this.getConfig().env === 'production';
  }

  isDevelopment(): boolean {
    return this.getConfig().env === 'development';
  }

  isTest(): boolean {
    return this.getConfig().env === 'test';
  }
}

// Export singleton instance methods
export const configManager = ConfigManager.getInstance();
export const getConfig = () => configManager.getConfig();
export const loadEnvironment = (env?: Environment) => configManager.loadEnvironment(env);
export const isProduction = () => configManager.isProduction();
export const isDevelopment = () => configManager.isDevelopment();
export const isTest = () => configManager.isTest();
