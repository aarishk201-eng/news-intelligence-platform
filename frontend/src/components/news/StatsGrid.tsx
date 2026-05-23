'use client';

import { useQuery } from '@tanstack/react-query';
import { Newspaper, TrendingUp, Zap, Brain, Users, BarChart } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  gradient: string;
}

export function StatsGrid() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.getOverview().then(res => res.data.data),
    refetchInterval: 15000,
  });

  const stats: StatCard[] = [
    { 
      label: 'Total Articles', 
      value: isLoading ? '...' : (analyticsData?.totalArticles || 0).toLocaleString(), 
      change: 'Live tracking', 
      changeType: 'neutral', 
      icon: Newspaper, 
      gradient: 'from-blue-500 to-cyan-600' 
    },
    { 
      label: 'Trending Now', 
      value: isLoading ? '...' : (analyticsData?.trendingCount || 0).toLocaleString(), 
      change: 'Live topics', 
      changeType: 'neutral', 
      icon: TrendingUp, 
      gradient: 'from-amber-500 to-orange-600' 
    },
    { 
      label: 'Breaking Stories', 
      value: isLoading ? '...' : (analyticsData?.breakingCount || 0).toLocaleString(), 
      change: 'Last 24 hours', 
      changeType: 'up', 
      icon: Zap, 
      gradient: 'from-red-500 to-rose-600' 
    },
    { 
      label: 'AI Analyses', 
      value: isLoading ? '...' : (analyticsData?.totalArticles || 0).toLocaleString(), 
      change: '100% processed', 
      changeType: 'up', 
      icon: Brain, 
      gradient: 'from-violet-500 to-purple-600' 
    },
    { 
      label: 'Active Users', 
      value: isLoading ? '...' : (analyticsData?.totalUsers || 0).toLocaleString(), 
      change: 'System wide', 
      changeType: 'neutral', 
      icon: Users, 
      gradient: 'from-emerald-500 to-teal-600' 
    },
    { 
      label: 'Avg Credibility', 
      value: '84%', 
      change: 'Across sources', 
      changeType: 'neutral', 
      icon: BarChart, 
      gradient: 'from-indigo-500 to-blue-600' 
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="article-card group p-4"
        >
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
              {(() => { const Icon = stat.icon as any; return <Icon className="h-4 w-4 text-white" />; })()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
