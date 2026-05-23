'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { enterFadeUp, hoverLift, hoverScale } from '@/lib/motion';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';

interface InsightItem {
  id: string;
  type: 'opportunity' | 'risk' | 'trend';
  title: string;
  description: string;
  confidence: number;
  topics: string[];
}

interface AIInsightsProps {
  insights: InsightItem[];
  isLoading?: boolean;
}

const insightConfig = {
  opportunity: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
    label: 'Opportunity',
  },
  risk: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    label: 'Risk',
  },
  trend: {
    icon: TrendingUp,
    color: 'text-brand-accent',
    bg: 'bg-brand-accent/10',
    border: 'border-brand-accent/20',
    label: 'Trend',
  },
};

export function AIInsights({ insights, isLoading = false }: AIInsightsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="space-y-6">
      <motion.div {...enterFadeUp(0, reduceMotion)}>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-brand-accent" />
          <h2 className="text-2xl font-bold font-display text-foreground">AI Insights</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="surface-card rounded-2xl p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 bg-white/10 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-5/6" />
                  </div>
                  <div className="h-8 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <AIInsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}

interface AIInsightCardProps {
  insight: InsightItem;
  index: number;
}

export function AIInsightCard({ insight, index }: AIInsightCardProps) {
  const reduceMotion = useReducedMotion();
  const config = insightConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      className="group surface-card rounded-2xl p-6 cursor-pointer hover:border-brand-accent/40 transition-all border border-white/8"
      {...enterFadeUp(index * 0.06, reduceMotion)}
      {...hoverLift(-2, reduceMotion)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${config.bg} border ${config.border}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <span className={`text-xs font-semibold ${config.color}`}>{insight.confidence}%</span>
        </div>
      </div>

      {/* Type Label */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${config.bg} border ${config.border} mb-3`}>
        <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2 leading-snug">
        {insight.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {insight.description}
      </p>

      {/* Topics Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {insight.topics.slice(0, 3).map((topic) => (
          <span
            key={topic}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground bg-white/5 border border-white/10"
          >
            {topic}
          </span>
        ))}
        {insight.topics.length > 3 && (
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground bg-white/5 border border-white/10">
            +{insight.topics.length - 3}
          </span>
        )}
      </div>

      {/* CTA */}
      <motion.button
        className="w-full group/btn flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-foreground bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent/20 hover:border-brand-accent/40 transition-colors"
        {...hoverScale(1.01, reduceMotion)}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      >
        <span>Explore Insight</span>
        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
      </motion.button>
    </motion.div>
  );
}

export function MinimalAIInsight({
  title,
  content,
  confidence,
}: {
  title: string;
  content: string;
  confidence: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="surface-card rounded-xl p-4 border border-brand-accent/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-accent" />
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{content}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-muted-foreground">Confidence</div>
          <div className="text-sm font-semibold text-brand-accent">{confidence}%</div>
        </div>
      </div>
    </motion.div>
  );
}
