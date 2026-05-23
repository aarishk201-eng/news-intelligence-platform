/**
 * @module jobs/index
 * @description Registers all jobs with the scheduler singleton.
 * Single import in server.ts — keeps bootstrap clean.
 *
 * Job registry:
 *  newsIngestion  — every 30 min  — fetch + AI analysis
 *  aiAnalysis     — every hour    — catch-up analysis backlog
 *  cleanup        — daily 02:00   — archive old articles + flush caches
 */

import { scheduler }          from './scheduler';
import { newsIngestionHandler } from './newsIngestion.job';
import { aiAnalysisHandler }  from './aiAnalysis.job';
import { cleanupHandler }     from './cleanup.job';
import { env }                from '../config/env';

export const registerAllJobs = (): void => {
  scheduler
    .register({
      name:            'newsIngestion',
      cronExpression:  env.NEWS_INGEST_CRON,         // default: */30 * * * *
      handler:         newsIngestionHandler,
      timezone:        'UTC',
      timeoutMs:       12 * 60 * 1000,               // 12 minutes
      maxConsecFails:  5,
      runOnStart:      env.IS_PRODUCTION,             // immediate run in prod only
      enabled:         env.ENABLE_CRON,
    })
    .register({
      name:            'aiAnalysis',
      cronExpression:  '0 * * * *',                  // every hour at :00
      handler:         aiAnalysisHandler,
      timezone:        'UTC',
      timeoutMs:       15 * 60 * 1000,               // 15 minutes
      maxConsecFails:  3,
      runOnStart:      false,
      enabled:         env.ENABLE_CRON && env.ENABLE_AI,
    })
    .register({
      name:            'cleanup',
      cronExpression:  '0 2 * * *',                  // daily at 02:00 UTC
      handler:         cleanupHandler,
      timezone:        'UTC',
      timeoutMs:       5 * 60 * 1000,                // 5 minutes
      maxConsecFails:  3,
      runOnStart:      false,
      enabled:         env.ENABLE_CRON,
    });
};

export { scheduler };
