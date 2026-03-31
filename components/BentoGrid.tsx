"use client";

import AnimatedContent from "@/components/reactbits/AnimatedContent";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import CountUp from "@/components/reactbits/CountUp";

const cards = [
  {
    title: "Frontend Emozionale",
    description:
      "Landing page che convertono e interfacce pixel-perfect per un'esperienza utente senza compromessi.",
    stat: { to: 50, suffix: "+", label: "Progetti Completati" },
    spotlight: "rgba(0,123,255,0.15)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    gridClass: "md:col-span-2 md:row-span-2",
  },
  {
    title: "App Native con Expo",
    description:
      "Sviluppo iOS e Android da un'unica base di codice con performance native reali.",
    stat: { to: 100, suffix: "%", label: "Codice Nativo" },
    spotlight: "rgba(138,43,226,0.15)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    gridClass: "md:col-span-2",
  },
  {
    title: "Backend & API",
    description:
      "Architetture server scalabili con Node.js, database relazionali e API RESTful/GraphQL.",
    stat: { to: 99, suffix: "%", label: "Uptime Garantito" },
    spotlight: "rgba(0,212,170,0.12)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    gridClass: "md:col-span-2",
  },
  {
    title: "UI/UX Design",
    description:
      "Prototipi interattivi e design system coerenti — da Figma al codice senza perdere un pixel.",
    stat: { to: 100, suffix: "%", label: "Pixel Perfect" },
    spotlight: "rgba(255,107,53,0.12)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    gridClass: "md:col-span-2",
  },
  {
    title: "Un Solo Referente",
    description:
      "Zero intermediari. Parlo la lingua del tuo business e traduco le tue esigenze in codice.",
    stat: { to: 0, suffix: "", label: "Intermediari" },
    spotlight: "rgba(255,255,255,0.06)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    gridClass: "md:col-span-4",
  },
];

export default function BentoGrid() {
  return (
    <section id="servizi" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <AnimatedContent key={i} distance={30} delay={i * 0.1}>
              <SpotlightCard
                spotlightColor={card.spotlight}
                className={`${card.gridClass} flex flex-col justify-between h-full group hover:-translate-y-1 transition-transform duration-300`}
              >
                <div>
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <div className="text-3xl font-bold text-white">
                    <CountUp
                      to={card.stat.to}
                      suffix={card.stat.suffix}
                      duration={2.5}
                    />
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    {card.stat.label}
                  </div>
                </div>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
