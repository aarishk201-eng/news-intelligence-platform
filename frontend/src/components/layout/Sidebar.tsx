'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Newspaper, TrendingUp, Brain, Bookmark,
  Search, BarChart2, Settings, Rss, Globe, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/feed', icon: Newspaper, label: 'News Feed' },
  { href: '/dashboard/trending', icon: TrendingUp, label: 'Trending' },
  { href: '/dashboard/ai', icon: Brain, label: 'AI Assistant' },
  { href: '/dashboard/saved', icon: Bookmark, label: 'Saved' },
  { href: '/dashboard/search', icon: Search, label: 'Search' },
  { href: '/dashboard/sources', icon: Globe, label: 'Sources' },
  { href: '/dashboard/feeds', icon: Rss, label: 'My Feeds' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();

  return (
    <aside
      className={cn(
        'surface-panel relative flex h-full flex-col border-r border-border/70 transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border/70 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/95 to-primary/60 shadow-premium">
          <Brain className="h-4 w-4 text-white" />
        </div>
        {sidebarOpen && (
          <span className="ml-2.5 font-heading text-lg font-bold gradient-text">NewsIntel</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide p-3">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={!sidebarOpen ? label : undefined}
              className={cn(
                'nav-link',
                isActive && 'active',
                !sidebarOpen && 'justify-center px-2'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex h-10 w-full items-center justify-center border-t border-border text-muted-foreground transition-colors hover:text-foreground"
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </aside>
  );
}
