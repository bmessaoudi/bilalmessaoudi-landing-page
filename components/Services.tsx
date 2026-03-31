"use client";

import BlurText from "@/components/reactbits/BlurText";
import MagicBento from "@/components/reactbits/MagicBento/MagicBento";

const cardData = [
  {
    color: "#060010",
    title: "Siti Web",
    description: "Veloci, belli, ottimizzati per convertire.",
    label: "Web",
  },
  {
    color: "#060010",
    title: "App Mobile",
    description: "iOS e Android da un'unica codebase.",
    label: "Mobile",
  },
  {
    color: "#060010",
    title: "Un unico referente",
    description:
      "Zero intermediari. Tu parli, io costruisco. Comunicazione diretta, tempi certi, nessuna sorpresa.",
    label: "Referente",
  },
  {
    color: "#060010",
    title: "Backend & API",
    description:
      "Architetture scalabili, database, autenticazione. L'infrastruttura che fa funzionare tutto.",
    label: "Infrastruttura",
  },
  {
    color: "#060010",
    title: "UI/UX Design",
    description: "Da Figma al codice, pixel perfect.",
    label: "Design",
  },
  {
    color: "#060010",
    title: "Consulenza",
    description: "Ti aiuto a scegliere il percorso giusto.",
    label: "Strategia",
  },
];

export default function Services() {
  return (
    <section id="servizi" className="py-20 md:py-28 lg:py-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <BlurText
            text="Cosa posso fare per te"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight justify-center"
            delay={80}
            animateBy="words"
          />
        </div>

        <div className="flex justify-center">
          <MagicBento
            cardData={cardData}
            textAutoHide={true}
            enableStars
            enableSpotlight
            enableBorderGlow={true}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect
            spotlightRadius={400}
            particleCount={12}
            glowColor="132, 0, 255"
            disableAnimations={false}
          />
        </div>
      </div>
    </section>
  );
}
