'use client';

import { useQuery } from '@tanstack/react-query';
import { Newspaper, TrendingUp, Zap, Brain, Users, BarChart, type LucideIcon } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  gradient: string;
}

const fallbackStats: StatItem[] = [
  { label: 'Total Articles', value: '—', change: 'Loading...', changeType: 'neutral', icon: Newspaper, gradient: 'from-blue-500 to-cyan-600' },
  { label: 'Trending Now', value: '—', change: 'Loading...', changeType: 'neutral', icon: TrendingUp, gradient: 'from-amber-500 to-orange-600' },
  { label: 'Breaking Stories', value: '—', change: 'Loading...', changeType: 'neutral', icon: Zap, gradient: 'from-red-500 to-rose-600' },
  { label: 'AI Analyses', value: '—', change: 'Loading...', changeType: 'neutral', icon: Brain, gradient: 'from-violet-500 to-purple-600' },
  { label: 'Active Users', value: '—', change: 'Loading...', changeType: 'neutral', icon: Users, gradient: 'from-emerald-500 to-teal-600' },
  { label: 'Avg Credibility', value: '—', change: 'Loading...', changeType: 'neutral', icon: BarChart, gradient: 'from-indigo-500 to-blue-600' },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function StatsGrid() {
  const { data: statsData } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      const res = await analyticsApi.getStats();
      return res.data?.data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const stats: StatItem[] = statsData
    ? [
        { label: 'Total Articles', value: formatNumber(statsData.totalArticles), change: 'In database', changeType: 'neutral' as const, icon: Newspaper, gradient: 'from-blue-500 to-cyan-600' },
        { label: 'Trending Now', value: statsData.trendingCount, change: 'Live topics', changeType: 'neutral' as const, icon: TrendingUp, gradient: 'from-amber-500 to-orange-600' },
        { label: 'Breaking Stories', value: statsData.breakingCount, change: 'Active', changeType: 'up' as const, icon: Zap, gradient: 'from-red-500 to-rose-600' },
        { label: 'AI Analyses', value: formatNumber(statsData.analyzedCount), change: 'Processed', changeType: 'up' as const, icon: Brain, gradient: 'from-violet-500 to-purple-600' },
        { label: 'Active Users', value: formatNumber(statsData.activeUsers), change: 'This week', changeType: 'up' as const, icon: Users, gradient: 'from-emerald-500 to-teal-600' },
        { label: 'Avg Credibility', value: `${statsData.avgCredibility}%`, change: 'Across sources', changeType: 'neutral' as const, icon: BarChart, gradient: 'from-indigo-500 to-blue-600' },
      ]
    : fallbackStats;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="article-card group p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-foreground">{stat.value}</p>
                {stat.change && (
                  <p className={cn(
                    'mt-1 text-xs',
                    stat.changeType === 'up' ? 'text-emerald-500' :
                    stat.changeType === 'down' ? 'text-red-500' :
                    'text-muted-foreground'
                  )}>
                    {stat.changeType === 'up' ? '↑ ' : stat.changeType === 'down' ? '↓ ' : ''}{stat.change}
                  </p>
                )}
              </div>
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
                stat.gradient
              )}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
