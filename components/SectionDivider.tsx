export default function SectionDivider() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,123,255,0.3), rgba(138,43,226,0.3), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />
    </div>
  );
}
