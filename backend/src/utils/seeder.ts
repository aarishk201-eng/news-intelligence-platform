/**
 * @script seeder
 * @description Seeds the database with initial categories and a default admin user.
 *
 * Usage:
 *   ts-node src/utils/seeder.ts           — Seed data
 *   ts-node src/utils/seeder.ts --destroy — Wipe all seeded data
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';
import Category from '../models/Category.model';
import User from '../models/User.model';

const CATEGORIES = [
  { name: 'Technology',    color: '#3b82f6', icon: '💻', description: 'Tech news, AI, software, and innovation' },
  { name: 'Politics',      color: '#ef4444', icon: '🏛️', description: 'Government, elections, and policy' },
  { name: 'Business',      color: '#10b981', icon: '📈', description: 'Markets, economy, finance, and trade' },
  { name: 'Science',       color: '#8b5cf6', icon: '🔬', description: 'Research, space, climate, and discovery' },
  { name: 'Health',        color: '#f59e0b', icon: '🏥', description: 'Medical news, wellness, and healthcare' },
  { name: 'Sports',        color: '#06b6d4', icon: '⚽', description: 'Football, basketball, Olympics, and more' },
  { name: 'Entertainment', color: '#ec4899', icon: '🎬', description: 'Movies, music, celebrities, and culture' },
  { name: 'World',         color: '#64748b', icon: '🌍', description: 'International news and global affairs' },
  { name: 'General',       color: '#6366f1', icon: '📰', description: 'General news and miscellaneous topics' },
];

const ADMIN_USER = {
  name:     'Admin User',
  email:    'admin@newsintel.com',
  password: 'Admin@2024!',
  role:     'admin' as const,
  isVerified: true,
};

const connectAndSeed = async (): Promise<void> => {
  console.log('🌱 Connecting to database...');
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log(`✅ Connected to: ${mongoose.connection.host}`);
};

const seedData = async (): Promise<void> => {
  await connectAndSeed();

  console.log('\n📁 Seeding categories...');
  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ name: cat.name });
    if (existing) {
      console.log(`  ⏭  Skipped: ${cat.name} (already exists)`);
    } else {
      await Category.create(cat);
      console.log(`  ✅ Created: ${cat.name}`);
    }
  }

  console.log('\n👤 Seeding admin user...');
  const existingAdmin = await User.findOne({ email: ADMIN_USER.email });
  if (existingAdmin) {
    console.log(`  ⏭  Admin already exists: ${ADMIN_USER.email}`);
  } else {
    await User.create(ADMIN_USER);
    console.log(`  ✅ Admin created: ${ADMIN_USER.email}`);
    console.log(`  🔑 Password: ${ADMIN_USER.password}`);
  }

  console.log('\n✅ Seeding complete!\n');
};

const destroyData = async (): Promise<void> => {
  await connectAndSeed();
  console.log('\n🗑️  Destroying seeded data...');
  await Promise.all([
    Category.deleteMany({}),
    User.deleteMany({ role: { $ne: 'admin' } }),
  ]);
  console.log('✅ Data destroyed\n');
};

const run = async (): Promise<void> => {
  try {
    const isDestroy = process.argv.includes('--destroy');
    if (isDestroy) {
      await destroyData();
    } else {
      await seedData();
    }
  } catch (err) {
    console.error('❌ Seeder failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

void run();
