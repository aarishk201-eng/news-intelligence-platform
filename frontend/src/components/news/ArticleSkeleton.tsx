import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ArticleSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardHeader className="flex-1 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </div>
        <Skeleton className="mt-4 h-24 w-full rounded-lg" />
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto border-t border-border/50 pt-4">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
