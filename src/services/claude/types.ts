/**
 * @fileoverview Claude API service types and interfaces
 * @lastmodified 2025-08-01T12:00:00Z
 *
 * Features: Type definitions for Claude API proxy service
 * Main APIs: Request/response types, configuration, metrics
 * Constraints: Must match Anthropic SDK types
 * Patterns: Extensible interfaces, strict typing
 */

import type { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages.js';

export interface ClaudeProxyConfig {
  apiKey: string;
  apiUrl?: string;
  apiVersion?: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
  enableMetrics?: boolean;
}

export interface ClaudeRequest {
  messages: MessageParam[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
  metadata?: Record<string, unknown>;
  stream?: boolean;
}

export interface ClaudeResponse extends Message {
  proxyMetrics?: ProxyMetrics;
}

export interface ProxyMetrics {
  requestId: string;
  timestamp: Date;
  latencyMs: number;
  overheadMs: number;
  tokensUsed: number;
  cost: number;
  cacheHit: boolean;
  retryCount: number;
}

export interface RetryOptions {
  retries: number;
  factor: number;
  minTimeout: number;
  maxTimeout: number;
  onFailedAttempt?: (error: Error) => void;
}

export interface RequestInterceptor {
  name: string;
  execute: (request: ClaudeRequest) => Promise<ClaudeRequest>;
}

export interface ResponseInterceptor {
  name: string;
  execute: (response: ClaudeResponse) => Promise<ClaudeResponse>;
}

export interface ProxyError extends Error {
  statusCode?: number;
  requestId?: string;
  retryable?: boolean;
}
