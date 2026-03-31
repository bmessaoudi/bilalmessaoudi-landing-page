"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useVelocity,
  useTransform,
  useSpring,
  useAnimationFrame,
} from "motion/react";

interface ScrollVelocityProps {
  texts: string[];
  velocity?: number;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

interface ParallaxProps {
  children: React.ReactNode;
  baseVelocity: number;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

function ParallaxText({
  children,
  baseVelocity = 5,
  className = "",
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  scrollContainerRef,
}: ParallaxProps) {
  const baseX = useRef(0);
  const [repetitions, setRepetitions] = useState(numCopies);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({
    container: scrollContainerRef,
  });
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping,
    stiffness,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const [xMotion, setXMotion] = useState(0);

  const measureRepetitions = useCallback(() => {
    if (containerRef.current && innerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const childWidth = innerRef.current.children[0]
        ? (innerRef.current.children[0] as HTMLElement).offsetWidth
        : 0;
      if (childWidth > 0) {
        const needed = Math.ceil(containerWidth / childWidth) + 2;
        setRepetitions(Math.max(needed, numCopies));
      }
    }
  }, [numCopies]);

  useEffect(() => {
    measureRepetitions();
    window.addEventListener("resize", measureRepetitions);
    return () => window.removeEventListener("resize", measureRepetitions);
  }, [measureRepetitions]);

  useAnimationFrame((_, delta) => {
    if (!innerRef.current || !innerRef.current.children[0]) return;
    const childWidth = (innerRef.current.children[0] as HTMLElement).offsetWidth;

    let moveBy = baseVelocity * (delta / 1000);
    const vFactor = velocityFactor.get();
    moveBy += moveBy * vFactor;

    baseX.current += moveBy;

    if (baseX.current > 0) baseX.current = -childWidth;
    if (baseX.current < -childWidth) baseX.current = 0;

    setXMotion(baseX.current);
  });

  return (
    <div ref={containerRef} className="w-full overflow-hidden whitespace-nowrap">
      <motion.div
        ref={innerRef}
        className={`inline-flex ${className}`}
        style={{ x: xMotion }}
      >
        {Array.from({ length: repetitions }).map((_, i) => (
          <span key={i} className="inline-block mr-8">
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const ScrollVelocity: React.FC<ScrollVelocityProps> = ({
  texts = [],
  velocity = 5,
  className = "",
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  scrollContainerRef,
}) => {
  return (
    <div>
      {texts.map((text, i) => (
        <ParallaxText
          key={i}
          baseVelocity={i % 2 === 0 ? velocity : -velocity}
          className={className}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          scrollContainerRef={scrollContainerRef}
        >
          {text}
        </ParallaxText>
      ))}
    </div>
  );
};

export default ScrollVelocity;
