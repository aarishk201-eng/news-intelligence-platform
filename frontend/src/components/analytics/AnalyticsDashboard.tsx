'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, Zap } from 'lucide-react';
import { transition } from '@/lib/motion';
import styles from './AnalyticsDashboard.module.css';

// Sentiment data for overview
const sentimentData = [
  { name: 'Positive', value: 42, color: '#10b981' },
  { name: 'Neutral', value: 38, color: '#6b7280' },
  { name: 'Negative', value: 20, color: '#ef4444' },
];

// Article metrics (trend over time)
const articleMetrics = [
  { time: '00:00', articles: 124, insights: 18 },
  { time: '04:00', articles: 156, insights: 24 },
  { time: '08:00', articles: 198, insights: 32 },
  { time: '12:00', articles: 287, insights: 45 },
  { time: '16:00', articles: 342, insights: 58 },
  { time: '20:00', articles: 405, insights: 72 },
  { time: '24:00', articles: 468, insights: 84 },
];

// Trending topics
const trendingTopics = [
  { name: 'AI Innovation', mentions: 342, sentiment: 'positive', trend: 24 },
  { name: 'Market Volatility', mentions: 298, sentiment: 'neutral', trend: -8 },
  { name: 'Tech Earnings', mentions: 267, sentiment: 'positive', trend: 12 },
  { name: 'Climate Policy', mentions: 189, sentiment: 'negative', trend: -15 },
  { name: 'Quantum Computing', mentions: 156, sentiment: 'positive', trend: 34 },
];

// Custom tooltip for charts
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg bg-background/80 border border-white/10 p-2 backdrop-blur-md">
      <p className="text-xs text-foreground font-semibold">{payload[0].payload.name || payload[0].payload.time}</p>
      <p className="text-xs text-brand-accent">{payload[0].value}</p>
    </div>
  );
}

function AnalyticsCard({
  title,
  children,
  icon: Icon,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  icon?: any;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ ...transition.enter, delay }}
      viewport={{ once: true }}
      className="surface-card rounded-2xl p-6 border border-white/8 hover:border-white/12 transition-colors"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold font-display text-foreground">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-brand-accent/60" />}
      </div>
      {children}
    </motion.div>
  );
}

export function AnalyticsDashboard() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={transition.enter}
        viewport={{ once: true }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand-accent" />
          <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider">
            Analytics & Insights
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
          Intelligence Metrics
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Real-time analytics on market sentiment, trending topics, and AI-generated insights.
        </p>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Overview */}
        <AnalyticsCard title="Sentiment Distribution" icon={TrendingUp} delay={0.08}>
          <div className="flex items-center justify-center h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={!reduceMotion}
                  animationDuration={1400}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/8">
            {sentimentData.map((item) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <div className={styles.colorDot} style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-foreground">{item.value}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.name}</p>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        {/* Article Metrics */}
        <AnalyticsCard title="Content Activity" icon={BarChart3} delay={0.12}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={articleMetrics} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C8CFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C8CFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
                <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="articles"
                  stroke="#7C8CFF"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={!reduceMotion}
                  animationDuration={1400}
                  fillOpacity={1}
                  fill="url(#colorArticles)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>

      {/* Trending Topics */}
      <AnalyticsCard title="Trending Topics" icon={Zap} delay={0.16}>
        <div className="space-y-3">
          {trendingTopics.map((topic, index) => (
            <motion.div
              key={topic.name}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ ...transition.enter, delay: 0.2 + index * 0.06 }}
              viewport={{ once: true }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{topic.name}</h4>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-md ${
                      topic.sentiment === 'positive'
                        ? 'bg-green-400/15 text-green-400'
                        : topic.sentiment === 'negative'
                          ? 'bg-red-400/15 text-red-400'
                          : 'bg-gray-400/15 text-gray-400'
                    }`}
                  >
                    {topic.sentiment}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{topic.mentions} mentions across sources</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{topic.mentions}</p>
                  <p
                    className={`text-xs font-semibold ${topic.trend > 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {topic.trend > 0 ? '+' : ''}{topic.trend}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnalyticsCard>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Avg Sentiment Score', value: '72.3%', change: '+2.1%' },
          { label: 'Articles Processed', value: '1,847', change: '+340 today' },
          { label: 'AI Insights Generated', value: '284', change: '+18%' },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...transition.enter, delay: 0.24 + index * 0.08 }}
            viewport={{ once: true }}
            className="surface-card rounded-2xl p-6 border border-white/8"
          >
            <p className="text-xs text-muted-foreground mb-2">{metric.label}</p>
            <p className="text-3xl font-bold font-display text-foreground mb-2">{metric.value}</p>
            <p className="text-xs text-brand-accent font-semibold">{metric.change}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
