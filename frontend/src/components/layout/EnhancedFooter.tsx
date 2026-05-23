'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { easeCinematic, hoverScale, transition } from '@/lib/motion';
import Link from 'next/link';
import { Mail, Github, Twitter, Linkedin, Send } from 'lucide-react';
import { useState } from 'react';

export function EnhancedFooter() {
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 3000);
    }
  };

  const footerLinks = {
    Product: [
      { label: 'Features', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'API Docs', href: '#' },
    ],
    Company: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Disclaimer', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: easeCinematic,
      },
    },
  };

  return (
    <footer className="relative border-t border-white/8 bg-gradient-to-b from-background to-background/80">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Newsletter Section */}
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={transition.enter}
          viewport={{ once: true }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-b border-white/8"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold font-display text-foreground mb-2">
                Stay Updated
              </h3>
              <p className="text-muted-foreground">
                Get the latest AI-powered news insights delivered to your inbox weekly.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-accent/50 transition-colors"
                disabled={subscribed}
              />
              <motion.button
                type="submit"
                className="px-6 py-3 rounded-lg bg-brand-accent/20 border border-brand-accent/40 text-foreground font-medium hover:bg-brand-accent/30 transition-colors flex items-center gap-2"
                {...hoverScale(1.02, reduceMotion)}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                disabled={subscribed}
              >
                {subscribed ? (
                  <span>Subscribed!</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Subscribe</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Footer Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <motion.div variants={itemVariants} className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6 group">
                <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-brand-accent to-brand-accent-2 flex items-center justify-center">
                  <span className="text-white font-bold">NI</span>
                </div>
                <span className="font-display font-bold text-lg text-white group-hover:text-brand-accent transition-colors">
                  NewsIntel
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered news intelligence platform delivering real-time insights and sentiment analysis.
              </p>
            </motion.div>

            {/* Footer Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <motion.div key={category} variants={itemVariants}>
                <h4 className="text-sm font-semibold text-foreground mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Divider */}
          <motion.div variants={itemVariants} className="border-t border-white/8 pt-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Copyright */}
              <div className="text-sm text-muted-foreground">
                <p>© 2024 NewsIntel. All rights reserved.</p>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      className="p-2 rounded-lg text-muted-foreground hover:text-brand-accent hover:bg-brand-accent/10 transition-colors"
                      {...hoverScale(1.03, reduceMotion)}
                      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                      title={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
