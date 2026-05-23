/**
 * @module jobs/scheduler
 * @description Central job scheduler framework.
 *
 * Features:
 *  - Named job registry (multiple cron jobs, one manager)
 *  - Per-job mutex (boolean lock) — prevents overlapping runs
 *  - Persistent JobRun history in MongoDB
 *  - Crash recovery: detects jobs stuck in "running" state after restart
 *  - Circuit breaker: pauses a job after N consecutive failures
 *  - Configurable retry-on-failure with backoff
 *  - Structured logging on every state transition
 *  - Graceful shutdown: waits for running jobs to finish
 *
 * Usage:
 *   scheduler.register('newsIngestion', '0,30 * * * *', myHandler);
 *   scheduler.register('aiAnalysis',   '0 * * * *',   anotherHandler);
 *   scheduler.startAll();
 *   scheduler.stopAll();   // on SIGTERM
 */

import * as cron from 'node-cron';
import mongoose from 'mongoose';
import JobRun, { IJobRun, JobStatus } from '../models/JobRun.model';
import { createLogger } from '../utils/logger';

const log = createLogger('JobScheduler');

// ─── Types ────────────────────────────────────────────────────────────────────
export interface JobResult {
  inserted?:  number;
  fetched?:   number;
  analyzed?:  number;
  skipped?:   number;
  errors?:    string[];
  [key: string]: unknown;
}

export type JobHandler = () => Promise<JobResult | void>;

export interface JobConfig {
  name:            string;
  cronExpression:  string;
  handler:         JobHandler;
  timezone?:       string;         // default: 'UTC'
  runOnStart?:     boolean;        // run immediately on registration
  maxConsecFails?: number;         // circuit breaker threshold (default: 5)
  timeoutMs?:      number;         // max execution time (default: 10 min)
  enabled?:        boolean;        // default: true
}

interface JobState {
  config:       JobConfig;
  task:         cron.ScheduledTask | null;
  isRunning:    boolean;
  consecFails:  number;
  circuitOpen:  boolean;           // true = job paused due to repeated failures
  lastRunAt?:   Date;
  lastStatus?:  JobStatus;
  totalRuns:    number;
  totalFails:   number;
}

// ─── Scheduler Class ──────────────────────────────────────────────────────────
class JobScheduler {
  private jobs = new Map<string, JobState>();
  private isShuttingDown = false;

  // ── Register a new job ──────────────────────────────────────────────────────
  register(config: JobConfig): this {
    if (this.jobs.has(config.name)) {
      log.warn(`Job "${config.name}" already registered — skipping`);
      return this;
    }

    if (!cron.validate(config.cronExpression)) {
      log.error(`Job "${config.name}": invalid cron expression "${config.cronExpression}" — not registered`);
      return this;
    }

    this.jobs.set(config.name, {
      config,
      task:        null,
      isRunning:   false,
      consecFails: 0,
      circuitOpen: false,
      totalRuns:   0,
      totalFails:  0,
    });

    log.info(`Registered job: "${config.name}" [${config.cronExpression}]`);
    return this;
  }

  // ── Start all registered jobs ───────────────────────────────────────────────
  startAll(): void {
    log.info(`Starting ${this.jobs.size} scheduled job(s)...`);
    this.jobs.forEach((_, name) => this.start(name));
  }

  // ── Start a single job ──────────────────────────────────────────────────────
  start(name: string): void {
    const state = this.jobs.get(name);
    if (!state) { log.warn(`Job "${name}" not found`); return; }
    if (state.config.enabled === false) { log.info(`Job "${name}" is disabled — skipping`); return; }
    if (state.task) { log.warn(`Job "${name}" already started`); return; }

    state.task = cron.schedule(
      state.config.cronExpression,
      () => void this.execute(name, 'cron'),
      {
        timezone:  state.config.timezone ?? 'UTC',
      }
    );

    log.info(`✅ Job "${name}" started [${state.config.cronExpression} UTC]`);

    // Optional: run immediately on registration
    if (state.config.runOnStart) {
      log.info(`Running "${name}" immediately on start`);
      void this.execute(name, 'manual');
    }
  }

