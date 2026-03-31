"use client";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 5,
  className = "",
}) => {
  return (
    <span
      className={`inline-block bg-clip-text ${
        disabled ? "" : "animate-shine"
      } ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.0) 60%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        animationDuration: `${speed}s`,
      }}
    >
      <style jsx>{`
        @keyframes shine {
          0% { background-position: 100%; }
          100% { background-position: -100%; }
        }
        .animate-shine {
          animation: shine ${speed}s linear infinite;
        }
      `}</style>
      {text}
    </span>
  );
};

export default ShinyText;
