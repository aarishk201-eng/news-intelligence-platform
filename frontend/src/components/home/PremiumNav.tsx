'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'Intelligence', href: '#ai' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Pricing', href: '#pricing' },
];

export default function PremiumNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12',
        'transition-colors duration-300 ease-out',
        scrolled
          ? 'bg-background/60 backdrop-blur-2xl border-b border-border/60'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="relative h-7 w-7">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-accent to-brand-accent-2 shadow-lg shadow-brand-accent/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="7" cy="7" r="1.5" fill="white"/>
            </svg>
          </div>
        </div>
        <span className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">
          NewsIntel
        </span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="hidden md:inline-block text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
        <Link href="/dashboard" className="btn-primary text-[13px] py-2 px-5">
          Open Dashboard
        </Link>
      </div>
    </motion.nav>
  );
}
