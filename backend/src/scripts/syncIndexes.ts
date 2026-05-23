/**
 * @script syncIndexes
 * @description Standalone script to sync or validate MongoDB indexes.
 * Run before deploying to production to ensure all indexes exist.
 *
 * Usage:
 *   npm run indexes:sync           — Create missing indexes
 *   npm run indexes:validate       — Only validate, no changes
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// ── Import all models so they register with Mongoose ──────────────────────────
import '../models/Article.model';
import '../models/Category.model';
import '../models/Source.model';
import '../models/ArticleView.model';
import '../models/SavedSearch.model';
import '../models/User.model';

import { syncIndexes, validateCriticalIndexes, listIndexStats } from '../utils/dbIndexManager';

const validateOnly = process.argv.includes('--validate-only');
const showStats    = process.argv.includes('--stats');

const run = async (): Promise<void> => {
  console.log(`\n🔌 Connecting to MongoDB...`);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log(`✅ Connected: ${mongoose.connection.host}\n`);

  if (validateOnly) {
    console.log('🔍 Validating critical indexes...');
    const ok = await validateCriticalIndexes();
    if (!ok) {
      console.error('\n❌ Critical indexes are missing. Run: npm run indexes:sync');
      process.exit(1);
    }
    console.log('\n✅ All critical indexes are present.\n');
  } else {
    console.log('🔄 Syncing indexes across all collections...\n');
    const reports = await syncIndexes();

    console.log('\n📋 Index Sync Report:');
    console.log('─'.repeat(50));
    for (const r of reports) {
      const status = r.errors.length > 0 ? '❌' : '✅';
      console.log(`${status} ${r.collection.padEnd(25)} ${r.existing} indexes`);
      r.errors.forEach((e) => console.error(`   Error: ${e}`));
    }
    console.log('─'.repeat(50));

    // Validate critical ones after sync
    console.log('\n🔍 Validating critical indexes...');
    await validateCriticalIndexes();
  }

  if (showStats) {
    console.log('\n📊 Index Stats (articles):');
    const stats = await listIndexStats('articles');
    console.table(
      (stats as Array<{ name: string; accesses: { ops: number }; since: Date }>).map((s) => ({
        name:      s.name,
        ops:       s.accesses?.ops ?? 0,
        since:     s.since,
      }))
    );
  }

  console.log('\n✅ Done.\n');
};

run()
  .catch((err) => { console.error('❌ Script failed:', err); process.exit(1); })
  .finally(() => void mongoose.disconnect());
