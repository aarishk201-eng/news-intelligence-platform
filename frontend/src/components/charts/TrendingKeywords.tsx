"use client";

import { motion } from "framer-motion";

interface TrendingKeywordsProps {
  data: { keyword: string; count: number }[];
}

export function TrendingKeywords({ data }: TrendingKeywordsProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-muted-foreground">
        No trending keywords available
      </div>
    );
  }

  // Find max count to calculate relative widths
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="surface-card rounded-2xl p-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground">Trending Keywords</h3>
        <p className="text-sm text-muted-foreground">Most frequently extracted topics by AI</p>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {data.map((item, index) => {
          const percentage = Math.round((item.count / maxCount) * 100);
          return (
            <div key={item.keyword} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground capitalize truncate pr-4">
                  {item.keyword}
                </span>
                <span className="text-muted-foreground font-mono text-xs">{item.count}</span>
              </div>
              <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
