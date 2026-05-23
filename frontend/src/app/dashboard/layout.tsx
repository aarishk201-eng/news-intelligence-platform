'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { Suspense } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-background">
        <div className="sticky top-0 h-screen shrink-0">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <DashboardHeader />
          </div>
          <main className="flex-1">
            <div className="p-6">
              <Suspense
                fallback={
                  <div className="grid gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="skeleton h-32 rounded-xl" />
                    ))}
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
