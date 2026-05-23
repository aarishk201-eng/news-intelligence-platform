'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Moon, Sun, MessageSquare, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUiStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

export function DashboardHeader() {
  const [mounted, setMounted] = useState(false);
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
        <button
          id="ai-chat-trigger"
          onClick={() => setAiChatOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:block">AI Chat</span>
        </button>

        {/* Notifications */}
        <button
          id="notifications-btn"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

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
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          {user && (
            <div className="hidden flex-col md:flex">
              <span className="text-sm font-medium leading-none">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
