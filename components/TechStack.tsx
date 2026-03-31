"use client";

import AnimatedContent from "@/components/reactbits/AnimatedContent";
import BlurText from "@/components/reactbits/BlurText";
import ScrollVelocity from "@/components/reactbits/ScrollVelocity";

const categories = [
  {
    name: "Frontend",
    techs: [
      { name: "React", color: "#61DAFB" },
      { name: "Next.js", color: "#ffffff" },
      { name: "TailwindCSS", color: "#38BDF8" },
      { name: "TypeScript", color: "#3178C6" },
    ],
  },
  {
    name: "Mobile",
    techs: [
      { name: "React Native", color: "#61DAFB" },
      { name: "Expo", color: "#ffffff" },
    ],
  },
  {
    name: "Backend",
    techs: [
      { name: "Node.js", color: "#68A063" },
      { name: "PostgreSQL", color: "#4169E1" },
      { name: "Firebase", color: "#FFCA28" },
    ],
  },
  {
    name: "Tools",
    techs: [
      { name: "Figma", color: "#F24E1E" },
      { name: "Git", color: "#F05032" },
      { name: "Vercel", color: "#ffffff" },
    ],
  },
];

export default function TechStack() {
  return (
    <section id="stack" className="py-24 md:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-16">
        <BlurText
          text="Tech Stack"
          className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-12"
          delay={80}
          animateBy="words"
        />

        {/* Tech grid by category */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, ci) => (
            <AnimatedContent key={ci} distance={30} delay={ci * 0.1}>
              <div>
                <h3 className="text-sm font-mono text-zinc-600 uppercase tracking-wider mb-4">
                  {cat.name}
                </h3>
                <div className="space-y-3">
                  {cat.techs.map((tech) => (
                    <div
                      key={tech.name}
                      className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 hover:border-zinc-600 transition-all duration-300"
                      style={{
                        ["--glow-color" as string]: tech.color,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: tech.color }}
                      />
                      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                        {tech.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedContent>
          ))}
        </div>
      </div>

      {/* Marquee */}
      <div className="mt-12">
        <ScrollVelocity
          texts={[
            "React · Next.js · TailwindCSS · TypeScript ·",
            "React Native · Expo · Node.js · Figma ·",
          ]}
          velocity={3}
          className="text-6xl md:text-8xl font-bold text-zinc-800/60 select-none"
          numCopies={8}
        />
      </div>
    </section>
  );
}
