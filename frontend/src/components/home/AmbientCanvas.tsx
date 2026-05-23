'use client';

import { useEffect, useRef } from 'react';

/**
 * Premium ambient canvas effect — soft floating orbs with gentle movement.
 * Replaces Three.js for maximum compatibility and 60fps performance.
 */
export default function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const canvasEl: HTMLCanvasElement = canvas;
    const ctx: CanvasRenderingContext2D = context;

    let animationId = 0;
    let time = 0;
    const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = Boolean(reduceMotionQuery?.matches);

    const orbs = [
      { x: 0.5, y: 0.35, r: 220, color: [124, 140, 255], speed: 0.0003, offset: 0 },
      { x: 0.3, y: 0.55, r: 180, color: [168, 179, 207], speed: 0.0004, offset: 2 },
      { x: 0.7, y: 0.45, r: 160, color: [91, 108, 232], speed: 0.00035, offset: 4 },
      { x: 0.55, y: 0.65, r: 140, color: [124, 140, 255], speed: 0.00025, offset: 1 },
    ];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvasEl.width = Math.floor(canvasEl.offsetWidth * dpr);
      canvasEl.height = Math.floor(canvasEl.offsetHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function renderFrame() {
      const w = canvasEl.offsetWidth;
      const h = canvasEl.offsetHeight;

      ctx.clearRect(0, 0, w, h);

      for (const orb of orbs) {
        const cx = w * orb.x + Math.sin(time * orb.speed + orb.offset) * 60;
        const cy = h * orb.y + Math.cos(time * orb.speed * 0.7 + orb.offset) * 40;
        const pulse = 1 + Math.sin(time * orb.speed * 2 + orb.offset) * 0.15;
        const r = orb.r * pulse;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, `rgba(${orb.color[0]},${orb.color[1]},${orb.color[2]},0.10)`);
        gradient.addColorStop(0.5, `rgba(${orb.color[0]},${orb.color[1]},${orb.color[2]},0.04)`);
        gradient.addColorStop(1, `rgba(${orb.color[0]},${orb.color[1]},${orb.color[2]},0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function draw() {
      renderFrame();

      time++;
      animationId = requestAnimationFrame(draw);
    }

    function stop() {
      if (animationId) cancelAnimationFrame(animationId);
      animationId = 0;
    }

    function start() {
      stop();
      if (reduceMotion) {
        time = 0;
        renderFrame();
        return;
      }
      draw();
    }

    function handleMotionChange() {
      reduceMotion = Boolean(reduceMotionQuery?.matches);
      start();
    }

    resize();
    start();
    window.addEventListener('resize', resize);

    if (reduceMotionQuery) {
      if ('addEventListener' in reduceMotionQuery) {
        reduceMotionQuery.addEventListener('change', handleMotionChange);
      } else {
        // @ts-expect-error older Safari
        reduceMotionQuery.addListener(handleMotionChange);
      }
    }

    return () => {
      stop();
      window.removeEventListener('resize', resize);

      if (reduceMotionQuery) {
        if ('removeEventListener' in reduceMotionQuery) {
          reduceMotionQuery.removeEventListener('change', handleMotionChange);
        } else {
          // @ts-expect-error older Safari
          reduceMotionQuery.removeListener(handleMotionChange);
        }
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.65 }}
      aria-hidden="true"
    />
  );
}
