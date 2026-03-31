"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { motion, useInView } from "motion/react";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, string | number>;
  animationTo?: Record<string, string | number>;
  easing?: (t: number) => number;
  onAnimationComplete?: () => void;
}

const BlurText: React.FC<BlurTextProps> = ({
  text = "",
  delay = 200,
  className = "",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
}) => {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const defaultFrom = useMemo(
    () =>
      direction === "top"
        ? { filter: "blur(10px)", opacity: 0, y: -30 }
        : { filter: "blur(10px)", opacity: 0, y: 30 },
    [direction]
  );
  const defaultTo = useMemo(
    () => ({ filter: "blur(0px)", opacity: 1, y: 0 }),
    []
  );
  const from = animationFrom || defaultFrom;
  const to = animationTo || defaultTo;

  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: rootMargin as `${number}px ${number}px ${number}px ${number}px`, amount: threshold });
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (completedCount === elements.length && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [completedCount, elements.length, onAnimationComplete]);

  return (
    <p ref={ref} className={`flex flex-wrap ${className}`}>
      {elements.map((el, i) => (
        <motion.span
          key={i}
          initial={from}
          animate={inView ? to : from}
          transition={{
            delay: (i * delay) / 1000,
            duration: 0.5,
            ease: easing,
          }}
          onAnimationComplete={() => setCompletedCount((c) => c + 1)}
          className="inline-block will-change-[transform,filter,opacity]"
          style={{ marginRight: animateBy === "words" ? "0.3em" : undefined }}
        >
          {el}
        </motion.span>
      ))}
    </p>
  );
};

export default BlurText;
