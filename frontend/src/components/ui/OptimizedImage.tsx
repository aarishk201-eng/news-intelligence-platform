'use client';

import Image from 'next/image';
import { imageOptimization } from '@/lib/performance-utils';
import { memo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  size?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
}

/**
 * Optimized Image component with lazy loading, format negotiation
 * Prevents layout shift with proper sizing
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fill = false,
  className = '',
  priority = false,
  size,
  objectFit = 'cover',
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      quality={imageOptimization.quality}
      priority={priority}
      loading={priority ? 'eager' : imageOptimization.loading}
      sizes={size || imageOptimization.sizes}
      placeholder="empty"
      style={{ objectFit }}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';
