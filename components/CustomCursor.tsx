"use client";

import { useEffect, useRef, useState } from "react";
import { isMobile } from "@/lib/device";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const posRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isMobile()) return;

    let raf: number;

    function onMouseMove(e: MouseEvent) {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    }

    function onMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const isInteractive =
        target.closest("a, button, [data-cursor], [role='button']") ||
        target.tagName === "A" ||
        target.tagName === "BUTTON";
      setHovering(!!isInteractive);
    }

    function onMouseLeave() {
      setVisible(false);
    }

    function animate() {
      raf = requestAnimationFrame(animate);
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (!dot || !ring) return;

      // Dot follows instantly
      dot.style.transform = `translate(${posRef.current.x - 4}px, ${posRef.current.y - 4}px)`;

      // Ring follows with lerp
      ringPosRef.current.x += (posRef.current.x - ringPosRef.current.x) * 0.15;
      ringPosRef.current.y += (posRef.current.y - ringPosRef.current.y) * 0.15;
      const size = hovering ? 48 : 32;
      ring.style.transform = `translate(${ringPosRef.current.x - size / 2}px, ${ringPosRef.current.y - size / 2}px)`;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseleave", onMouseLeave);
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(raf);
    };
  }, [visible, hovering]);

  if (typeof window !== "undefined" && isMobile()) return null;

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[70] pointer-events-none rounded-full bg-white w-2 h-2 transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[70] pointer-events-none rounded-full border border-white/30 transition-[width,height,opacity] duration-200"
        style={{
          opacity: visible ? 1 : 0,
          width: 32,
          height: 32,
        }}
      />
    </>
  );
}
