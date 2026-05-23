'use client';

import Link from 'next/link';

const footerLinks = {
  Product: ['Dashboard', 'AI Briefings', 'Analytics', 'API'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Legal: ['Privacy', 'Terms', 'Security', 'Cookies'],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-border/50 px-6 py-16 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-6 w-6 rounded-md flex items-center justify-center bg-gradient-to-br from-brand-accent to-brand-accent-2">
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.4" fill="none"/>
                  <circle cx="7" cy="7" r="1.5" fill="white"/>
                </svg>
              </div>
              <span className="font-display text-sm font-semibold text-foreground">NewsIntel</span>
            </div>
            <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-[160px]">
              AI-powered news intelligence for the modern professional.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border/50 pt-6">
          <span className="text-[11px] text-muted-foreground/60">
            © 2025 NewsIntel. All rights reserved.
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sentiment-positive animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
