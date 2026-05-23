'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { BarChart2, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const TREND_DATA = [
  { label: 'AI & Tech', value: 78, delta: +12 },
  { label: 'Energy', value: 54, delta: -4 },
  { label: 'Finance', value: 86, delta: +8 },
  { label: 'Geopolitics', value: 42, delta: -9 },
  { label: 'Healthcare', value: 65, delta: +3 },
  { label: 'Climate', value: 58, delta: +1 },
];

const METRICS = [
  { label: 'Articles Processed', value: '2.4M', sub: '+18% this week' },
  { label: 'Avg. Sentiment Score', value: '67.2', sub: 'Cautiously Optimistic' },
  { label: 'Trending Topics', value: '348', sub: 'Tracked in real-time' },
  { label: 'Source Credibility', value: '94.1%', sub: 'Avg. across network' },
];

export default function AnalyticsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

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
          {METRICS.map((m, i) => (
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
          ))}
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
              <h3 className="font-display text-sm font-semibold text-foreground mb-0.5">Topic Momentum Index</h3>
              <p className="text-xs text-muted-foreground/60">Narrative velocity by category — last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="w-3.5 h-3.5" />
              Live
            </div>
          </div>

          <div className="space-y-4">
            {TREND_DATA.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.07, duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <span className="text-xs text-muted-foreground w-24 shrink-0">{t.label}</span>
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
