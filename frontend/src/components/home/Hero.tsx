'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GlassSculptureCanvas } from '@/components/three/GlassSculpture';
import { enterFadeUp, hoverScale, transition } from '@/lib/motion';

export function Hero() {
  const reduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section className="relative min-h-[92vh] overflow-hidden">
      {/* Background: Layered Gradients + Depth Lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/60" />
      
      {/* Subtle depth light (soft glow, bottom-left) */}
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-accent/8 blur-3xl opacity-30" />
      
      {/* Subtle depth light (bottom-right) */}
      <div className="absolute -bottom-48 right-1/4 h-80 w-80 rounded-full bg-brand-accent/5 blur-3xl opacity-20" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: Text + CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Headline */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-foreground leading-tight tracking-tight">
                Real-time news.
                <br />
                <span className="bg-gradient-to-r from-brand-accent via-brand-accent-2 to-brand-accent/80 bg-clip-text text-transparent">
                  Intelligent insights.
                </span>
              </h1>
            </motion.div>

            {/* Subtext */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed"
            >
              AI-powered analysis designed for modern intelligence. Transform raw news into actionable market insights in seconds.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              {/* Primary CTA */}
              <Link href="/dashboard">
                <motion.button
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent/25 px-7 py-4 font-medium text-foreground border border-brand-accent/40 hover:bg-brand-accent/35 transition-colors"
                  {...hoverScale(1.01, reduceMotion)}
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                >
                  Start Analyzing
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              {/* Secondary CTA */}
              <Link href="/components-showcase">
                <motion.button
                  className="inline-flex items-center justify-center rounded-xl bg-white/5 px-7 py-4 font-medium text-foreground border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
                  {...hoverScale(1.01, reduceMotion)}
                  whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                >
                  Explore Components
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div variants={itemVariants} className="pt-8 flex items-center gap-8 text-sm text-muted-foreground border-t border-white/8">
              <div className="space-y-1">
                <div className="text-foreground font-semibold">99.9%</div>
                <div className="text-xs">Uptime SLA</div>
              </div>
              <div className="space-y-1">
                <div className="text-foreground font-semibold">500M+</div>
                <div className="text-xs">Articles Analyzed</div>
              </div>
              <div className="space-y-1">
                <div className="text-foreground font-semibold">&lt;2s</div>
                <div className="text-xs">Insight Latency</div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT: 3D Glass Sculpture */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            {/* Subtle glow behind sculpture */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/20 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* 3D Canvas Container */}
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/8 bg-gradient-to-br from-white/5 to-white/[0.02]">
              <GlassSculptureCanvas className="h-full w-full" />

              {/* Elegant frame overlay */}
              <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
              
              {/* Subtle vignette */}
              <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 30%, black/20) rounded-3xl pointer-events-none" />
            </div>

            {/* Floating accent label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground"
            >
              <div className="w-2 h-2 rounded-full bg-brand-accent/60" />
              Premium AI Analysis in Real-Time
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Subtle horizontal line accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent origin-left"
      />
    </section>
  );
}
