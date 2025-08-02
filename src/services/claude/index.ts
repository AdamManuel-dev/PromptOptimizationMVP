/**
 * @fileoverview Claude API service entry point
 * @lastmodified 2025-08-01T12:45:00Z
 *
 * Features: Service factory, singleton management, default configuration
 * Main APIs: createClaudeProxy(), getDefaultProxy()
 * Constraints: Single instance per API key
 * Patterns: Factory pattern, lazy initialization
 */

import { getConfig, isDevelopment } from '../../config/index.js';
import { ClaudeProxy } from './ClaudeProxy.js';
import type { ClaudeProxyConfig } from './types.js';
import {
  createRequestLoggingInterceptor,
  createResponseLoggingInterceptor,
  createResponseValidationInterceptor,
  createTokenLimitInterceptor,
} from './interceptors.js';

let defaultProxy: ClaudeProxy | null = null;

/**
 * Creates a new Claude proxy instance with the given configuration
 */
export function createClaudeProxy(config?: Partial<ClaudeProxyConfig>): ClaudeProxy {
  const appConfig = getConfig();

  const proxyConfig: ClaudeProxyConfig = {
    apiKey: config?.apiKey || appConfig.claude.apiKey,
    apiUrl: config?.apiUrl || appConfig.claude.apiUrl,
    apiVersion: config?.apiVersion || appConfig.claude.apiVersion,
    model: config?.model || appConfig.claude.model,
    maxRetries: config?.maxRetries || appConfig.claude.maxRetries,
    timeoutMs: config?.timeoutMs || appConfig.claude.timeoutMs,
    enableMetrics: config?.enableMetrics ?? true,
  };

  const proxy = new ClaudeProxy(proxyConfig);

  // Add default interceptors
  if (isDevelopment()) {
    proxy.addRequestInterceptor(createRequestLoggingInterceptor());
    proxy.addResponseInterceptor(createResponseLoggingInterceptor());
  }

  // Always add validation
  proxy.addResponseInterceptor(createResponseValidationInterceptor());

  // Add token limit based on model
  const tokenLimit = getTokenLimitForModel(proxyConfig.model!);
  proxy.addRequestInterceptor(createTokenLimitInterceptor(tokenLimit));

  return proxy;
}

/**
 * Gets the default Claude proxy instance (singleton)
 */
export function getDefaultProxy(): ClaudeProxy {
  if (!defaultProxy) {
    defaultProxy = createClaudeProxy();
  }
  return defaultProxy;
}

/**
 * Resets the default proxy instance
 */
export function resetDefaultProxy(): void {
  defaultProxy = null;
}

/**
 * Gets the token limit for a given model
 */
function getTokenLimitForModel(model: string): number {
  const limits: Record<string, number> = {
    'claude-3-opus-20240229': 4096,
    'claude-3-sonnet-20240229': 4096,
    'claude-3-haiku-20240307': 4096,
    'claude-2.1': 100000,
    'claude-2.0': 100000,
  };

  return limits[model] || 4096;
}

// Re-export types and classes
export { ClaudeProxy } from './ClaudeProxy.js';
export type {
  ClaudeProxyConfig,
  ClaudeRequest,
  ClaudeResponse,
  ProxyMetrics,
  RequestInterceptor,
  ResponseInterceptor,
  ProxyError,
} from './types.js';
export {
  createRequestLoggingInterceptor,
  createResponseLoggingInterceptor,
  createMetadataInterceptor,
  createTokenLimitInterceptor,
  createResponseValidationInterceptor,
  createSimpleCacheInterceptor,
} from './interceptors.js';
