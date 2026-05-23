'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function Parallax({
  children,
  className,
  y = -18,
  scrub = 0.8,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  scrub?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 0 },
        {
          y,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [scrub, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
