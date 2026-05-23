'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easeCinematic, enterFadeUp, transition } from '@/lib/motion';
import { Navigation } from '@/components/layout/Navigation';
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';
import { NewsCard, FeaturedNewsCard, CompactNewsCard } from '@/components/news/NewsCard';
import { AIInsights } from '@/components/home/AIInsights';
import { SearchBar } from '@/components/home/SearchBar';
import { GlassSculptureCanvas } from '@/components/three/GlassSculpture';

const MOCK_ARTICLES = [
  {
    id: 1,
    title: 'OpenAI Releases GPT-4.5 with Revolutionary Reasoning Capabilities',
    description:
      'The latest version introduces advanced multi-step reasoning, improved factuality, and enhanced performance across coding and mathematical tasks.',
    category: 'AI/Tech',
    source: 'TechCrunch',
    time: '2 min ago',
    image: 'https://picsum.photos/seed/newsintel-1/800/400',
    sentiment: 'positive' as const,
    score: 92,
    trending: true,
  },
  {
    id: 2,
    title: 'Global Markets Rally as Tech Earnings Beat Expectations',
    description:
      'Major indices gained 2.4% as earnings from leading technology firms beat analyst forecasts by wide margins, signaling strong economic resilience.',
    category: 'Finance',
    source: 'Bloomberg',
    time: '18 min ago',
    image: 'https://picsum.photos/seed/newsintel-2/800/400',
    sentiment: 'positive' as const,
    score: 87,
    trending: true,
  },
  {
    id: 3,
    title: 'Tesla Announces Record Production Numbers for Q4',
    description:
      'Electric vehicle manufacturer reports highest quarterly production ever, surpassing analyst expectations by 12%.',
    category: 'Automotive',
    source: 'Reuters',
    time: '45 min ago',
    image: 'https://picsum.photos/seed/newsintel-3/800/400',
    sentiment: 'positive' as const,
    score: 78,
  },
  {
    id: 4,
    title: 'Climate Change Report Shows Accelerating Trend',
    description:
      'New UN report indicates greenhouse gas emissions continue to rise despite international commitments to reduce carbon footprint.',
    category: 'Environment',
    source: 'The Guardian',
    time: '1 hr ago',
    image: 'https://picsum.photos/seed/newsintel-4/800/400',
    sentiment: 'negative' as const,
    score: 35,
  },
  {
    id: 5,
    title: 'Breakthrough in Quantum Computing Brings Practical Applications Closer',
    description:
      'Researchers demonstrate stable quantum states over longer periods, paving the way for practical quantum computers in coming years.',
    category: 'Science',
    source: 'Nature',
    time: '2 hrs ago',
    image: 'https://picsum.photos/seed/newsintel-5/800/400',
    sentiment: 'positive' as const,
    score: 94,
  },
];

const MOCK_INSIGHTS = [
  {
    id: 'insight-1',
    type: 'opportunity' as const,
    title: 'AI Sector Momentum',
    description:
      'Positive sentiment surge in AI companies following GPT-4.5 announcement. Companies with strong AI portfolios see increased investor interest.',
    confidence: 88,
    topics: ['AI', 'Technology', 'Investment'],
  },
  {
    id: 'insight-2',
    type: 'risk' as const,
    title: 'Climate Regulatory Risk',
    description:
      'New climate policies creating uncertainty for carbon-intensive industries. Expect volatility in energy and manufacturing sectors.',
    confidence: 76,
    topics: ['Climate', 'Regulation', 'Risk'],
  },
  {
    id: 'insight-3',
    type: 'trend' as const,
    title: 'EV Market Consolidation',
    description:
      'Major automakers accelerating EV transition. Market consolidation expected as competition intensifies in the electric vehicle space.',
    confidence: 82,
    topics: ['EVs', 'Automotive', 'Trend'],
  },
  {
    id: 'insight-4',
    type: 'opportunity' as const,
    title: 'Quantum Computing Investment',
    description:
      'Recent quantum computing breakthroughs attracting venture capital. Early-stage quantum companies seeing increased funding rounds.',
    confidence: 79,
    topics: ['Quantum', 'Tech', 'Investment'],
  },
];

export default function ComponentsShowcase() {
  const [searchOpen, setSearchOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Search Overlay */}
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-20">
        {/* Hero Section */}
        <motion.section
          className="relative space-y-6 pt-8"
          {...enterFadeUp(0, reduceMotion)}
        >
          {/* Subtle 3D accent (premium glass, not dominant) */}
          <div className="pointer-events-none absolute -top-10 right-[-40px] h-[360px] w-[420px] opacity-50 hidden md:block [mask-image:radial-gradient(circle_at_60%_45%,black,transparent_70%)]">
            <GlassSculptureCanvas className="h-full w-full" />
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
              Premium News Intelligence Components
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              A comprehensive showcase of the luxury-designed UI components built for the AI-powered News Intelligence Platform.
            </p>

            <motion.button
              onClick={() => setSearchOpen(true)}
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-5 py-3 text-sm font-medium text-foreground hover:bg-brand-accent/15 transition-colors"
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              transition={transition.soft}
            >
              Open Search
            </motion.button>
          </div>
        </motion.section>

        {/* Featured Article */}
        <motion.section
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={transition.fade}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold font-display text-foreground">Featured Story</h2>
          <FeaturedNewsCard {...MOCK_ARTICLES[0]} />
        </motion.section>

        {/* News Grid */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold font-display text-foreground">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_ARTICLES.slice(1, 4).map((article) => (
              <motion.div key={article.id} variants={itemVariants}>
                <NewsCard {...article} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* AI Insights */}
        <motion.section
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={transition.fade}
          viewport={{ once: true }}
        >
          <AIInsights insights={MOCK_INSIGHTS} />
        </motion.section>

        {/* Compact Cards */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold font-display text-foreground">Market Watch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MOCK_ARTICLES.slice(3, 5).map((article) => (
              <motion.div key={article.id} variants={itemVariants}>
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
          </div>
        </motion.section>

        {/* Demo Info */}
        <motion.section
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={transition.enter}
          viewport={{ once: true }}
          className="surface-card rounded-2xl p-8 border border-brand-accent/20"
        >
          <h3 className="text-xl font-bold font-display text-foreground mb-4">
            Component System
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-2">✓ Navigation Component</p>
              <p>Fixed top navigation with glassmorphism effect, responsive mobile menu, and action buttons.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">✓ Search Component</p>
              <p>Premium search interface with trending suggestions, recent searches, and smooth animations.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">✓ News Cards</p>
              <p>Three variants: Featured (large), Standard (grid), and Compact (list) with sentiment indicators.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">✓ AI Insights</p>
              <p>Luxury insight cards categorized by type with confidence scores and topic filtering.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">✓ Enhanced Footer</p>
              <p>Newsletter subscription, link sections, and social media integration with smooth animations.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">✓ Design Tokens</p>
              <p>Uses established color system, typography, spacing, and animation patterns.</p>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <EnhancedFooter />
    </div>
  );
}
