"use client";

import { useEffect, useRef } from "react";

interface AuroraProps {
  colorStops?: string[];
  speed?: number;
  blend?: number;
  amplitude?: number;
  className?: string;
}

const Aurora: React.FC<AuroraProps> = ({
  colorStops = ["#1a1a2e", "#16213e", "#0f3460"],
  speed = 1,
  blend = 0.5,
  amplitude = 0.8,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    };

    const draw = () => {
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      time += 0.003 * speed;

      colorStops.forEach((color, i) => {
        ctx.beginPath();
        const baseY = h * (0.3 + i * 0.2);
        ctx.moveTo(0, h);

        for (let x = 0; x <= w; x += 4) {
          const normalizedX = x / w;
          const wave1 = Math.sin(normalizedX * 3 + time + i) * amplitude * h * 0.15;
          const wave2 = Math.sin(normalizedX * 5 - time * 0.7 + i * 2) * amplitude * h * 0.1;
          const wave3 = Math.cos(normalizedX * 2 + time * 1.3 + i * 0.5) * amplitude * h * 0.08;
          const y = baseY + wave1 + wave2 + wave3;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = blend;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [colorStops, speed, blend, amplitude]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default Aurora;
