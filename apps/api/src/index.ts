import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';
import { profileRoutes } from './routes/profile';
import { healthRoutes } from './routes/health';
import { matchesRoutes } from './routes/matches';
import { rateLimitService } from './services/rate-limit';
import { antiSpamService } from './services/anti-spam';

// Load .env from workspace root
const envPath = path.resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

// Debug: Log environment variable status
if (process.env.STEAM_API_KEY) {
  console.log('STEAM_API_KEY loaded');
} else {
  console.warn('STEAM_API_KEY not found in environment');
}
if (process.env.FACEIT_API_KEY) {
  console.log('FACEIT_API_KEY loaded');
} else {
  console.warn('FACEIT_API_KEY not found in environment');
}
if (process.env.LEETIFY_API_KEY) {
  console.log('LEETIFY_API_KEY loaded');
}

// Pretty logs in dev, structured JSON in production (Fly ingests both).
const isProd = process.env.NODE_ENV === 'production';

const server = Fastify({
  logger: isProd
    ? { level: process.env.LOG_LEVEL || 'info' }
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      },
});

// Register plugins.
// CORS_ORIGIN locks browser access in production (comma-separated list);
// the Vercel proxy talks server-to-server and needs no CORS at all.
// Unset keeps permissive behavior for local development.
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

server.register(cors, {
  origin: corsOrigins.length
    ? (origin, cb) => {
        if (!origin || corsOrigins.includes(origin)) cb(null, true);
        else cb(new Error('Origin not allowed'), false);
      }
    : true,
});

// Register routes
server.register(healthRoutes);
server.register(profileRoutes, { prefix: '/api' });
server.register(matchesRoutes, { prefix: '/api' });

// Error handler
server.setErrorHandler((error, _request, reply) => {
  server.log.error(error);
  reply.status(500).send({
    success: false,
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT || '3001');
    const host = process.env.API_HOST || 'localhost';
    
    // Register rate limiting and anti-spam services before server starts
    await rateLimitService.registerRateLimiting(server);
    antiSpamService.registerMiddleware(server);
    
    await server.listen({ port, host });
    console.log(`Vantage API Server running on http://${host}:${port}`);

    // Start periodic cleanup of rate limiting data
    setInterval(async () => {
      try {
        await rateLimitService.cleanup();
      } catch (error) {
        console.error('Failed to cleanup rate limiting data:', error);
      }
    }, 5 * 60 * 1000); // Clean up every 5 minutes

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await rateLimitService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await rateLimitService.close();
  process.exit(0);
});

start();
