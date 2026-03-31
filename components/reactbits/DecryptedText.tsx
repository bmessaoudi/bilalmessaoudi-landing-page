"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useInView } from "motion/react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover";
  revealDirection?: "start" | "end" | "center";
  onAnimationComplete?: () => void;
}

const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 50,
  maxIterations = 10,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "view",
  revealDirection = "start",
  onAnimationComplete,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const iterationCount = useRef(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px", amount: 0.1 });

  const getRevealIndex = useCallback(
    (progress: number, length: number) => {
      if (revealDirection === "start") return Math.floor(progress * length);
      if (revealDirection === "end") return length - Math.floor(progress * length);
      return Math.floor(progress * length);
    },
    [revealDirection]
  );

  const animate = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    iterationCount.current = 0;

    const interval = setInterval(() => {
      iterationCount.current++;
      const progress = iterationCount.current / maxIterations;
      const revealIndex = getRevealIndex(progress, text.length);

      const newText = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          const shouldReveal =
            revealDirection === "end"
              ? i >= revealIndex
              : i < revealIndex;
          if (shouldReveal) return char;
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join("");

      setDisplayText(newText);

      if (iterationCount.current >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsAnimating(false);
        setHasAnimated(true);
        onAnimationComplete?.();
      }
    }, speed);
  }, [text, speed, maxIterations, characters, isAnimating, getRevealIndex, revealDirection, onAnimationComplete]);

  useEffect(() => {
    if (animateOn === "view" && inView && !hasAnimated) {
      animate();
    }
  }, [inView, animateOn, hasAnimated, animate]);

  return (
    <motion.span
      ref={ref}
      className={parentClassName}
      onMouseEnter={animateOn === "hover" ? animate : undefined}
    >
      {displayText.split("").map((char, i) => {
        const isRevealed =
          hasAnimated ||
          (revealDirection === "end"
            ? i >= text.length - getRevealIndex(iterationCount.current / maxIterations, text.length)
            : i < getRevealIndex(iterationCount.current / maxIterations, text.length));
        return (
          <span
            key={i}
            className={isRevealed ? className : `${className} ${encryptedClassName}`}
          >
            {char}
          </span>
        );
      })}
    </motion.span>
  );
};

export default DecryptedText;
