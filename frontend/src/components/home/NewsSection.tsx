'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { TrendingUp, Clock, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '@/lib/api';

const sentimentColors: Record<string, string> = {
  positive: 'text-sentiment-positive',
  neutral: 'text-sentiment-neutral',
  negative: 'text-sentiment-negative',
};

// Formatting helper for time
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffInMinutes < 60) return `${Math.max(1, diffInMinutes)} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

function ArticleCard({ article, index }: { article: any; index: number }) {
  const category = article.category?.name || 'News';
  const source = article.source?.name || 'Unknown Source';
  const time = formatTimeAgo(article.publishedAt);
  const sentimentLabel = article.sentiment?.label || 'neutral';
  // Backend returns score between -1 and 1, or 0-100?
  // Let's format it to a percentage 0-100 if it's small, else use as is
  let scoreRaw = article.sentiment?.score || 0;
  if (Math.abs(scoreRaw) <= 1) scoreRaw = Math.abs(scoreRaw * 100);
  const score = Math.round(scoreRaw);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-5 group cursor-pointer h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="tag text-[10px] py-0.5">{category}</span>
          {article.isTrending && (
            <span className="flex items-center gap-1 text-[10px] text-news-trending font-medium">
              <TrendingUp className="w-2.5 h-2.5" />
              Trending
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 shrink-0">
          <Clock className="w-2.5 h-2.5" />
          {time}
        </div>
      </div>

      <h3 className="font-display text-sm font-semibold text-foreground leading-snug mb-2 line-clamp-2 transition-colors">
        {article.title}
      </h3>
      <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 mb-4 flex-grow">
        {article.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-2">
          <Globe className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[11px] text-muted-foreground/80">{source}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-[11px] font-medium ${sentimentColors[sentimentLabel] || sentimentColors.neutral}`}>
            {sentimentLabel === 'positive' ? '▲' : sentimentLabel === 'negative' ? '▼' : '—'} {score}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="glass-card p-5 h-full flex flex-col animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="w-16 h-5 bg-white/5 rounded-full" />
        <div className="w-16 h-4 bg-white/5 rounded" />
      </div>
      <div className="w-full h-4 bg-white/5 rounded mb-2" />
      <div className="w-3/4 h-4 bg-white/5 rounded mb-4" />
      <div className="w-full h-3 bg-white/5 rounded mb-1 flex-grow" />
      <div className="w-full h-3 bg-white/5 rounded mb-4" />
      <div className="flex justify-between mt-auto pt-2">
        <div className="w-24 h-3 bg-white/5 rounded" />
        <div className="w-12 h-3 bg-white/5 rounded" />
      </div>
    </div>
  );
}

export default function NewsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const { data, isLoading } = useQuery({
    queryKey: ['landing-articles'],
    queryFn: async () => {
      const response = await newsApi.getArticles({ limit: 4 });
      return response.data;
    },
    staleTime: 60000,
  });

  const articles = data?.data || [];

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
              The world&apos;s news,
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading 
              ? Array.from({ length: 4 }).map((_, i) => <ArticleSkeleton key={i} />)
              : articles.slice(0, 4).map((article: any, i: number) => (
                  <ArticleCard key={article._id || i} article={article} index={i} />
                ))
            }
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
            <span className="text-xs text-muted-foreground/60">Live Updates</span>
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
