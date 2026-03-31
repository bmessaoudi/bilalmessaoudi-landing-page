"use client";

import { useRef, useEffect, useState } from "react";

interface AnimatedContentProps {
  children: React.ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  className?: string;
  threshold?: number;
  delay?: number;
}

const AnimatedContent: React.FC<AnimatedContentProps> = ({
  children,
  distance = 50,
  direction = "vertical",
  reverse = false,
  className = "",
  threshold = 0.1,
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, delay]);

  const translateValue = reverse ? -distance : distance;
  const transform =
    direction === "vertical"
      ? `translateY(${isVisible ? 0 : translateValue}px)`
      : `translateX(${isVisible ? 0 : translateValue}px)`;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform,
        opacity: isVisible ? 1 : 0,
        transition: `transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedContent;
