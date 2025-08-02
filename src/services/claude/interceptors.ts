/**
 * @fileoverview Built-in interceptors for Claude API proxy
 * @lastmodified 2025-08-01T12:30:00Z
 *
 * Features: Logging, rate limiting, caching, metrics collection
 * Main APIs: createLoggingInterceptor(), createCacheInterceptor()
 * Constraints: Must maintain <50ms overhead
 * Patterns: Middleware pattern, async processing
 */

import type {
  RequestInterceptor,
  ResponseInterceptor,
  ClaudeRequest,
  ClaudeResponse,
} from './types.js';
import { logger } from '../../utils/logger.js';

/**
 * Creates a logging interceptor for requests
 */
export function createRequestLoggingInterceptor(): RequestInterceptor {
  return {
    name: 'request-logger',
    execute: async (request: ClaudeRequest) => {
      logger.info('[Claude Request]', {
        model: request.model,
        messageCount: request.messages.length,
        hasSystem: !!request.system,
        temperature: request.temperature,
        maxTokens: request.max_tokens,
        timestamp: new Date().toISOString(),
      });

      return request;
    },
  };
}

/**
 * Creates a logging interceptor for responses
 */
export function createResponseLoggingInterceptor(): ResponseInterceptor {
  return {
    name: 'response-logger',
    execute: async (response: ClaudeResponse) => {
      if (response.proxyMetrics) {
        logger.info('[Claude Response]', {
          requestId: response.proxyMetrics.requestId,
          latencyMs: response.proxyMetrics.latencyMs,
          overheadMs: response.proxyMetrics.overheadMs,
          tokensUsed: response.proxyMetrics.tokensUsed,
          cost: response.proxyMetrics.cost.toFixed(4),
          timestamp: response.proxyMetrics.timestamp.toISOString(),
        });
      }

      return response;
    },
  };
}

/**
 * Creates a metadata enrichment interceptor
 */
export function createMetadataInterceptor(metadata: Record<string, unknown>): RequestInterceptor {
  return {
    name: 'metadata-enrichment',
    execute: async (request: ClaudeRequest) => {
      return {
        ...request,
        metadata: {
          ...request.metadata,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      };
    },
  };
}

/**
 * Creates a token limit validation interceptor
 */
export function createTokenLimitInterceptor(maxTokens: number): RequestInterceptor {
  return {
    name: 'token-limit',
    execute: async (request: ClaudeRequest) => {
      if (request.max_tokens && request.max_tokens > maxTokens) {
        console.warn(
          `Token limit exceeded: requested ${request.max_tokens}, limiting to ${maxTokens}`
        );

        return {
          ...request,
          max_tokens: maxTokens,
        };
      }

      return request;
    },
  };
}

/**
 * Creates a response validation interceptor
 */
export function createResponseValidationInterceptor(): ResponseInterceptor {
  return {
    name: 'response-validation',
    execute: async (response: ClaudeResponse) => {
      // Validate response structure
      if (!response.id || !response.content || response.content.length === 0) {
        throw new Error('Invalid response structure from Claude API');
      }

      // Check for overhead threshold
      if (response.proxyMetrics && response.proxyMetrics.overheadMs > 50) {
        console.warn(
          `Proxy overhead exceeded 50ms threshold: ${response.proxyMetrics.overheadMs}ms`
        );
      }

      return response;
    },
  };
}

/**
 * Creates a simple in-memory cache interceptor
 * Note: In production, use Redis for distributed caching
 */
export function createSimpleCacheInterceptor(ttlMs: number = 60000): {
  request: RequestInterceptor;
  response: ResponseInterceptor;
} {
  const cache = new Map<string, { response: ClaudeResponse; expiry: number }>();

  const getCacheKey = (request: ClaudeRequest): string => {
    return JSON.stringify({
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
      system: request.system,
    });
  };

  return {
    request: {
      name: 'cache-check',
      execute: async (request: ClaudeRequest) => {
        const key = getCacheKey(request);
        const cached = cache.get(key);

        if (cached && cached.expiry > Date.now()) {
          // Return cached response by throwing a special error
          // that the proxy can catch and handle
          const error = new Error('CACHE_HIT') as Error & { cachedResponse?: unknown };
          error.cachedResponse = {
            ...cached.response,
            proxyMetrics: {
              ...cached.response.proxyMetrics!,
              cacheHit: true,
              overheadMs: 1, // Cache hits are very fast
            },
          };
          throw error;
        }

        return request;
      },
    },
    response: {
      name: 'cache-store',
      execute: async (response: ClaudeResponse) => {
        // Don't cache if there was an error or streaming
        if (response.stop_reason && response.stop_reason === 'stop_sequence') {
          return response;
        }

        // Generate cache key from original request
        // This would need to be passed through context in real implementation
        const key = 'placeholder-key';

        cache.set(key, {
          response,
          expiry: Date.now() + ttlMs,
        });

        // Clean up expired entries periodically
        if (Math.random() < 0.1) {
          // 10% chance
          for (const [k, v] of cache.entries()) {
            if (v.expiry < Date.now()) {
              cache.delete(k);
            }
          }
        }

        return response;
      },
    },
  };
}
