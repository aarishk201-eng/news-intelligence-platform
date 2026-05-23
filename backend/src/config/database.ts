import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const log = logger.child({ label: 'Database' });

// ─── Connection options ────────────────────────────────────────────────────────
const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: env.DB_POOL_SIZE,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,
  heartbeatFrequencyMS: 10_000,
  retryWrites: true,
  family: 4,           // Use IPv4, skip IPv6
};

let mongod: any = null;

// ─── Connect ────────────────────────────────────────────────────────────────────
export const connectDatabase = async (): Promise<void> => {
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in env variables');

  try {
    await mongoose.connect(uri, mongooseOptions);
    log.info('✅ Connected to MongoDB Atlas');
  } catch (err) {
    log.error('❌ MongoDB Connection Error:', err);
    throw err;
  }
};

// ─── Disconnect ────────────────────────────────────────────────────────────────
export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    log.info('MongoDB connection closed');
  }
  if (mongod) {
    await mongod.stop();
  }
};

// ─── Health check ──────────────────────────────────────────────────────────────
export const isDatabaseHealthy = (): boolean =>
  mongoose.connection.readyState === 1; // 1 = connected

// ─── Drop all collections (test utility) ──────────────────────────────────────
export const dropDatabase = async (): Promise<void> => {
  if (!env.IS_TEST) throw new Error('dropDatabase can only be called in test environment');
  await mongoose.connection.dropDatabase();
};
