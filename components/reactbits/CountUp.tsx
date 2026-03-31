"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

const CountUp: React.FC<CountUpProps> = ({
  from = 0,
  to,
  duration = 2,
  className = "",
  suffix = "",
  prefix = "",
}) => {
  const [count, setCount] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;

    const startTime = performance.now();
    const diff = to - from;

    const step = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + diff * eased));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [inView, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
};

export default CountUp;
