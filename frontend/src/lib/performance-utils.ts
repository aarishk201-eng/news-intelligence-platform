// Performance utilities for 60 FPS, GPU-optimized rendering

import { memo, useRef, useEffect, useState } from 'react';

/**
 * Enable GPU acceleration for animations
 * Apply to animated elements for will-change optimization
 */
export const gpuAccelerate = () => ({
  style: {
    willChange: 'transform',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
  } as React.CSSProperties,
});

/**
 * Optimized image configuration for Next.js Image component
 * Lazy loads, optimizes sizes, format negotiation
 */
export const imageOptimization = {
  quality: 80,
  priority: false,
  loading: 'lazy' as const,
  sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  placeholder: 'empty' as const,
};

/**
 * Three.js renderer optimization settings
 * GPU memory efficient, power management, antialiasing
 */
export const threejsOptimization = {
  antialias: true,
  alpha: true,
  powerPreference: 'low-power' as const,
  dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
  failIfMajorPerformanceCaveat: true,
};

/**
 * Memoized component wrapper for preventing unnecessary rerenders
 * Use for expensive child components
 */
export function memoize<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, propsAreEqual);
}

/**
 * Intersection observer hook for lazy loading components
 * Only renders when element is visible
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = { threshold: 0.1 }
) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(ref.current!);
      }
    }, options);

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}

/**
 * Optimized animation transition settings
 * GPU-friendly, 60 FPS compatible
 */
export const performantTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1],
};

