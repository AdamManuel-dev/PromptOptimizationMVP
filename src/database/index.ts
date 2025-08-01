/**
 * @fileoverview Database connection and pool management
 * @lastmodified 2025-08-01T10:45:00Z
 *
 * Features: Connection pooling, query helpers, transaction support
 * Main APIs: getPool(), query(), transaction(), healthCheck()
 * Constraints: Requires PostgreSQL 15+, connection pool limits
 * Patterns: Singleton pool, automatic reconnection, query logging
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { getConfig, isDevelopment } from '../config/index.js';

export interface QueryOptions {
  client?: PoolClient;
  logQuery?: boolean;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: Pool | null = null;
  private isShuttingDown = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.pool) {
      return;
    }

    const config = getConfig();

    this.pool = new Pool({
      connectionString: config.database.url,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });

    // Test the connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Database connection established');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const { client, logQuery = false } = options || {};

    if (logQuery || isDevelopment()) {
      console.log('Query:', text, params);
    }

    const startTime = Date.now();

    try {
      const result = client
        ? await client.query<T>(text, params)
        : await this.getPool().query<T>(text, params);

      const duration = Date.now() - startTime;

      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, text);
      }

      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPool().connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0]?.health === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown || !this.pool) {
      return;
    }

    this.isShuttingDown = true;
    console.log('Shutting down database connection pool...');

    try {
      await this.pool.end();
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error shutting down database pool:', error);
    } finally {
      this.pool = null;
      this.isShuttingDown = false;
    }
  }
}

// Export singleton instance methods
export const db = DatabaseManager.getInstance();
export const initializeDatabase = () => db.initialize();
export const query = <T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  options?: QueryOptions
) => db.query<T>(text, params, options);
export const transaction = <T>(callback: (client: PoolClient) => Promise<T>) =>
  db.transaction(callback);
export const healthCheck = () => db.healthCheck();
export const shutdownDatabase = () => db.shutdown();

// Export types
export type { Pool, PoolClient, QueryResult } from 'pg';
