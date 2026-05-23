/**
 * @model JobRun
 * @description Persistent log of every cron job execution.
 *
 * Enables:
 *  - Job history and audit trail
 *  - Failure rate analytics
 *  - Missed-run detection
 *  - Admin dashboard visibility
 *  - Recovery: detect if a job was left "running" after a crash
 *
 * Collection is write-optimized: no __v, minimal indexes, 90-day TTL.
 */
import mongoose, { Document, Schema } from 'mongoose';

export type JobStatus = 'running' | 'success' | 'failed' | 'skipped' | 'timeout';

export interface IJobRun extends Document {
  _id:         mongoose.Types.ObjectId;
  jobName:     string;
  status:      JobStatus;
  startedAt:   Date;
  finishedAt?: Date;
  durationMs?: number;
  triggeredBy: 'cron' | 'manual' | 'recovery';
  result?: {
    inserted?:  number;
    fetched?:   number;
    analyzed?:  number;
    skipped?:   number;
    errors?:    string[];
    [key: string]: unknown;
  };
  error?: {
    message: string;
    stack?:  string;
    code?:   string;
  };
  meta?: Record<string, unknown>;
}

const jobRunSchema = new Schema<IJobRun>(
  {
    jobName:     { type: String, required: true, index: true, maxlength: 100 },
    status: {
      type:    String,
      enum:    ['running', 'success', 'failed', 'skipped', 'timeout'],
      default: 'running',
      index:   true,
    },
    startedAt:   { type: Date, required: true, default: Date.now, index: true },
    finishedAt:  { type: Date, sparse: true },
    durationMs:  { type: Number },
    triggeredBy: { type: String, enum: ['cron', 'manual', 'recovery'], default: 'cron' },
    result: {
      inserted: { type: Number },
      fetched:  { type: Number },
      analyzed: { type: Number },
      skipped:  { type: Number },
      errors:   [{ type: String }],
    },
    error: {
      message: { type: String, maxlength: 2000 },
      stack:   { type: String, maxlength: 5000, select: false },
      code:    { type: String, maxlength: 50 },
    },
    meta: { type: Schema.Types.Mixed },
  },
  {
    timestamps: false,    // Use startedAt / finishedAt explicitly
    versionKey: false,    // Remove __v — write-optimized
  }
);

// ── Compound index for job history queries ─────────────────────────────────
jobRunSchema.index({ jobName: 1, startedAt: -1 }, { name: 'job_history' });
jobRunSchema.index({ status: 1, startedAt: -1 },  { name: 'status_history' });

// ── 90-day TTL — auto-delete old run records ───────────────────────────────
jobRunSchema.index({ startedAt: 1 }, { name: 'ttl_cleanup', expireAfterSeconds: 90 * 24 * 3600 });

const JobRun = mongoose.model<IJobRun>('JobRun', jobRunSchema);
export default JobRun;
