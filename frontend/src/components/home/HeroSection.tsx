'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import AmbientCanvas from './AmbientCanvas';

const stats = [
  { value: '50K+', label: 'Sources' },
  { value: '2M+', label: 'Articles' },
  { value: '<30s', label: 'Latency' },
  { value: '99.9%', label: 'Uptime' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16">

      {/* ── Background layers ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full home-glow-top" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.025] home-grid" />
        {/* Vignette */}
        <div className="absolute inset-0 home-vignette" />
      </div>

      {/* ── Ambient Canvas ── */}
      <div className="absolute inset-0">
        <AmbientCanvas />
      </div>

      {/* ── Content ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Status badge */}
        <motion.div variants={item}>
          <div className="tag mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sentiment-positive opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sentiment-positive" />
            </span>
            Live · AI-Powered Intelligence Platform
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="font-display text-5xl md:text-7xl lg:text-[82px] font-bold leading-[1.03] tracking-[-0.035em] text-foreground mb-6"
        >
          News Intelligence
          <br />
          <span className="gradient-text">Reimagined.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={item}
          className="text-lg md:text-xl text-muted-foreground max-w-[44rem] leading-relaxed mb-10 font-light"
        >
          Stop scrolling. Start understanding. AI-curated news with real-time sentiment analysis,
          credibility scoring, and personalized daily briefings — built for professionals.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-3 mb-16">
          <Link href="/dashboard" className="btn-primary text-sm gap-2">
            Open Platform
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/register" className="btn-ghost text-sm">
            <Sparkles className="w-4 h-4" />
            Start free trial
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={item}
          className="grid grid-cols-4 gap-8 w-full max-w-lg"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="font-display text-xl font-bold text-foreground tracking-tight">
                {s.value}
              </span>
              <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-muted-foreground/60" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Scroll</span>
      </motion.div>
    </section>
  );
}
