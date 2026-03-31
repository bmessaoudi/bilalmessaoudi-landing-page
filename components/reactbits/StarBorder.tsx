"use client";

import React from "react";

interface StarBorderProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  children: React.ReactNode;
}

const StarBorder: React.FC<StarBorderProps> = ({
  as: Component = "button",
  className = "",
  color = "white",
  speed = "6s",
  children,
  ...rest
}) => {
  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-full ${className}`}
      {...rest}
    >
      <div
        className="absolute top-0 left-[20%] h-[2px] w-[80%] animate-[star-movement-bottom] bg-gradient-to-r from-transparent to-transparent"
        style={{
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
          animationDuration: speed,
        }}
      />
      <div
        className="absolute bottom-0 right-[20%] h-[2px] w-[80%] animate-[star-movement-top] bg-gradient-to-r from-transparent to-transparent"
        style={{
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
          animationDuration: speed,
        }}
      />
      <div className="relative z-10 rounded-full border border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950 px-6 py-3 text-center text-white">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
