'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Hash } from 'lucide-react';
import { aiApi } from '@/lib/api';

const MOCK_TOPICS = [
  'AI regulation debate', 'Federal Reserve rates', 'Ukraine ceasefire talks',
  'Climate summit 2024', 'Tech layoffs wave', 'SpaceX Starship launch',
  'Gaza humanitarian aid', 'OpenAI GPT-5 release', 'US election 2024',
  'Bank of England policy',
];

export function TrendingTopics() {
  const { data, isLoading } = useQuery({
    queryKey: ['trending-topics'],
    queryFn: () => aiApi.getTrending(),
    select: (res) => (res.data as { data: { topics: string[] } }).data?.topics as string[],
    staleTime: 10 * 60 * 1000,
    refetchInterval: 30000,
  });

  const topics = (data && data.length > 0) ? data : MOCK_TOPICS;

  return (
    <div className="surface-card rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">AI Trending Topics</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-8 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {topics.slice(0, 10).map((topicItem, i) => {
            const topicName = typeof topicItem === 'string' ? topicItem : (topicItem as any).topic;
            return (
              <button
                key={topicName}
                id={`topic-${i}`}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="w-4 shrink-0 text-xs font-bold text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Hash className="h-3 w-3 shrink-0 text-primary" />
                <span className="truncate text-foreground">{topicName}</span>
                {i < 3 && (
                  <span className="ml-auto shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-500">
                    Hot
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
