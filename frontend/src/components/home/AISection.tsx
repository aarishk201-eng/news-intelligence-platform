'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Brain, Zap, Target, ChevronRight } from 'lucide-react';

const capabilities = [
  {
    icon: Brain,
    title: 'Deep Context Analysis',
    description: 'Every article is passed through a multi-stage AI pipeline that extracts entities, themes, and hidden narratives — surfacing what matters most.',
  },
  {
    icon: Zap,
    title: 'Real-Time Sentiment',
    description: 'Market-grade sentiment scoring across millions of data points, updated every 30 seconds for maximum signal accuracy.',
  },
  {
    icon: Target,
    title: 'Credibility Intelligence',
    description: 'Cross-referenced fact verification and source credibility scoring, trained on decades of journalism standards.',
  },
];

const BRIEFING = {
  title: 'Your AI Morning Briefing',
  date: 'Tuesday, May 20th · 08:00 AM',
  summary: 'Today\'s market sentiment is cautiously optimistic (+62%). Technology and Finance sectors are driving positive narrative momentum, particularly around AI infrastructure investments. Three geopolitical developments warrant monitoring: energy corridor negotiations, central bank policy signals, and upcoming tech regulation hearings.',
  keyPoints: [
    'OpenAI\'s GPT-4 update sends positive signals across AI ecosystem stocks',
    'Federal Reserve language suggests rate hold through Q3 2025',
    'EU Digital Markets Act enforcement begins creating market shifts',
  ],
};

export default function AISection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="ai" className="relative px-6 py-32 md:px-12 overflow-hidden" ref={ref}>

      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] home-glow-left" />
      </div>

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 max-w-xl"
        >
          <div className="tag mb-4">AI Intelligence</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-4">
            Intelligence that
            <br />
            <span className="gradient-text">works for you.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Our AI layer doesn't just summarize news — it builds a dynamic understanding
            of the information landscape, surfacing insights you'd never find manually.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* Left: Capabilities */}
          <div className="space-y-5">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                    <cap.icon className="text-primary" size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-foreground mb-1.5">{cap.title}</h3>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed">{cap.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: AI Briefing Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-6 relative overflow-hidden"
          >
            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none glow-corner" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">AI Generated</p>
                <h3 className="font-display text-sm font-semibold text-foreground">{BRIEFING.title}</h3>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{BRIEFING.date}</p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-accent to-brand-accent-2">
                <Brain className="w-4 h-4 text-white" />
              </div>
            </div>

            <p className="text-[13px] text-muted-foreground leading-relaxed mb-5 border-l-2 border-primary/40 pl-3">
              {BRIEFING.summary}
            </p>

            <div className="space-y-2.5 mb-5">
              {BRIEFING.keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-primary" />
                  <span className="text-xs text-muted-foreground/80 leading-relaxed">{point}</span>
                </div>
              ))}
            </div>

            <button className="flex items-center gap-1.5 text-xs text-primary font-medium hover:gap-2.5 transition-all">
              Read full briefing <ChevronRight className="w-3 h-3" />
            </button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
