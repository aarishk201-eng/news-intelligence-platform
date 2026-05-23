"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { InboxIcon, AlertCircle } from "lucide-react";
import { newsApi } from "@/lib/api";
import { ArticleCard } from "./ArticleCard";
import { ArticleSkeleton } from "./ArticleSkeleton";
import { SearchFilterBar } from "./SearchFilterBar";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function NewsFeed({ savedOnly = false }: { savedOnly?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read state entirely from URL
  const search = searchParams.get("search") || "";
  const sentiment = searchParams.get("sentiment") || "";
  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["articles", { search, sentiment, keyword, category, sort, page, savedOnly }],
    queryFn: async () => {
      if (savedOnly) {
        const response = await newsApi.getSavedArticles();
        return { data: response.data?.data || [], meta: { totalPages: 1 } };
      }

      // Build request params, stripping empty strings
      const params: Record<string, any> = { page, limit: 12 };
      if (search) params.search = search;
      if (sentiment) params.sentiment = sentiment;
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      if (sort) params.sort = sort;

      const response = await newsApi.getArticles(params);
      return response.data; // { data: Article[], meta: { totalPages } }
    },
    staleTime: 60000,
    refetchInterval: 15000,
  });

  const articles = data?.data || [];
  const meta = data?.meta || { totalPages: 1 };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <SearchFilterBar />

      {isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card/10 rounded-2xl border border-destructive/20 border-dashed">
          <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
          <h3 className="text-xl font-semibold text-foreground">Failed to load intel</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            Our AI engine is currently unreachable. Please verify your connection or try again.
          </p>
          <Button 
            variant="outline" 
            className="mt-6" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ArticleSkeleton />
                  </motion.div>
                ))
              ) : articles.length > 0 ? (
                articles.map((article: any) => (
                  <ArticleCard key={article._id} article={article} />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-card/10 rounded-2xl border border-white/5 border-dashed"
                >
                  <InboxIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">No intelligence found</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Try adjusting your search terms or relaxing your sentiment filters to discover more news.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          {!isLoading && articles.length > 0 && meta.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1 || isFetching}
              >
                Previous
              </Button>
              <div className="text-sm font-medium text-muted-foreground px-4">
                Page {page} of {meta.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages || isFetching}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
