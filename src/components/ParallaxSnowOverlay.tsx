import { useEffect, useRef } from 'react';

interface Snowflake {
  x: number;
  y: number;
  r: number;
  speedY: number;
  driftAmp: number;
  driftFreq: number;
  phase: number;
  alpha: number;
  layer: 0 | 1 | 2;
}

export function ParallaxSnowOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3 Parallax layers (far mist flakes, mid flakes, soft foreground flakes)
    const count = 85;
    const flakes: Snowflake[] = Array.from({ length: count }, (_, idx) => {
      const layer = (idx % 3) as 0 | 1 | 2;
      const radiusByLayer = [1.2, 2.2, 3.6][layer];
      const speedByLayer = [22, 42, 68][layer];
      const alphaByLayer = [0.32, 0.52, 0.72][layer];

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: radiusByLayer * (0.8 + Math.random() * 0.45),
        speedY: speedByLayer * (0.8 + Math.random() * 0.45),
        driftAmp: (12 + layer * 10) * (0.7 + Math.random() * 0.6),
        driftFreq: 0.5 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        alpha: alphaByLayer,
        layer,
      };
    });

    let pointerOffsetX = 0;
    const handlePointerMove = (e: PointerEvent) => {
      pointerOffsetX = (e.clientX / Math.max(1, width) - 0.5) * 28;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let animId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.speedY * dt;
        if (f.y > height + 8) {
          f.y = -8;
          f.x = Math.random() * width;
        }

        const parallaxX = pointerOffsetX * (f.layer + 1) * 0.35;
        const drawX =
          (f.x + Math.sin(t * f.driftFreq + f.phase) * f.driftAmp + parallaxX + width) % width;

        ctx.beginPath();
        ctx.arc(drawX, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 250, 255, ${f.alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 w-full h-full"
    />
  );
}
