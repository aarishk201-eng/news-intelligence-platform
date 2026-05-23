"use client";

import { Rss, Settings2, Activity, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { feedApi } from "@/lib/api";

export default function FeedsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["feedStatus"],
    queryFn: async () => {
      const response = await feedApi.getStatus();
      return response.data;
    },
    retry: 1,
  });

  const status = data?.data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Rss className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Ingestion Feeds</h1>
            <p className="text-muted-foreground mt-1">
              Manage your real-time data pipelines and automated scraping configurations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-foreground">NewsData.io Pipeline</h3>
          </div>
          {isLoading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-2 bg-muted rounded"></div>
                <div className="h-2 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to fetch feed status or unauthorized.</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Global news aggregation pipeline currently {status?.isRunning ? "running" : "idle"}. 
                Cron schedule: {status?.cronExpression || "Disabled"}. 
                Configured: {status?.newsdataConfigured ? "Yes" : "No"}.
              </p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-medium">
                <span>Status: {status?.isRunning ? "Ingesting..." : "Healthy"}</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm opacity-50">
          <div className="flex items-center gap-3 mb-4">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Custom RSS Feeds</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Custom RSS feed ingestion is disabled for your current subscription tier. Upgrade your workspace to add arbitrary RSS links.
          </p>
        </div>
      </div>
    </div>
  );
}
