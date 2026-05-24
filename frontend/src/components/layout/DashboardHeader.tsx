'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Bell, Moon, Sun, MessageSquare, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUiStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

export function DashboardHeader() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);
  const { setSearchOpen, setAiChatOpen } = useUiStore();
  const { user, clearAuth } = useAuthStore();

  return (
    <header className="surface-panel flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-6">
      {/* Left: Search trigger */}
      <button
        id="search-trigger"
        onClick={() => setSearchOpen(true)}
        className={cn(
          'flex w-72 items-center gap-2 rounded-xl border border-border/70 bg-background/25 backdrop-blur-md',
          'px-3 py-2 text-sm text-muted-foreground transition-all',
          'hover:border-primary/30 hover:text-foreground'
        )}
      >
        <Search className="h-4 w-4" />
        <span>Search news, topics, sources…</span>
        <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* AI Chat */}
        <Link
          id="ai-chat-trigger"
          href="/dashboard/ai"
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:block">AI Chat</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border/50 bg-background/95 p-4 shadow-xl backdrop-blur-md z-50 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <span className="text-xs text-primary cursor-pointer hover:underline">Mark all as read</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Daily Briefing Ready</p>
                    <p className="text-xs text-muted-foreground">Your AI summary of today's top stories is available.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start opacity-70">
                  <div className="h-2 w-2 rounded-full bg-transparent mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">New Source Added</p>
                    <p className="text-xs text-muted-foreground">TechCrunch has been added to your feeds.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Toggle theme"
        >
          {mounted ? (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <div className="h-4 w-4" />}
        </button>

        {/* User avatar */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity p-1 rounded-lg focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            {user && (
              <div className="hidden flex-col text-left md:flex">
                <span className="text-sm font-medium leading-none">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
            )}
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/50 bg-background/95 p-2 shadow-xl backdrop-blur-md z-50 animate-in slide-in-from-top-2">
              <div className="px-2 py-2 border-b border-border/50 mb-1">
                <p className="text-sm font-medium">{user?.name || 'Guest'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'guest@newsintel.ai'}</p>
              </div>
              <div className="space-y-1">
                <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  Profile Settings
                </Link>
                <Link href="/dashboard/feeds" onClick={() => setProfileOpen(false)} className="block px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  My Feeds
                </Link>
                <button
                  onClick={() => {
                    clearAuth();
                    router.push('/login');
                  }}
                  className="w-full text-left block px-3 py-2 text-sm rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
