import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { ExternalLink, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArticleImage } from "@/components/ui/article-image";

interface ArticleCardProps {
  article: {
    _id: string;
    title: string;
    source: { name: string };
    publishedAt: string;
    url: string;
    urlToImage?: string;
    aiAnalysis?: {
      summary: string;
      keyInsights?: { insight: string }[];
    };
    sentiment?: { label: "positive" | "negative" | "neutral" };
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  const getSentimentVariant = (label?: string) => {
    switch (label) {
      case "positive": return "positive";
      case "negative": return "negative";
      default: return "neutral";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      viewport={{ once: true, margin: "-50px" }}
      whileInView={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-premium-lg hover:border-primary/25">
        {article.urlToImage && (
          <div className="relative h-48 w-full overflow-hidden">
            <ArticleImage
              src={article.urlToImage}
              alt={article.title}
              className="h-full"
            />
            {article.sentiment && (
              <Badge 
                variant={getSentimentVariant(article.sentiment.label)}
                className="absolute top-3 right-3 shadow-sm backdrop-blur-md bg-background/80 capitalize"
              >
                {article.sentiment.label}
              </Badge>
            )}
          </div>
        )}

        <CardHeader className="flex-1 space-y-2 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-primary/80">{article.source.name}</span>
            <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
          </div>
          <h3 className="font-heading text-lg font-bold leading-tight line-clamp-2">
            {article.title}
          </h3>
          
          {article.aiAnalysis?.summary && (
            <div className="mt-3 rounded-lg bg-primary/5 p-3 text-sm text-foreground/80 border border-primary/10">
              <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI Summary
              </div>
              <p className="line-clamp-3 leading-relaxed">{article.aiAnalysis.summary}</p>
            </div>
          )}
        </CardHeader>

        {article.aiAnalysis?.keyInsights && article.aiAnalysis.keyInsights.length > 0 && (
          <CardContent className="pb-4">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Key Insights
            </div>
            <ul className="space-y-1.5">
              {article.aiAnalysis.keyInsights.slice(0, 2).map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  <span className="line-clamp-2">{insight.insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}

        <CardFooter className="mt-auto border-t border-border/50 pt-4">
          <Button variant="ghost" className="w-full justify-between" asChild>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Read Full Article
              <ExternalLink className="h-4 w-4 ml-2 opacity-50" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
