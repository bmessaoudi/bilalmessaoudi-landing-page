"use client";

import { useEffect, useRef } from "react";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  size?: number;
  color?: string;
  vx?: number;
  vy?: number;
  staticity?: number;
  ease?: number;
}

function hexToRgb(hex: string) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

const Particles: React.FC<ParticlesProps> = ({
  className = "",
  quantity = 50,
  size = 0.4,
  color = "#ffffff",
  vx = 0,
  vy = 0,
  staticity = 50,
  ease = 50,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<
    {
      x: number;
      y: number;
      translateX: number;
      translateY: number;
      size: number;
      alpha: number;
      targetAlpha: number;
      dx: number;
      dy: number;
      magnetism: number;
    }[]
  >([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  const dprRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    contextRef.current = ctx;
    dprRef.current = window.devicePixelRatio || 1;

    const rgb = hexToRgb(color);

    const resizeCanvas = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvasSizeRef.current = { w, h };
      canvas.width = w * dprRef.current;
      canvas.height = h * dprRef.current;
      ctx.scale(dprRef.current, dprRef.current);
      initParticles();
    };

    const createParticle = () => ({
      x: Math.random() * canvasSizeRef.current.w,
      y: Math.random() * canvasSizeRef.current.h,
      translateX: 0,
      translateY: 0,
      size: Math.random() * 2 + size,
      alpha: 0,
      targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
      magnetism: 0.1 + Math.random() * 4,
    });

    const initParticles = () => {
      particlesRef.current = Array.from({ length: quantity }, createParticle);
    };

    const drawParticle = (p: (typeof particlesRef.current)[0]) => {
      if (!contextRef.current) return;
      const { x, y, translateX, translateY, size: s, alpha } = p;
      contextRef.current.beginPath();
      contextRef.current.arc(x + translateX - s / 2, y + translateY - s / 2, s, 0, 2 * Math.PI);
      contextRef.current.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      contextRef.current.fill();
    };

    let animationId: number;

    const animate = () => {
      if (!contextRef.current) return;
      contextRef.current.clearRect(0, 0, canvasSizeRef.current.w, canvasSizeRef.current.h);

      particlesRef.current.forEach((p) => {
        p.x += p.dx + vx;
        p.y += p.dy + vy;

        const edgeDx = mouseRef.current.x - p.x - p.translateX;
        const edgeDy = mouseRef.current.y - p.y - p.translateY;
        const dist = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);
        if (dist > 0) {
          p.translateX += (edgeDx / dist) * (p.magnetism / staticity);
          p.translateY += (edgeDy / dist) * (p.magnetism / staticity);
        }
        p.translateX *= 1 - ease / 1000;
        p.translateY *= 1 - ease / 1000;

        if (p.alpha < p.targetAlpha) p.alpha = Math.min(p.alpha + 0.01, p.targetAlpha);

        // Wrap around
        if (p.x > canvasSizeRef.current.w + 10) p.x = -10;
        if (p.x < -10) p.x = canvasSizeRef.current.w + 10;
        if (p.y > canvasSizeRef.current.h + 10) p.y = -10;
        if (p.y < -10) p.y = canvasSizeRef.current.h + 10;

        drawParticle(p);
      });

      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    resizeCanvas();
    animate();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [color, quantity, size, vx, vy, staticity, ease]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%" }} />;
};

export default Particles;
