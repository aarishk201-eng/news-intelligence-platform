'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section className="relative px-6 py-32 md:px-12" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden cta-surface"
        >
          {/* Inner glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 home-glow-top" />
          </div>

          <div className="relative px-8 py-16 text-center md:px-16">
            <div className="tag mx-auto mb-6">Early Access</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-4">
              Ready to transform how
              <br />
              <span className="gradient-text">you consume news?</span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto mb-10">
              Join thousands of professionals, investors, and analysts who rely on
              NewsIntel to stay ahead of what matters.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="btn-primary">
                Get started — it's free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="btn-ghost">
                Explore the platform
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              {['No credit card required', 'Cancel anytime', 'SOC 2 Compliant'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <svg className="w-3.5 h-3.5 text-sentiment-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
