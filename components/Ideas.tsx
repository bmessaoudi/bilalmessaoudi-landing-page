"use client";

import { ideas } from "@/lib/ideas";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import BlurText from "@/components/reactbits/BlurText";

function IdeaCard({ idea }: { idea: (typeof ideas)[0] }) {
  return (
    <SpotlightCard
      spotlightColor={`${idea.color}20`}
      className="h-full flex flex-col group"
    >
      {/* Color accent bar */}
      <div
        className="w-full h-1 rounded-full mb-5"
        style={{ background: `linear-gradient(90deg, ${idea.color}, ${idea.color}60)` }}
      />

      {/* Concept badge */}
      <span
        className="inline-flex self-start text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full mb-4 border"
        style={{
          color: idea.color,
          borderColor: `${idea.color}30`,
          background: `${idea.color}08`,
        }}
      >
        Concept
      </span>

      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
        {idea.title}
      </h3>
      <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-5 flex-1">
        {idea.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {idea.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-400 bg-zinc-900/50"
          >
            {tag}
          </span>
        ))}
      </div>
    </SpotlightCard>
  );
}

export default function Ideas() {
  return (
    <section id="idee" className="py-20 md:py-28 lg:py-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="mb-10 md:mb-14">
          <BlurText
            text="Cosa posso creare per te"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight"
            delay={80}
            animateBy="words"
          />
          <AnimatedContent distance={20} delay={0.2}>
            <p className="text-sm sm:text-base text-zinc-400 mt-4 max-w-lg">
              Ogni progetto parte da un&apos;idea. Ecco cosa mi entusiasma costruire
              — e che potrei realizzare per te.
            </p>
          </AnimatedContent>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {ideas.map((idea, i) => (
            <AnimatedContent key={i} distance={30} delay={i * 0.12}>
              <IdeaCard idea={idea} />
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
