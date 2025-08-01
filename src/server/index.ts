/**
 * @fileoverview Express server setup with middleware and routes
 * @lastmodified 2025-08-01T11:00:00Z
 *
 * Features: Express server, middleware stack, health checks, graceful shutdown
 * Main APIs: createServer(), startServer(), shutdownServer()
 * Constraints: Requires all middleware deps, port configuration
 * Patterns: Middleware pipeline, error handling, async startup
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import { getConfig, isDevelopment } from '../config/index.js';
import { initializeDatabase, healthCheck, shutdownDatabase } from '../database/index.js';

// Import routers (to be created)
// import { promptRouter } from './routes/prompts.js';
// import { analysisRouter } from './routes/analysis.js';
// import { optimizationRouter } from './routes/optimization.js';
// import { experimentRouter } from './routes/experiments.js';

export interface ServerOptions {
  port?: number;
  host?: string;
}

class Server {
  private app: Application;
  private server: any;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    const config = getConfig();

    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: isDevelopment() ? false : undefined,
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: isDevelopment() ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
        credentials: true,
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(bodyParser.json({ limit: '10mb' }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);

    // Request logging in development
    if (isDevelopment()) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  private setupRoutes(): void {
    const config = getConfig();
    const apiPrefix = `/api/${config.apiVersion}`;

    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      const dbHealthy = await healthCheck();
      const status = dbHealthy ? 200 : 503;

      res.status(status).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
        environment: config.env,
        services: {
          database: dbHealthy ? 'connected' : 'disconnected',
        },
      });
    });

    // Readiness check
    this.app.get('/ready', (req: Request, res: Response) => {
      if (this.isShuttingDown) {
        res.status(503).json({ status: 'shutting down' });
      } else {
        res.status(200).json({ status: 'ready' });
      }
    });

    // API routes (to be implemented)
    // this.app.use(`${apiPrefix}/prompts`, promptRouter);
    // this.app.use(`${apiPrefix}/analysis`, analysisRouter);
    // this.app.use(`${apiPrefix}/optimization`, optimizationRouter);
    // this.app.use(`${apiPrefix}/experiments`, experimentRouter);

    // Temporary placeholder routes
    this.app.get(`${apiPrefix}/prompts/analyze`, (req: Request, res: Response) => {
      res.json({
        message: 'Analysis endpoint - to be implemented',
        endpoint: req.path,
      });
    });

    this.app.post(`${apiPrefix}/prompts/:id/optimize`, (req: Request, res: Response) => {
      res.json({
        message: 'Optimization endpoint - to be implemented',
        promptId: req.params.id,
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      console.error('Unhandled error:', err);

      const status = (err as any).status || 500;
      const message = isDevelopment() ? err.message : 'Internal server error';

      res.status(status).json({
        error: err.name || 'Error',
        message,
        ...(isDevelopment() && { stack: err.stack }),
      });
    });
  }

  async start(options: ServerOptions = {}): Promise<void> {
    try {
      // Initialize database
      await initializeDatabase();
      console.log('Database initialized');

      const config = getConfig();
      const port = options.port || config.port;
      const host = options.host || '0.0.0.0';

      this.server = this.app.listen(port, host, () => {
        console.log(`Server running on http://${host}:${port}`);
        console.log(`Environment: ${config.env}`);
        console.log(`API Version: ${config.apiVersion}`);
      });

      // Handle graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log('\nShutting down server gracefully...');

    // Stop accepting new connections
    if (this.server) {
      this.server.close(async () => {
        console.log('HTTP server closed');

        // Close database connections
        await shutdownDatabase();

        console.log('Shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      // eslint-disable-next-line no-undef
      global.setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    }
  }

  getApp(): Application {
    return this.app;
  }
}

// Export functions
export const createServer = () => new Server();
export const startServer = async (options?: ServerOptions) => {
  const server = createServer();
  await server.start(options);
  return server;
};
