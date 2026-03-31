"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Preloader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const counter = counterRef.current;
    if (!container || !counter) return;

    document.body.style.overflow = "hidden";

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        setDone(true);
      },
    });

    // Counter animation
    tl.to(
      { val: 0 },
      {
        val: 100,
        duration: 1.8,
        ease: "power2.inOut",
        onUpdate: function () {
          counter.textContent = Math.round(this.targets()[0].val) + "%";
        },
      }
    );

    // Name reveal
    tl.to(
      ".preloader-name",
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
      },
      0.3
    );

    // Exit animation
    tl.to(container, {
      clipPath: "inset(0 0 100% 0)",
      duration: 0.8,
      ease: "power4.inOut",
      delay: 0.2,
    });

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center"
      style={{ clipPath: "inset(0 0 0 0)" }}
    >
      <h1 className="preloader-name text-4xl md:text-6xl font-bold tracking-tight text-white opacity-0 translate-y-4">
        BILAL MESSAOUDI
      </h1>
      <span
        ref={counterRef}
        className="mt-6 text-lg font-mono text-zinc-500"
      >
        0%
      </span>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-px bg-zinc-800 overflow-hidden">
        <div className="preloader-bar h-full bg-gradient-to-r from-blue-500 to-purple-500 origin-left scale-x-0" />
      </div>
    </div>
  );
}
