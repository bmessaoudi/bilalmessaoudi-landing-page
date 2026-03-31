"use client";

import React, { useRef, useState, useCallback } from "react";

interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  disabled?: boolean;
  className?: string;
}

const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 100,
  disabled = false,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !ref.current) return;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const maxDist = Math.max(width, height) / 2 + padding;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < maxDist) {
        const factor = 1 - dist / maxDist;
        setPosition({
          x: distX * factor * 0.4,
          y: distY * factor * 0.4,
        });
      }
    },
    [disabled, padding]
  );

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: position.x === 0 && position.y === 0 ? "transform 0.5s ease-out" : "transform 0.15s ease-out",
        display: "inline-block",
      }}
    >
      {children}
    </div>
  );
};

export default Magnet;
