"use client";

import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SearchFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentSentiment = searchParams.get("sentiment") || "";
  const currentKeyword = searchParams.get("keyword") || "";
  const currentSort = searchParams.get("sort") || "";

  // Local state for immediate typing feedback
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const initialMount = useRef(true);

  // Sync debounced search to URL
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    
    // Reset to page 1 on new search
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearch, pathname, router, searchParams]);

  // Sync internal search term if URL changes externally (e.g. back button)
  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  const handleFilterToggle = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValue = params.get(key);
    
    if (currentValue === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    params.set("page", "1"); // Reset page on filter change
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    router.replace(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = currentSentiment || currentKeyword || currentSort || currentSearch;

  return (
    <div className="surface-card flex flex-col gap-4 rounded-2xl p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search AI intelligence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 border-white/10 focus-visible:ring-primary/50"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center mr-2 text-sm font-medium text-muted-foreground">
            <Filter className="mr-2 h-4 w-4" /> Filters:
          </div>
          
          {["positive", "neutral", "negative"].map((sentiment) => (
            <Button
              key={sentiment}
              variant={currentSentiment === sentiment ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleFilterToggle("sentiment", sentiment)}
              className={`capitalize rounded-full ${
                currentSentiment === sentiment 
                  ? "border-primary/20 shadow-sm" 
                  : "border-dashed opacity-70 hover:opacity-100"
              }`}
            >
              {sentiment}
            </Button>
          ))}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-destructive ml-auto"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Tags (e.g., keyword) */}
      {(currentKeyword || currentSort) && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-xs text-muted-foreground">Active:</span>
          {currentKeyword && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Keyword: {currentKeyword}
              <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleFilterToggle("keyword", currentKeyword)} />
            </span>
          )}
          {currentSort && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-white/10">
              Sort: {currentSort.replace('-', '')} {currentSort.startsWith('-') ? '(Desc)' : '(Asc)'}
              <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleFilterToggle("sort", currentSort)} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
