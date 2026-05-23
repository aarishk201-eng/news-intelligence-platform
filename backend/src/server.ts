/**
 * @module server
 * @description Production-grade server bootstrap.
 *
 * Boot sequence:
 *  1. Load & validate environment (fail-fast on missing required vars)
 *  2. Connect MongoDB Atlas (with connection pooling)
 *  3. Connect Redis (non-fatal — app degrades gracefully)
 *  4. Start HTTP server
 *  5. Recover stalled jobs from previous crash
 *  6. Register + start all cron jobs
 *  7. Register graceful shutdown handlers
 */

import { env }              from './config/env';
import app                  from './app';
import { connectDatabase }  from './config/database';
import { connectRedis }     from './config/redis';
import { createLogger }     from './utils/logger';
import { registerAllJobs, scheduler } from './jobs';
import http                 from 'http';

const log = createLogger('Server');

// ─── HTTP Server ───────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────
let isShuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  log.info(`\n${signal} received — initiating graceful shutdown...`);

  // Force exit if shutdown takes too long
  const forceExitTimer = setTimeout(() => {
    log.error('⚠️  Forced shutdown after 20s timeout');
    process.exit(1);
  }, 20_000);
  forceExitTimer.unref();

  // 1. Stop accepting new HTTP connections
  server.close(() => log.info('HTTP server closed'));

  // 2. Stop cron jobs + wait for in-flight runs to finish
  try {
    await scheduler.stopAll();
  } catch (err) {
    log.error('Error stopping scheduler:', err);
  }

  // 3. Close database connections
  try {
    const { disconnectDatabase } = await import('./config/database');
    await disconnectDatabase();
  } catch (err) {
    log.error('Error disconnecting MongoDB:', err);
  }

  log.info('✅ Graceful shutdown complete');
  process.exit(0);
};

// ─── Process event handlers ────────────────────────────────────────────────────
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT',  () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  log.error('Unhandled Promise Rejection:', reason);
  void shutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (err: Error) => {
  log.error('Uncaught Exception:', err);
  void shutdown('UNCAUGHT_EXCEPTION');
});

// ─── Bootstrap ─────────────────────────────────────────────────────────────────
const bootstrap = async (): Promise<void> => {
  const startMs = Date.now();

  try {
    // ── 1. MongoDB ──────────────────────────────────────────────────────────
    log.info('Connecting to MongoDB...');
    await connectDatabase();

    // ── 2. Redis (non-fatal) ────────────────────────────────────────────────
    log.info('Connecting to Redis...');
    await connectRedis().catch((err: Error) =>
      log.warn(`Redis unavailable (${err.message}) — cache disabled, app continues`)
    );

    // ── 3. HTTP server ──────────────────────────────────────────────────────
    await new Promise<void>((resolve) => {
      server.listen(env.PORT, () => {
        const boot = ((Date.now() - startMs) / 1000).toFixed(1);
        log.info('═'.repeat(60));
        log.info(`🚀 NewsIntel API ready in ${boot}s`);
        log.info(`   Env:         ${env.NODE_ENV}`);
        log.info(`   Port:        ${env.PORT}`);
        log.info(`   API:         http://localhost:${env.PORT}/api/${env.API_VERSION}`);
        log.info(`   AI enabled:  ${env.ENABLE_AI}`);
        log.info(`   Cron jobs:   ${env.ENABLE_CRON}`);
        log.info(`   Cache:       ${env.ENABLE_CACHE}`);
        log.info('═'.repeat(60));
        resolve();
      });
    });

    // ── 4. Crash recovery ───────────────────────────────────────────────────
    if (env.ENABLE_CRON) {
      await scheduler.recoverStalledJobs();
    }

    // ── 5. Register + start cron jobs ───────────────────────────────────────
    if (env.ENABLE_CRON) {
      registerAllJobs();
      scheduler.startAll();
    }

  } catch (err) {
    log.error('Bootstrap failed:', err);
    process.exit(1);
  }
};

void bootstrap();
