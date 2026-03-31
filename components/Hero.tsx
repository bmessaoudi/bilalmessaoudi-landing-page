"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import BlurText from "@/components/reactbits/BlurText";
import ShinyText from "@/components/reactbits/ShinyText";
import Magnet from "@/components/reactbits/Magnet";
import StarBorder from "@/components/reactbits/StarBorder";
import Particles from "@/components/reactbits/Particles";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { isMobile } from "@/lib/device";

const HeroBlob = dynamic(() => import("@/components/HeroBlob"), { ssr: false });

export default function Hero() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  const handleCTAClick = () => {
    const target = document.getElementById("contatti");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  const handleDiscoverClick = () => {
    const target = document.getElementById("servizi");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Particles background — hidden on mobile for performance */}
      {!mobile && (
        <div className="absolute inset-0 z-0 opacity-[0.07]">
          <Particles quantity={30} size={0.5} color="#ffffff" staticity={30} ease={80} />
        </div>
      )}

      {/* WebGL Blob */}
      <HeroBlob />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-6 text-center py-24">
        {/* Availability indicator */}
        <AnimatedContent distance={15} delay={0}>
          <div className="flex items-center gap-2.5 justify-center mb-8">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-zinc-400">
              Disponibile per nuovi progetti
            </span>
          </div>
        </AnimatedContent>

        {/* Headline */}
        <BlurText
          text="Trasformo la tua idea in un prodotto digitale."
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] justify-center"
          delay={100}
          animateBy="words"
        />

        <div className="mt-3 sm:mt-4">
          <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] gradient-text">
            Senza attrito.
          </span>
        </div>

        {/* Subtitle */}
        <AnimatedContent distance={20} delay={0.3}>
          <p className="text-base sm:text-lg md:text-xl text-zinc-400 leading-relaxed mt-6 max-w-2xl mx-auto">
            Web, mobile, design — un unico referente per portare
            il tuo progetto online.
          </p>
        </AnimatedContent>

        {/* CTAs */}
        <AnimatedContent distance={20} delay={0.5}>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Magnet padding={80}>
              <StarBorder
                className="cursor-pointer w-full sm:w-auto"
                color="rgba(0,123,255,0.6)"
                speed="5s"
                onClick={handleCTAClick}
              >
                <ShinyText
                  text="Parliamo del tuo progetto →"
                  speed={4}
                  className="text-white font-medium"
                />
              </StarBorder>
            </Magnet>

            <button
              onClick={handleDiscoverClick}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors py-2"
            >
              Scopri cosa posso fare ↓
            </button>
          </div>
        </AnimatedContent>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
