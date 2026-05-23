import type { Metadata } from 'next';
import { StatsGrid } from '@/components/news/StatsGrid';
import { NewsFeed } from '@/components/news/NewsFeed';
import { TrendingTopics } from '@/components/news/TrendingTopics';
import { AiBriefing } from '@/components/news/AiBriefing';
import { SentimentChart } from '@/components/charts/SentimentChart';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Dashboard' };


export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">News Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your AI-curated intelligence briefing — updated in real time.
        </p>
      </div>

      {/* Stats row */}
      <StatsGrid />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Feed + Briefing */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="shrink-0"><AiBriefing /></div>
          <NewsFeed />
        </div>

        {/* Right column: Trending + Chart */}
        <div className="flex flex-col gap-6">
          <div className="shrink-0"><TrendingTopics /></div>
          <div className="flex-1 min-h-[300px] shrink-0">
            <SentimentChart />
          </div>
        </div>
      </div>
    </div>
  );
}
