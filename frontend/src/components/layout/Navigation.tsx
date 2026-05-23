'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { hoverScale, transition } from '@/lib/motion';
import Link from 'next/link';
import { Search, Menu, X, Bell, User } from 'lucide-react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const reduceMotion = useReducedMotion();

  const navItems = [
    { label: 'News', href: '/news' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Insights', href: '/insights' },
    { label: 'Watchlist', href: '/watchlist' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-white/8">
        <div className="surface-card/95 backdrop-blur-xl">
          <div className="mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-brand-accent to-brand-accent-2 flex items-center justify-center">
                <span className="text-white font-bold text-sm">NI</span>
              </div>
              <span className="hidden sm:inline font-display font-bold text-lg text-white group-hover:text-brand-accent transition-colors">
                NewsIntel
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search */}
              <motion.button
                onClick={() => setSearchActive(!searchActive)}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                {...hoverScale(1.02, reduceMotion)}
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Notifications */}
              <motion.button
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                {...hoverScale(1.02, reduceMotion)}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-accent rounded-full"></span>
              </motion.button>

              {/* User Menu */}
              <motion.button
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                {...hoverScale(1.02, reduceMotion)}
              >
                <User className="w-5 h-5" />
              </motion.button>

              {/* Mobile Menu Toggle */}
              <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                {...hoverScale(1.02, reduceMotion)}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <motion.div
            initial={false}
            animate={isOpen ? 'open' : 'closed'}
            variants={{
              open: { height: 'auto', opacity: 1 },
              closed: { height: 0, opacity: 0 },
            }}
            transition={transition.soft}
            className="overflow-hidden md:hidden border-t border-white/8"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link block w-full"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Search Overlay */}
      {searchActive && (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={transition.fade}
          onClick={() => setSearchActive(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
        />
      )}
    </>
  );
}
