import mongoose from 'mongoose';
import { env } from '../src/config/env';
import Article from '../src/models/Article.model';

mongoose.connect(env.MONGODB_URI).then(async () => {
  const result = await Article.updateMany(
    { 'aiAnalysis.analyzedAt': null },
    { $set: { 'aiAnalysis.analyzedAt': new Date() } }
  );
  console.log(`Marked ${result.modifiedCount} articles as analyzed to clear the background queue!`);
  process.exit(0);
}).catch(console.error);
