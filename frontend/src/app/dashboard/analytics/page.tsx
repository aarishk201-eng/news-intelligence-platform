"use client";

import { useQuery } from "@tanstack/react-query";
import { newsApi } from "@/lib/api";
import { SentimentChart } from "@/components/charts/SentimentChart";
import { CategoryChart } from "@/components/charts/CategoryChart";
import { TrendingKeywords } from "@/components/charts/TrendingKeywords";
import { Activity, BookOpen, Hash, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["newsAnalytics"],
    queryFn: async () => {
      const res = await newsApi.getAnalytics();
      return res.data; // res.data wraps { data: { totalArticles, topCategories, sentimentDist, topKeywords } }
    },
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Analytics Unavailable</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Unable to fetch dashboard metrics. Ensure you have the required permissions or try again later.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const analytics = response?.data;

  // KPI Cards Data
  const kpis = [
    {
      title: "Total Articles",
      value: analytics?.totalArticles ?? 0,
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Analyzed Categories",
      value: analytics?.topCategories?.length ?? 0,
      icon: Activity,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Trending Keywords",
      value: analytics?.topKeywords?.length ?? 0,
      icon: Hash,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Dominant Sentiment",
      value: analytics?.sentimentDist?.length > 0 
        ? analytics.sentimentDist.reduce((a: any, b: any) => a.count > b.count ? a : b).label
        : "N/A",
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      capitalize: true,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Platform-wide intelligence metrics and AI analysis overview.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="surface-card rounded-2xl p-6 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${kpi.bg}`}>
              <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <h4 className={`text-2xl font-bold text-foreground mt-0.5 ${kpi.capitalize ? 'capitalize' : ''}`}>
                  {kpi.value}
                </h4>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Column - Sentiment & Keywords */}
        <div className="space-y-6 lg:col-span-1 flex flex-col">
          <div className="flex-1 min-h-[400px]">
            {isLoading ? <Skeleton className="h-full w-full rounded-xl" /> : <SentimentChart data={analytics?.sentimentDist ?? []} />}
          </div>
        </div>

        {/* Center Column - Categories */}
        <div className="lg:col-span-1 min-h-[400px]">
          {isLoading ? <Skeleton className="h-full w-full rounded-xl" /> : <CategoryChart data={analytics?.topCategories ?? []} />}
        </div>

        {/* Right Column - Trending Keywords */}
        <div className="lg:col-span-1 min-h-[400px]">
          {isLoading ? <Skeleton className="h-full w-full rounded-xl" /> : <TrendingKeywords data={analytics?.topKeywords ?? []} />}
        </div>
      </div>
    </div>
  );
}
