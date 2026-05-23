"use client";

import { Globe, ShieldCheck, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { newsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function SourcesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await newsApi.getAnalytics();
      return response.data;
    },
    staleTime: 300000,
  });

  const sources = data?.data?.topSources || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Verified Sources</h1>
            <p className="text-muted-foreground mt-1">
              The premium intelligence network powering your dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive/50 mb-2" />
            <p className="text-muted-foreground">Failed to load sources</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-background/50 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Source Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Trust Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                  </tr>
                ))
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No active sources found.
                  </td>
                </tr>
              ) : (
                sources.map((source: any, idx: number) => (
                  <tr key={idx} className="hover:bg-accent/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{source.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{source.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium text-emerald-500">{source.trust}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
                        {source.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
