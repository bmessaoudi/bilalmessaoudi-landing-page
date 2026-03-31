"use client";

import BlurText from "@/components/reactbits/BlurText";
import DecryptedText from "@/components/reactbits/DecryptedText";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import CountUp from "@/components/reactbits/CountUp";

const stats = [
  { value: 3, suffix: "+", label: "Anni Freelance" },
  { value: 20, suffix: "+", label: "Progetti" },
  { value: 100, suffix: "%", label: "Remoto" },
];

export default function About() {
  return (
    <section id="about" className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div>
            <BlurText
              text="Chi Sono"
              className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-8"
              delay={80}
              animateBy="words"
            />
            <div className="text-lg text-zinc-400 leading-relaxed space-y-4">
              <p>
                <DecryptedText
                  text="Sono uno sviluppatore freelance specializzato nella creazione di esperienze digitali che combinano design emozionale e performance tecnica."
                  speed={25}
                  maxIterations={12}
                  className="text-zinc-400"
                  encryptedClassName="text-zinc-600"
                  animateOn="view"
                />
              </p>
              <AnimatedContent distance={20} delay={0.3}>
                <p className="text-zinc-500">
                  Dal concept al deploy, lavoro con startup e aziende per trasformare idee complesse
                  in prodotti digitali intuitivi — web app, landing page immersive, app mobile native
                  con React Native ed Expo.
                </p>
              </AnimatedContent>
            </div>

            {/* Stats */}
            <AnimatedContent distance={30} delay={0.4}>
              <div className="flex gap-8 mt-10 pt-8 border-t border-zinc-800">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      <CountUp to={stat.value} suffix={stat.suffix} duration={2} />
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </AnimatedContent>
          </div>

          {/* Right: Visual */}
          <AnimatedContent distance={40} delay={0.2}>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-zinc-800/50 backdrop-blur-sm overflow-hidden flex items-center justify-center">
                {/* Abstract gradient shape */}
                <div className="relative w-48 h-48 md:w-64 md:h-64">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-600/40 blur-[60px] animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-500/20 blur-[30px]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl md:text-7xl font-bold text-white/10 select-none">BM</span>
                  </div>
                </div>
              </div>
              {/* Decorative corner */}
              <div className="absolute -top-2 -right-2 w-16 h-16 border-t border-r border-blue-500/20 rounded-tr-2xl" />
              <div className="absolute -bottom-2 -left-2 w-16 h-16 border-b border-l border-purple-500/20 rounded-bl-2xl" />
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
