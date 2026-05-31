'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { BarChart2, TrendingUp, TrendingDown, Activity, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, aiApi } from '@/lib/api';

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const getSentimentText = (score?: number) => {
  if (score === undefined || score === null) return 'Neutral';
  if (score > 0.3) return 'Bullish';
  if (score > 0.1) return 'Cautiously Optimistic';
  if (score > -0.1) return 'Neutral';
  if (score > -0.3) return 'Cautiously Pessimistic';
  return 'Bearish';
};

export default function AnalyticsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  // Fetch overview metrics
  const { data: overviewData, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['landing-analytics-overview'],
    queryFn: async () => {
      const response = await analyticsApi.getOverview();
      return response.data;
    },
    staleTime: 60000,
  });

  // Fetch trending topics
  const { data: trendingData, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['landing-analytics-trending'],
    queryFn: async () => {
      const response = await aiApi.getTrending();
      return response.data;
    },
    staleTime: 60000,
  });

  const overview = overviewData?.data || {};
  // Fix: Handle both the old string array format and the new object array format,
  // and safely extract from .topics since the API returns { topics: [...], count: x }
  const trendingRaw = Array.isArray(trendingData?.data?.topics) 
    ? trendingData.data.topics 
    : Array.isArray(trendingData?.data) 
      ? trendingData.data 
      : [];

  const metrics = [
    { label: 'Articles Processed', value: formatNumber(overview.articlesAnalyzed), sub: 'Tracked in real-time' },
    { label: 'Avg. Sentiment Score', value: Math.abs(Math.round((overview.averageSentiment || 0) * 100)).toString(), sub: getSentimentText(overview.averageSentiment) },
    { label: 'Alerts Dispatched', value: formatNumber(overview.alertsDispatched), sub: 'Critical intel flagged' },
    { label: 'Active Data Sensors', value: (overview.activeSensors || 0).toString(), sub: 'Global coverage' },
  ];

  const trendData = trendingRaw.map((t: any) => {
    if (typeof t === 'string') {
      return {
        label: t,
        value: 75,
        delta: 5
      };
    }
    return {
      label: t.topic || 'Unknown',
      value: Math.min((t.count || 0) * 8, 100),
      delta: t.sentiment === 'positive' ? 12 : t.sentiment === 'negative' ? -8 : 2
    };
  });

  // Fallback if no trending data
  const finalTrends = trendData.length > 0 ? trendData : [
    { label: 'AI & Tech', value: 78, delta: +12 },
    { label: 'Finance', value: 86, delta: +8 },
    { label: 'Geopolitics', value: 42, delta: -9 },
  ];

  return (
    <section id="analytics" className="relative px-6 py-32 md:px-12" ref={ref}>
      {/* Right glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] home-glow-right" />
      </div>

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <div className="tag mx-auto mb-4">Analytics</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-4">
            Data that drives
            <br />
            <span className="gradient-text">better decisions.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
            Comprehensive analytics across every dimension of the news landscape,
            updated in real time.
          </p>
        </motion.div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoadingOverview ? (
             Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-5 animate-pulse h-28 flex flex-col justify-center">
                  <div className="h-8 bg-white/10 w-1/2 rounded mb-2" />
                  <div className="h-3 bg-white/5 w-3/4 rounded mb-1" />
                  <div className="h-3 bg-white/5 w-1/2 rounded" />
                </div>
             ))
          ) : (
            metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card p-5"
              >
                <div className="font-display text-2xl font-bold text-foreground mb-1">{m.value}</div>
                <div className="text-[11px] text-muted-foreground/60 font-medium mb-0.5">{m.label}</div>
                <div className="text-[11px] text-primary">{m.sub}</div>
              </motion.div>
            ))
          )}
        </div>

        {/* Trend Bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground mb-0.5 flex items-center gap-2">
                Topic Momentum Index
                {isLoadingTrending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
              </h3>
              <p className="text-xs text-muted-foreground/60">Narrative velocity by category — last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Live
            </div>
          </div>

          <div className="space-y-4">
            {finalTrends.map((t: any, i: number) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.07, duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">{t.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-foreground/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${t.value}%` } : { width: 0 }}
                    transition={{ delay: 0.6 + i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={
                      t.value > 70
                        ? 'h-full rounded-full bg-gradient-to-r from-brand-accent to-brand-accent-2'
                        : t.value > 50
                        ? 'h-full rounded-full bg-gradient-to-r from-brand-accent-2 to-muted-foreground'
                        : 'h-full rounded-full bg-gradient-to-r from-muted-foreground/70 to-muted-foreground/30'
                    }
                  />
                </div>
                <div className="flex items-center gap-1 w-14 justify-end">
                  <span className={t.delta >= 0 ? 'text-xs font-medium text-sentiment-positive' : 'text-xs font-medium text-sentiment-negative'}>
                    {t.delta >= 0 ? (
                      <TrendingUp className="w-3 h-3 inline mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 inline mr-0.5" />
                    )}
                    {Math.abs(t.delta)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
