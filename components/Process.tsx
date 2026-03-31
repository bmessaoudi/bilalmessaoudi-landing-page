"use client";

import AnimatedContent from "@/components/reactbits/AnimatedContent";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import BlurText from "@/components/reactbits/BlurText";

const steps = [
  {
    num: "01",
    title: "Parliamo",
    description:
      "Mi racconti la tua idea, definiamo insieme obiettivi e tempistiche.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Costruisco",
    description:
      "Design, sviluppo e test. Ti tengo aggiornato ad ogni passo.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Lanciamo",
    description:
      "Deploy, ottimizzazione e supporto. Il tuo prodotto è live.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
        <path d="M22 2L15 22l-4-9-9-4z" />
      </svg>
    ),
  },
];

export default function Process() {
  return (
    <section id="processo" className="py-20 md:py-28 lg:py-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <BlurText
            text="Come lavoro"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight justify-center"
            delay={80}
            animateBy="words"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {steps.map((step, i) => (
            <AnimatedContent key={i} distance={40} delay={i * 0.15}>
              <SpotlightCard
                spotlightColor="rgba(0,123,255,0.08)"
                className="h-full"
              >
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  {/* Step number + icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-950 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <span className="text-xs font-mono text-zinc-600">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
