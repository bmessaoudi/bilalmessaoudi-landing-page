"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/device";

gsap.registerPlugin(ScrollTrigger);

const words = ["LA TUA IDEA.", "IL MIO CODICE.", "IL TUO SUCCESSO."];

export default function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      wordsRef.current.forEach((el) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0.1, y: 60 },
          {
            opacity: 1,
            y: 0,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "top 40%",
              scrub: 1,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-32 lg:py-48 flex items-center justify-center overflow-hidden"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent" />

      <div className="relative z-10 text-center px-5 sm:px-6">
        <div className="flex flex-col items-center gap-3 md:gap-5 lg:gap-6">
          {words.map((word, i) => (
            <span
              key={i}
              ref={(el) => { wordsRef.current[i] = el; }}
              className="block text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
