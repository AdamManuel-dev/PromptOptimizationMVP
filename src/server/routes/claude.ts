/**
 * @fileoverview Claude API proxy routes
 * @lastmodified 2025-08-01T13:00:00Z
 *
 * Features: Message endpoint, streaming endpoint, metrics endpoint
 * Main APIs: POST /claude/message, GET /claude/metrics
 * Constraints: Rate limiting, authentication required
 * Patterns: Express router, async error handling
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getDefaultProxy } from '../../services/claude/index.js';
import type { ClaudeRequest } from '../../services/claude/types.js';
import { logger } from '../../utils/logger.js';

const router = Router();

/**
 * Send a message to Claude
 * POST /api/v1/claude/message
 */
router.post('/message', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request: ClaudeRequest = req.body;

    // Validate request
    if (!request.messages || request.messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Messages array is required',
      });
    }

    // Get proxy instance
    const proxy = getDefaultProxy();

    // Send message
    const startTime = Date.now();
    const response = await proxy.sendMessage(request);
    const totalTime = Date.now() - startTime;

    // Log request for analytics
    logger.info(`Claude request completed in ${totalTime}ms`);

    // Return response
    res.json({
      success: true,
      data: response,
      timing: {
        totalMs: totalTime,
        proxyOverheadMs: response.proxyMetrics?.overheadMs,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get proxy metrics
 * GET /api/v1/claude/metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  const proxy = getDefaultProxy();
  const metrics = proxy.getMetrics();

  res.json({
    success: true,
    data: {
      ...metrics,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Health check for Claude API
 * GET /api/v1/claude/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const proxy = getDefaultProxy();

    // Send a minimal test message
    const testRequest: ClaudeRequest = {
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    };

    const startTime = Date.now();
    await proxy.sendMessage(testRequest);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      status: 'healthy',
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
