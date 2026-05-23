'use client';

import { Hero } from '@/components/home/Hero';
import { NewsFeed } from '@/components/home/NewsFeed';
import { Navigation } from '@/components/layout/Navigation';
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';
import { MotionConfig } from 'framer-motion';

// Mock articles for the news feed
const MOCK_NEWS_ARTICLES = [
  {
    id: 1,
    title: 'OpenAI Releases GPT-4.5 with Revolutionary Reasoning Capabilities',
    description: 'The latest version introduces advanced multi-step reasoning, improved factuality, and enhanced performance across coding and mathematical tasks.',
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
    description: 'Major indices gained 2.4% as earnings from leading technology firms beat analyst forecasts by wide margins.',
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
    description: 'Electric vehicle manufacturer reports highest quarterly production ever, surpassing analyst expectations by 12%.',
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
    description: 'New UN report indicates greenhouse gas emissions continue to rise despite international commitments.',
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
    description: 'Researchers demonstrate stable quantum states over longer periods, paving the way for practical quantum computers.',
    category: 'Science',
    source: 'Nature',
    time: '2 hrs ago',
    image: 'https://picsum.photos/seed/newsintel-5/800/400',
    sentiment: 'positive' as const,
    score: 94,
  },
  {
    id: 6,
    title: 'European Central Bank Holds Rates Steady Amid Mixed Inflation Signals',
    description: 'ECB maintains cautious approach as eurozone inflation shows signs of moderation in recent months.',
    category: 'Economics',
    source: 'Financial Times',
    time: '3 hrs ago',
    image: 'https://picsum.photos/seed/newsintel-6/800/400',
    sentiment: 'neutral' as const,
    score: 56,
  },
];

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative bg-background">
        <Navigation />
        <Hero />
        
        {/* News Feed Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <NewsFeed articles={MOCK_NEWS_ARTICLES} layout="grid" limit={6} />
        </section>

        <EnhancedFooter />
      </main>
    </MotionConfig>
  );
}
