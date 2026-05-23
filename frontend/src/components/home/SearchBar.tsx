'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { enterFadeDown, enterFadeUp, hoverSlideX, transition } from '@/lib/motion';
import { Search, Clock, TrendingUp, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function SearchBar({
  placeholder = 'Search news, trends, companies...',
  onSearch,
  onClose,
  isOpen = true,
}: SearchBarProps) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const suggestions = ['AI Breakthroughs', 'Market Analysis', 'Tech News', 'Climate Reports'];
  const recentSearches = ['OpenAI', 'Tesla', 'Climate Tech'];

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
      setQuery('');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      {...enterFadeDown(0, reduceMotion)}
      className="fixed inset-x-0 top-0 z-50 p-4 sm:p-6 pt-20"
    >
      <div className="mx-auto max-w-2xl">
        {/* Search Input */}
        <div className="relative">
          <div className="surface-card rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(query);
                  if (e.key === 'Escape') onClose?.();
                }}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-lg"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  title="Clear search"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => onClose?.()}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                ESC
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions & History */}
        {!query && (
          <motion.div
            {...enterFadeUp(0.08, reduceMotion)}
            transition={{ ...transition.soft, delay: 0.08 }}
            className="mt-6 space-y-4"
          >
            {/* Recent Searches */}
            <div>
              <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Clock className="inline w-3 h-3 mr-1" />
                Recent
              </h3>
              <div className="mt-3 space-y-2">
                {recentSearches.map((search) => (
                  <motion.button
                    key={search}
                    onClick={() => handleSearch(search)}
                    className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left text-foreground"
                    {...hoverSlideX(2, reduceMotion)}
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{search}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Trending Suggestions */}
            <div>
              <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                Trending
              </h3>
              <div className="mt-3 space-y-2">
                {suggestions.map((suggestion) => (
                  <motion.button
                    key={suggestion}
                    onClick={() => handleSearch(suggestion)}
                    className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left text-foreground"
                    {...hoverSlideX(2, reduceMotion)}
                  >
                    <TrendingUp className="w-4 h-4 text-brand-accent" />
                    <span>{suggestion}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Results Placeholder */}
        {query && (
          <motion.div
            {...enterFadeUp(0.06, reduceMotion)}
            className="mt-6 space-y-2"
          >
            <p className="text-sm text-muted-foreground px-2">
              Searching for "{query}"...
            </p>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="surface-card rounded-xl px-4 py-3 animate-pulse h-10"
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
