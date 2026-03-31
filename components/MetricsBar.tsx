"use client";

import CountUp from "@/components/reactbits/CountUp";
import AnimatedContent from "@/components/reactbits/AnimatedContent";

const metrics = [
  { value: 20, suffix: "+", label: "Progetti Completati" },
  { value: 15, suffix: "+", label: "Clienti Soddisfatti" },
  { value: 3, suffix: "+", label: "Anni Esperienza" },
  { value: 24, suffix: "h", label: "Tempo Risposta" },
];

export default function MetricsBar() {
  return (
    <section className="py-12">
      <AnimatedContent distance={30}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-zinc-900/30 backdrop-blur-sm border-y border-zinc-800 rounded-xl py-10 px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {metrics.map((metric, i) => (
                <div key={i}>
                  <div className="text-3xl md:text-4xl font-bold text-white">
                    <CountUp to={metric.value} suffix={metric.suffix} duration={2.5} />
                  </div>
                  <div className="text-sm text-zinc-500 mt-2">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedContent>
    </section>
  );
}
