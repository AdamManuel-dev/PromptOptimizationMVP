/**
 * @fileoverview Simple logger utility for application logging
 * @lastmodified 2025-08-02T00:00:00Z
 *
 * Features: Info/warn/error logging with timestamps
 * Main APIs: logger.info(), logger.warn(), logger.error()
 * Constraints: Uses console methods internally
 * Patterns: Singleton instance, timestamp prefixes
 */

export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

class ConsoleLogger implements Logger {
  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  info(message: string, ...args: unknown[]): void {
    // Using console methods allowed by ESLint
    console.warn(this.formatMessage('INFO', message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('ERROR', message), ...args);
  }
}

export const logger: Logger = new ConsoleLogger();
