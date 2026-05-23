import type { MotionProps, Transition } from 'framer-motion';

export const easeCinematic: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const transition = {
  enter: { duration: 0.65, ease: easeCinematic } satisfies Transition,
  soft: { duration: 0.45, ease: easeCinematic } satisfies Transition,
  fade: { duration: 0.45, ease: easeCinematic } satisfies Transition,
  hover: { duration: 0.25, ease: easeCinematic } satisfies Transition,
};

export function enterFadeUp(delay = 0, reduceMotion: boolean | null = false): MotionProps {
  if (reduceMotion) return { initial: false, animate: false };
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { ...transition.enter, delay },
  };
}

export function enterFadeDown(delay = 0, reduceMotion: boolean | null = false): MotionProps {
  if (reduceMotion) return { initial: false, animate: false };
  return {
    initial: { opacity: 0, y: -12 },
    animate: { opacity: 1, y: 0 },
    transition: { ...transition.enter, delay },
  };
}

export function hoverLift(y = -2, reduceMotion: boolean | null = false): MotionProps {
  if (reduceMotion) return {};
  return { whileHover: { y }, transition: transition.hover };
}

export function hoverScale(scale = 1.02, reduceMotion: boolean | null = false): MotionProps {
  if (reduceMotion) return {};
  return { whileHover: { scale }, transition: transition.hover };
}

export function hoverSlideX(x = 2, reduceMotion: boolean | null = false): MotionProps {
  if (reduceMotion) return {};
  return { whileHover: { x }, transition: transition.hover };
}
