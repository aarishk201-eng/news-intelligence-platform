'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { TrendingUp, Clock, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const MOCK_ARTICLES = [
  {
    id: 1,
    category: 'Technology',
    source: 'TechCrunch',
    time: '2 min ago',
    title: 'OpenAI Releases New GPT-4 Update with Improved Reasoning',
    description: 'The latest update significantly improves reasoning capabilities and reduces latency across all Plus subscriptions.',
    sentiment: 'positive',
    score: 92,
    trending: true,
  },
  {
    id: 2,
    category: 'Finance',
    source: 'Bloomberg',
    time: '18 min ago',
    title: 'Global Markets Rally as Tech Earnings Exceed Expectations',
    description: 'Major indices gained 2.4% as earnings from leading technology firms beat analyst forecasts by a wide margin.',
    sentiment: 'positive',
    score: 87,
    trending: true,
  },
  {
    id: 3,
    category: 'Science',
    source: 'Wired',
    time: '45 min ago',
    title: 'MIT Researchers Achieve Quantum Error Correction Breakthrough',
    description: 'A new approach to quantum error correction brings commercially viable quantum computers significantly closer to reality.',
    sentiment: 'positive',
    score: 95,
    trending: false,
  },
  {
    id: 4,
    category: 'Politics',
    source: 'Reuters',
    time: '1 hr ago',
    title: 'New Climate Policy Faces Significant Industry Backlash',
    description: 'Manufacturing unions push back on proposed emissions regulations, citing potential job losses in key swing states.',
    sentiment: 'negative',
    score: 45,
    trending: false,
  },
];

const sentimentColors: Record<string, string> = {
  positive: 'text-sentiment-positive',
  neutral: 'text-sentiment-neutral',
  negative: 'text-sentiment-negative',
};

function ArticleCard({ article, index }: { article: typeof MOCK_ARTICLES[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-5 group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="tag text-[10px] py-0.5">{article.category}</span>
          {article.trending && (
            <span className="flex items-center gap-1 text-[10px] text-news-trending font-medium">
              <TrendingUp className="w-2.5 h-2.5" />
              Trending
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <Clock className="w-2.5 h-2.5" />
          {article.time}
        </div>
      </div>

      <h3 className="font-display text-sm font-semibold text-foreground leading-snug mb-2 line-clamp-2 transition-colors">
        {article.title}
      </h3>
      <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 mb-4">
        {article.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[11px] text-muted-foreground/80">{article.source}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-[11px] font-medium ${sentimentColors[article.sentiment]}`}>
            {article.sentiment === 'positive' ? '▲' : article.sentiment === 'negative' ? '▼' : '—'} {article.score}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NewsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="platform" className="relative px-6 py-32 md:px-12" ref={ref}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
        >
          <div>
            <div className="tag mb-4">Live Feed</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
              The world's news,
              <br />
              <span className="gradient-text">intelligently curated.</span>
            </h2>
          </div>
          <Link href="/dashboard" className="btn-ghost text-sm self-start md:self-auto shrink-0">
            View full feed
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Articles Grid */}
        {inView && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_ARTICLES.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))}
          </div>
        )}

        {/* Sentiment Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mt-8 glass-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Market Sentiment Distribution</span>
            <span className="text-xs text-muted-foreground/60">Last 24h · 2,847 articles</span>
          </div>
          <div className="flex rounded-full overflow-hidden h-2 gap-0.5">
            <div className="h-full rounded-l-full bg-sentiment-positive" style={{ width: '62%' }} />
            <div className="h-full bg-sentiment-neutral" style={{ width: '21%' }} />
            <div className="h-full rounded-r-full bg-sentiment-negative" style={{ width: '17%' }} />
          </div>
          <div className="flex gap-6 mt-3">
            {[
              { label: 'Positive', pct: '62%' },
              { label: 'Neutral', pct: '21%' },
              { label: 'Negative', pct: '17%' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={
                    s.label === 'Positive'
                      ? 'w-1.5 h-1.5 rounded-full bg-sentiment-positive'
                      : s.label === 'Neutral'
                      ? 'w-1.5 h-1.5 rounded-full bg-sentiment-neutral'
                      : 'w-1.5 h-1.5 rounded-full bg-sentiment-negative'
                  }
                />
                <span className="text-xs text-muted-foreground/80">{s.label}</span>
                <span className="text-xs font-semibold text-foreground">{s.pct}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