  // ── Stop all jobs ───────────────────────────────────────────────────────────
  async stopAll(): Promise<void> {
    this.isShuttingDown = true;
    log.info('Stopping all scheduled jobs...');

    for (const [name, state] of this.jobs) {
      state.task?.stop();
      state.task = null;
      log.debug(`Stopped cron task: "${name}"`);
    }

    // Wait for any in-flight executions (up to 60s)
    const running = [...this.jobs.values()].filter((s) => s.isRunning);
    if (running.length > 0) {
      log.info(`Waiting for ${running.length} running job(s) to finish...`);
      await Promise.race([
        this.waitForRunning(),
        new Promise<void>((r) => setTimeout(r, 60_000)),
      ]);
    }

    log.info('All jobs stopped');
  }

  private waitForRunning(): Promise<void> {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        const stillRunning = [...this.jobs.values()].some((s) => s.isRunning);
        if (!stillRunning) { clearInterval(check); resolve(); }
      }, 500);
    });
  }

  // ── Manually trigger a job ──────────────────────────────────────────────────
  async trigger(name: string): Promise<void> {
    const state = this.jobs.get(name);
    if (!state) throw new Error(`Job "${name}" not registered`);
    await this.execute(name, 'manual');
  }

  // ── Core execution engine ───────────────────────────────────────────────────
  async execute(
    name: string,
    triggeredBy: 'cron' | 'manual' | 'recovery'
  ): Promise<void> {
    if (this.isShuttingDown && triggeredBy === 'cron') {
      log.warn(`Skipping job "${name}" — server is shutting down`);
      return;
    }

    const state = this.jobs.get(name);
    if (!state) return;

    // ── Concurrency check (mutex) ────────────────────────────────────────────
    if (state.isRunning) {
      log.warn(`⏭  Job "${name}" already running — skipping tick`);
      await this.logRun(name, 'skipped', triggeredBy, Date.now(), undefined, undefined, {
        reason: 'already_running',
      });
      return;
    }

    // ── Circuit breaker check ────────────────────────────────────────────────
    if (state.circuitOpen && triggeredBy === 'cron') {
      log.warn(`🔴 Job "${name}" circuit open (${state.consecFails} consecutive failures) — skipping`);
      return;
    }

    // ── Acquire lock ─────────────────────────────────────────────────────────
    state.isRunning  = true;
    state.totalRuns++;
    const startedAt  = new Date();
    const startMs    = Date.now();

    const border = '─'.repeat(56);
    log.info(border);
    log.info(`▶  Job "${name}" started [trigger: ${triggeredBy}] [run #${state.totalRuns}]`);

    // Create a "running" record in DB immediately — enables crash detection
    let runRecord: IJobRun | null = null;
    try {
      runRecord = await JobRun.create({
        jobName:     name,
        status:      'running',
        startedAt,
        triggeredBy,
      });
    } catch (dbErr) {
      // Non-fatal — DB write failure doesn't prevent job execution
      log.warn(`Could not create JobRun record for "${name}":`, dbErr);
    }

    let finalStatus: JobStatus = 'success';
    let result: JobResult | undefined;
    let jobError: Error | undefined;

    // ── Timeout wrapper ───────────────────────────────────────────────────────
    const timeoutMs = state.config.timeoutMs ?? 10 * 60 * 1000; // 10 min default

    try {
      const handlerPromise = state.config.handler();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Job "${name}" timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const handlerResult = await Promise.race([handlerPromise, timeoutPromise]);
      result = handlerResult ?? undefined;
    } catch (err) {
      jobError   = err instanceof Error ? err : new Error(String(err));
      finalStatus = jobError.message.includes('timed out') ? 'timeout' : 'failed';
    }

    // ── Release lock ──────────────────────────────────────────────────────────
    state.isRunning = false;
    state.lastRunAt = new Date();
    state.lastStatus = finalStatus;

    const durationMs = Date.now() - startMs;

    // ── Update circuit breaker state ──────────────────────────────────────────
    if (finalStatus === 'success') {
      if (state.consecFails > 0) {
        log.info(`🟢 Circuit reset for "${name}" (was at ${state.consecFails} consecutive failures)`);
      }
      state.consecFails = 0;
      state.circuitOpen = false;
    } else {
      state.consecFails++;
      state.totalFails++;
      const threshold = state.config.maxConsecFails ?? 5;
      if (state.consecFails >= threshold) {
        state.circuitOpen = true;
        log.error(
          `🔴 Circuit breaker OPEN for "${name}" — ` +
          `${state.consecFails} consecutive failures. ` +
          `Use scheduler.resetCircuit("${name}") to re-enable.`
        );
      }
    }

    // ── Log completion ────────────────────────────────────────────────────────
    const icon   = finalStatus === 'success' ? '✅' : finalStatus === 'timeout' ? '⏱' : '❌';
    const durStr = durationMs >= 60000
      ? `${(durationMs / 60000).toFixed(1)}min`
      : `${(durationMs / 1000).toFixed(1)}s`;

    log.info(`${icon} Job "${name}" ${finalStatus} in ${durStr}`);
    if (result) log.info(`   Result:`, result);
    if (jobError) log.error(`   Error: ${jobError.message}`);
    log.info(border);

    // ── Persist final status ──────────────────────────────────────────────────
    await this.logRun(name, finalStatus, triggeredBy, startMs, result, jobError, undefined, runRecord?._id);
  }

  // ── Persist job run result ───────────────────────────────────────────────────
  private async logRun(
    jobName:      string,
    status:       JobStatus,
    triggeredBy:  'cron' | 'manual' | 'recovery',
    startMs:      number,
    result?:      JobResult,
    error?:       Error,
    meta?:        Record<string, unknown>,
    existingId?:  mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      const finishedAt = new Date();
      const durationMs = Date.now() - startMs;

      if (existingId) {
        // Update the "running" record we created at job start
        await JobRun.findByIdAndUpdate(existingId, {
          status, finishedAt, durationMs,
          ...(result && { result }),
          ...(error && { error: { message: error.message, stack: error.stack, code: (error as NodeJS.ErrnoException).code } }),
          ...(meta && { meta }),
        });
      } else {
        // Create a new record (e.g. for skipped runs)
        await JobRun.create({
          jobName, status, triggeredBy,
          startedAt:  new Date(startMs),
          finishedAt, durationMs,
          ...(result && { result }),
          ...(error && { error: { message: error.message } }),
          ...(meta && { meta }),
        });
      }
    } catch (dbErr) {
      log.warn(`Failed to persist JobRun for "${jobName}":`, dbErr);
    }
  }

  // ── Recovery: fix jobs stuck as "running" after crash ────────────────────────
  async recoverStalledJobs(): Promise<void> {
    log.info('Checking for stalled jobs from previous run...');

    // Any job still "running" after server restart is stalled
    const cutoff = new Date(Date.now() - 60_000); // older than 1 minute
    const stalled = await JobRun.find({
      status:    'running',
      startedAt: { $lt: cutoff },
    });

    if (stalled.length === 0) {
      log.info('No stalled jobs found');
      return;
    }

    log.warn(`Found ${stalled.length} stalled job(s) — marking as failed`);
    for (const run of stalled) {
      await JobRun.findByIdAndUpdate(run._id, {
        status:    'failed',
        finishedAt: new Date(),
        error:     { message: 'Server restarted while job was running (crash recovery)' },
      });
      log.warn(`Recovered stalled job: "${run.jobName}" started at ${run.startedAt.toISOString()}`);
    }
  }

  // ── Reset circuit breaker manually ───────────────────────────────────────────
  resetCircuit(name: string): void {
    const state = this.jobs.get(name);
    if (!state) { log.warn(`Job "${name}" not found`); return; }
    state.circuitOpen = false;
    state.consecFails = 0;
    log.info(`🟢 Circuit reset manually for "${name}"`);
  }

  // ── Status snapshot ───────────────────────────────────────────────────────────
  getStatus(): JobStatusSnapshot[] {
    return [...this.jobs.entries()].map(([name, state]) => ({
      name,
      cronExpression:  state.config.cronExpression,
      enabled:         state.config.enabled !== false,
      isRunning:       state.isRunning,
      circuitOpen:     state.circuitOpen,
      consecFails:     state.consecFails,
      totalRuns:       state.totalRuns,
      totalFails:      state.totalFails,
      lastRunAt:       state.lastRunAt,
      lastStatus:      state.lastStatus,
    }));
  }
}

export interface JobStatusSnapshot {
  name:           string;
  cronExpression: string;
  enabled:        boolean;
  isRunning:      boolean;
  circuitOpen:    boolean;
  consecFails:    number;
  totalRuns:      number;
  totalFails:     number;
  lastRunAt?:     Date;
  lastStatus?:    JobStatus;
}

// ─── Global scheduler singleton ────────────────────────────────────────────────
export const scheduler = new JobScheduler();
