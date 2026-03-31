"use client";

import React, { useRef, useCallback } from "react";

interface ClickSparkProps {
  children: React.ReactNode;
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  children,
  sparkColor = "#fff",
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawSparks = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const sparks = Array.from({ length: sparkCount }).map((_, i) => {
        const angle = (i / sparkCount) * Math.PI * 2;
        return {
          x,
          y,
          vx: Math.cos(angle) * sparkRadius,
          vy: Math.sin(angle) * sparkRadius,
          life: 1,
        };
      });

      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        sparks.forEach((spark) => {
          const currentX = spark.x + spark.vx * progress;
          const currentY = spark.y + spark.vy * progress;
          const opacity = 1 - progress;
          const size = sparkSize * (1 - progress * 0.5);

          ctx.beginPath();
          ctx.arc(currentX, currentY, size / 2, 0, Math.PI * 2);
          ctx.fillStyle = sparkColor;
          ctx.globalAlpha = opacity;
          ctx.fill();
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };

      requestAnimationFrame(animate);
    },
    [sparkColor, sparkSize, sparkRadius, sparkCount, duration]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      drawSparks(e.clientX - rect.left, e.clientY - rect.top);
    },
    [drawSparks]
  );

  return (
    <div ref={containerRef} className="relative" onClick={handleClick}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[9999]"
        style={{ width: "100vw", height: "100vh" }}
      />
      {children}
    </div>
  );
};

export default ClickSpark;
