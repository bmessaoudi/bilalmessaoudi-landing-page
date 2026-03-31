"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "motion/react";

interface DockItemProps {
  children: React.ReactNode;
  label: string;
  href: string;
  mouseX: MotionValue<number>;
}

interface DockProps {
  items: { icon: React.ReactNode; label: string; href: string }[];
  className?: string;
}

function DockItem({ children, label, href, mouseX }: DockItemProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 150;
    return val - rect.x - rect.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 60, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ width, height: width }}
      className="relative flex items-center justify-center rounded-full bg-zinc-800/80 backdrop-blur-sm text-zinc-300 hover:text-white transition-colors group"
    >
      {children}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {label}
      </span>
    </motion.a>
  );
}

const Dock: React.FC<DockProps> = ({ items, className = "" }) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.nav
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`flex items-end gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl px-3 py-2 ${className}`}
    >
      {items.map((item, i) => (
        <DockItem key={i} label={item.label} href={item.href} mouseX={mouseX}>
          {item.icon}
        </DockItem>
      ))}
    </motion.nav>
  );
};

export default Dock;
