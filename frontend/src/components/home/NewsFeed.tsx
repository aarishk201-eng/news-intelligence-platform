'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { NewsCard, CompactNewsCard } from '@/components/news/NewsCard';
import { easeCinematic, transition } from '@/lib/motion';

interface NewsArticle {
  id: string | number;
  title: string;
  description: string;
  category: string;
  source: string;
  time: string;
  image?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  trending?: boolean;
}

interface NewsFeedProps {
  articles: NewsArticle[];
  layout?: 'grid' | 'feed';
  limit?: number;
}

export function NewsFeed({
  articles,
  layout = 'grid',
  limit = 6,
}: NewsFeedProps) {
  const reduceMotion = useReducedMotion();
  const displayArticles = articles.slice(0, limit);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: easeCinematic,
      },
    },
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={transition.enter}
        viewport={{ once: true }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider">
            Live Feed
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
          Latest Intelligence
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Real-time market news analyzed with AI-powered sentiment detection and trend analysis.
        </p>
      </motion.div>

      {/* News Grid / Feed */}
      {layout === 'grid' ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {displayArticles.map((article, index) => (
            <motion.div
              key={article.id}
              variants={itemVariants}
              className="group"
            >
              <NewsCard
                id={article.id}
                title={article.title}
                description={article.description}
                category={article.category}
                source={article.source}
                time={article.time}
                image={article.image}
                sentiment={article.sentiment}
                score={article.score}
                trending={article.trending}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {displayArticles.map((article) => (
            <motion.div
              key={article.id}
              variants={itemVariants}
              className="group"
            >
              <CompactNewsCard
                id={article.id}
                title={article.title}
                description={article.description}
                category={article.category}
                source={article.source}
                time={article.time}
                sentiment={article.sentiment}
                score={article.score}
                trending={article.trending}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* View All CTA */}
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ ...transition.enter, delay: 0.4 }}
        viewport={{ once: true }}
        className="flex justify-center pt-8"
      >
        <motion.button
          className="inline-flex items-center justify-center rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-6 py-3 text-sm font-medium text-foreground hover:bg-brand-accent/15 transition-colors"
          whileHover={reduceMotion ? undefined : { scale: 1.01 }}
          whileTap={reduceMotion ? undefined : { scale: 0.99 }}
          transition={transition.hover}
        >
          View All News
        </motion.button>
      </motion.div>
    </section>
  );
}
