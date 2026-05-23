import { TrendingTopics } from "@/components/news/TrendingTopics";
import { TrendingUp } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Trending Intelligence' };

export default function TrendingPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Trending Intelligence</h1>
            <p className="text-muted-foreground mt-1">
              Top emerging narratives and rapidly developing stories.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
        <TrendingTopics />
      </div>
    </div>
  );
}
