'use client';

import { Navigation } from '@/components/layout/Navigation';
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';
import { MotionConfig } from 'framer-motion';

import HeroSection from '@/components/home/HeroSection';
import AISection from '@/components/home/AISection';
import AnalyticsSection from '@/components/home/AnalyticsSection';
import NewsSection from '@/components/home/NewsSection';
import CTASection from '@/components/home/CTASection';

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative bg-background min-h-screen selection:bg-brand-accent/30">
        <Navigation />
        
        <HeroSection />
        
        <div className="relative z-10 bg-background/40 backdrop-blur-2xl border-t border-white/5">
          <AISection />
          
          {/* Subtle divider */}
          <div className="max-w-7xl mx-auto w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
          
          <AnalyticsSection />
          
          {/* Subtle divider */}
          <div className="max-w-7xl mx-auto w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
          
          <NewsSection />
          
          <CTASection />
        </div>

        <EnhancedFooter />
      </main>
    </MotionConfig>
  );
}
