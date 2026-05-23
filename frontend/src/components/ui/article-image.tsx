"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ArticleImageProps {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Optimized article image using next/image:
 * - Automatic WebP/AVIF conversion
 * - Lazy loading by default (priority=false)
 * - CLS prevention via fill + aspect-ratio wrapper
 * - Graceful fallback on error
 */
export function ArticleImage({ src, alt, className, priority = false }: ArticleImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/30 text-muted-foreground/20", className)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", className)}>
      {/* Shimmer placeholder while loading */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 bg-[length:200%_100%]" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={cn(
          "object-cover transition-all duration-500 hover:scale-105",
          loaded ? "opacity-100" : "opacity-0"
        )}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
