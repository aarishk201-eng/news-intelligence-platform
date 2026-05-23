import { NewsFeed } from "@/components/news/NewsFeed";
import { Newspaper } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'News Feed' };

export default function FeedPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Global News Feed</h1>
            <p className="text-muted-foreground mt-1">
              Unfiltered, real-time intelligence gathered from global sources.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
        <NewsFeed />
      </div>
    </div>
  );
}
