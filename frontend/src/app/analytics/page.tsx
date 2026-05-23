'use client';

import { Navigation } from '@/components/layout/Navigation';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';
import { MotionConfig } from 'framer-motion';

export default function AnalyticsPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <AnalyticsDashboard />
        </main>

        <EnhancedFooter />
      </div>
    </MotionConfig>
  );
}
