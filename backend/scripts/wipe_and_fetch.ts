import mongoose from 'mongoose';
import Article from '../src/models/Article.model';
import { env } from '../src/config/env';
import { newsIngestionService } from '../src/services/newsIngestion.service';
import { batchAnalyzeArticles } from '../src/services/ai.service';
import { AI_CONFIG } from '../src/config/openai';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected.');

  console.log('Wiping all existing (mock/seed) articles...');
  await Article.deleteMany({});
  console.log('Articles deleted.');

  console.log('Fetching live news data from NewsData.io...');
  try {
    const result = await newsIngestionService.fetchAndStoreNews();
    console.log(`Fetched and stored ${result.total} new live articles.`);
    console.dir(result, { depth: null });
  } catch(e) {
    console.error('FETCH ERROR:', e);
  }

  if (AI_CONFIG.enabled) {
    console.log('Running AI analysis on new articles (this might take a minute)...');
    const unanalyzed = await Article.find({ 'aiAnalysis.analyzedAt': null }).lean();
    
    if (unanalyzed.length > 0) {
      const results = await batchAnalyzeArticles(
        unanalyzed.map((a: any) => ({
          id: a._id.toString(),
          title: a.title,
          description: a.description,
          content: a.content,
        })),
        3
      );

      const updates = results
        .filter((r) => r.analysis)
        .map((r) =>
          Article.findByIdAndUpdate(r.articleId, {
            'aiAnalysis.summary': r.analysis!.summary,
            'aiAnalysis.keyPoints': r.analysis!.keyPoints,
            'aiAnalysis.keyInsights': r.analysis!.keyInsights,
            'aiAnalysis.extractedKeywords': r.analysis!.keywords,
            'aiAnalysis.readingTime': r.analysis!.readingTime,
            'aiAnalysis.complexity': r.analysis!.complexity,
            'aiAnalysis.credibilityScore': r.analysis!.credibilityScore,
            'aiAnalysis.bias': r.analysis!.bias,
            'aiAnalysis.analyzedAt': new Date(),
            'aiAnalysis.modelVersion': env.OPENAI_MODEL,
            sentiment: r.analysis!.sentiment,
            tags: [...new Set([...(r.analysis!.keywords ?? []), ...(r.analysis!.topics ?? [])])].slice(0, 30),
          }, { runValidators: false })
        );

      await Promise.allSettled(updates);
      console.log(`Analyzed ${updates.length} articles using OpenRouter (Llama 3)!`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
