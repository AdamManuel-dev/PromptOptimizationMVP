/**
 * @fileoverview Application entry point
 * @lastmodified 2025-08-01T11:15:00Z
 *
 * Features: Server startup, environment loading, graceful shutdown
 * Main APIs: Main application entry, process handlers
 * Constraints: Requires environment configuration, database connection
 * Patterns: Async startup, error handling, signal handling
 */

import { loadEnvironment } from './config/index.js';
import { startServer } from './server/index.js';

async function main() {
  try {
    // Load environment configuration
    loadEnvironment();

    // Start the server
    await startServer();

    console.log('Application started successfully');
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
main();
